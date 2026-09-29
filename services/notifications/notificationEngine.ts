import type { UserContext, Task, Place } from "@/core/types";
import { getTasksByPlace } from "@/services/database/tasks";
import { isOnCooldown, recordNotification } from "@/services/database/settings";
import { sendNotification } from "./notificationService";
import { NOTIFICATION_COOLDOWN_MS } from "@/core/constants";

// In-memory set of task IDs notified during current presence to avoid spamming
const notifiedTaskIds = new Set<string>();

// In-memory rapid-fire guard: prevent the same place+event from firing twice within 3 seconds
const recentFireMap = new Map<string, number>();
const RAPID_FIRE_GUARD_MS = 3000;

export function isTaskTimeValid(task: Task, now = new Date()): boolean {
  // 1. Check Due Date (if specified, task shouldn't trigger before this date)
  if (task.dueDate) {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
    if (task.dueDate > todayStr) {
      return false;
    }
  }

  // 2. Check Time Range (Start Time & End Time)
  if (task.timeStart || task.timeEnd) {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    if (task.timeStart && task.timeEnd) {
      const [sh, sm] = task.timeStart.split(":").map(Number);
      const [eh, em] = task.timeEnd.split(":").map(Number);
      const startMin = sh * 60 + sm;
      const endMin = eh * 60 + em;

      if (startMin <= endMin) {
        if (currentMinutes < startMin || currentMinutes > endMin) return false;
      } else {
        // Overnight range (e.g. 22:00 to 06:00)
        if (currentMinutes < startMin && currentMinutes > endMin) return false;
      }
    } else if (task.timeStart) {
      const [sh, sm] = task.timeStart.split(":").map(Number);
      if (currentMinutes < sh * 60 + sm) return false;
    } else if (task.timeEnd) {
      const [eh, em] = task.timeEnd.split(":").map(Number);
      if (currentMinutes > eh * 60 + em) return false;
    }
  }

  // No specific time range means "Any time / whenever I come"
  return true;
}

export async function processContextEvent(context: UserContext) {
  const { event } = context;

  // On EXIT, the place just left is stored in previousPlace; on ENTER/STAY, it's currentPlace
  const targetPlace = event === "EXIT" ? context.previousPlace : context.currentPlace;

  if (event === "NONE" || event === "MOVING" || !targetPlace) {
    return;
  }

  // Rapid-fire guard: skip if the same place+event fired less than 3s ago
  const rapidKey = `${event}:${targetPlace.id}`;
  const lastFiredAt = recentFireMap.get(rapidKey) ?? 0;
  if (Date.now() - lastFiredAt < RAPID_FIRE_GUARD_MS) {
    console.log(`[Notification Engine] Rapid-fire guard blocked ${rapidKey}`);
    return;
  }
  recentFireMap.set(rapidKey, Date.now());

  const { useAppStore } = await import("@/store/appStore");
  const isDemo = useAppStore.getState().demoMode;

  // Check sessionStorage hide-until (set when user clicks X to hide the banner)
  // If the place is hidden and it's not demo mode, skip until the timer expires
  if (!isDemo && targetPlace.id) {
    try {
      const hideMap: Record<string, number> = JSON.parse(
        sessionStorage.getItem("nila_hide_until") ?? "{}"
      );
      const until = hideMap[targetPlace.id];
      if (until && Date.now() < until) {
        console.log(`[Notification Engine] Place hidden until ${new Date(until).toLocaleTimeString()} — skipping`);
        return;
      }
    } catch {
      // sessionStorage unavailable — skip guard
    }
  }

  // Fetch pending tasks for this place
  const tasks = await getTasksByPlace(targetPlace.id);
  const incompleteTasks = tasks.filter((t) => !t.completed);

  // Filter tasks that match the current time window
  const now = new Date();
  const eligibleTasks = incompleteTasks.filter((t) => isTaskTimeValid(t, now));

  // Determine unnotified tasks
  const unnotifiedArrivalTasks = eligibleTasks.filter(
    (t) => (t.triggerType === "ENTER" || t.triggerType === "NONE") && !notifiedTaskIds.has(t.id)
  );

  const cooldownKey = `${event}:${targetPlace.id}`;

  // If entering or staying and there are brand-new unnotified intentions, bypass cooldown
  const hasNewUnnotifiedTasks = unnotifiedArrivalTasks.length > 0;
  if (!isDemo && !hasNewUnnotifiedTasks && (await isOnCooldown(cooldownKey))) {
    console.log(`[Notification Engine] Suppressed ${event} at ${targetPlace.name} (Cooldown active)`);
    return;
  }

  let notificationTitle = "";
  let notificationBody = "";
  let tasksToMarkNotified: Task[] = [];

  if (event === "ENTER") {
    const enterTasks = eligibleTasks.filter((t) => t.triggerType === "ENTER");
    if (enterTasks.length > 0) {
      notificationTitle = `${targetPlace.emoji} Arrived at ${targetPlace.name}`;
      notificationBody = `You have ${enterTasks.length} reminder${enterTasks.length !== 1 ? "s" : ""}:\n${enterTasks
        .map((t) => "• " + t.title + (t.timeStart && t.timeEnd ? ` (${t.timeStart} - ${t.timeEnd})` : ""))
        .join("\n")}`;
      tasksToMarkNotified = enterTasks;
    } else if (eligibleTasks.length > 0) {
      notificationTitle = `${targetPlace.emoji} Welcome to ${targetPlace.name}`;
      notificationBody = `You have ${eligibleTasks.length} intention${eligibleTasks.length !== 1 ? "s" : ""} here:\n${eligibleTasks
        .map((t) => "• " + t.title)
        .join("\n")}`;
      tasksToMarkNotified = eligibleTasks;
    }
  } else if (event === "STAY") {
    // If the user is currently at this place and there are intentions they haven't been alerted for yet
    if (unnotifiedArrivalTasks.length > 0) {
      notificationTitle = `${targetPlace.emoji} You're at ${targetPlace.name}`;
      notificationBody = `You have ${unnotifiedArrivalTasks.length} active intention${
        unnotifiedArrivalTasks.length !== 1 ? "s" : ""
      } here:\n${unnotifiedArrivalTasks
        .map((t) => "• " + t.title + (t.timeStart && t.timeEnd ? ` (${t.timeStart} - ${t.timeEnd})` : ""))
        .join("\n")}`;
      tasksToMarkNotified = unnotifiedArrivalTasks;
    }
  } else if (event === "EXIT") {
    // Reset notified tasks for this place on departure so next arrival alerts again
    tasks.forEach((t) => notifiedTaskIds.delete(t.id));

    const exitTasks = eligibleTasks.filter((t) => t.triggerType === "EXIT");
    if (exitTasks.length > 0) {
      notificationTitle = `Leaving ${targetPlace.name}?`;
      notificationBody = `Don't forget:\n${exitTasks
        .map((t) => "• " + t.title + (t.timeStart && t.timeEnd ? ` (${t.timeStart} - ${t.timeEnd})` : ""))
        .join("\n")}`;
    } else if (eligibleTasks.length > 0) {
      notificationTitle = `Leaving ${targetPlace.name}?`;
      notificationBody = `You still have ${eligibleTasks.length} unfinished intention${
        eligibleTasks.length !== 1 ? "s" : ""
      } here.`;
    }
  }

  // Evaluate Custom Rules
  const { getRulesByPlace } = await import("@/services/database/rules");
  const placeRules = await getRulesByPlace(targetPlace.id);
  const { evaluateRules } = await import("@/core/context/rulesEngine");

  const triggeredRules = evaluateRules(context, placeRules);
  if (triggeredRules.length > 0) {
    if (!notificationTitle) notificationTitle = `${targetPlace.emoji} ${targetPlace.name} Routine`;
    const actions = triggeredRules.flatMap((r) => r.actionsTriggered);

    if (actions.includes("show_checklist")) {
      notificationBody += (notificationBody ? "\n\n" : "") + "📌 Your checklist is ready.";
    }
    if (actions.includes("start_timer")) {
      notificationBody += (notificationBody ? "\n\n" : "") + "⏱️ A timer has been started.";
    }
  }

  // Send the notification if we have something to say
  if (notificationTitle && notificationBody) {
    // Mark tasks as notified
    tasksToMarkNotified.forEach((t) => notifiedTaskIds.add(t.id));

    sendNotification(notificationTitle, { body: notificationBody });

    // Determine which alert sound to play (task specific or global setting)
    const relevantTasks = eligibleTasks.length > 0 ? eligibleTasks : incompleteTasks;
    const taskSound = relevantTasks.find((t) => t.alertSound)?.alertSound;
    const appDefaultSound = useAppStore.getState().settings.alertSound ?? "chime";
    const soundToPlay = taskSound ?? appDefaultSound;

    // Play mindful alarm chime/music for first 20 seconds
    const { startAlarmAudio } = await import("./soundService");
    startAlarmAudio(20, soundToPlay);

    // Show top notification banner with Stop, Snooze, and Reschedule options
    useAppStore.getState().setActiveAlert({
      id: `alert-${Date.now()}`,
      title: notificationTitle,
      body: notificationBody,
      placeId: targetPlace.id,
      placeName: targetPlace.name,
      placeEmoji: targetPlace.emoji,
      tasks: relevantTasks,
      alertSound: soundToPlay,
    });

    // Record cooldown so we don't fire this again soon
    await recordNotification(cooldownKey, targetPlace.id, NOTIFICATION_COOLDOWN_MS);
  }
}

/**
 * Directly check intentions for a place if the user is currently located there.
 * Called when a new task is added or edited while the user is physically present at the place.
 */
export async function triggerPresenceCheckForPlace(placeId: string): Promise<boolean> {
  const { useAppStore } = await import("@/store/appStore");
  const { isInsideGeofence } = await import("@/services/location/geofenceService");
  const { getPlace } = await import("@/services/database/places");

  const place = await getPlace(placeId);
  if (!place) return false;

  const state = useAppStore.getState();
  const currentCoords = state.coords;

  const isHere =
    (currentCoords && isInsideGeofence(currentCoords, place)) ||
    (state.demoMode && state.demoLocationName === place.name) ||
    state.userContext?.currentPlace?.id === place.id;

  if (isHere) {
    // Re-evaluate context with ENTER event to trigger all arrival intentions
    await processContextEvent({
      currentPlace: place,
      event: "ENTER",
      nearbyPlaces: [],
      coords: currentCoords || undefined,
      timestamp: new Date().toISOString(),
    });
    return true;
  }
  return false;
}
