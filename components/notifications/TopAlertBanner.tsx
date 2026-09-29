"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/appStore";
import { stopAlarmAudio, isAlarmPlaying } from "@/services/notifications/soundService";
import toast from "react-hot-toast";

// ─── Session-persistent hide timer ─────────────────────────
// key → { placeId, expiresAt (ms) }
const HIDE_KEY = "nila_hide_until";

interface HideUntilMap {
  [placeId: string]: number; // unix ms
}

function getHideUntilMap(): HideUntilMap {
  try {
    return JSON.parse(sessionStorage.getItem(HIDE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function setHideUntil(placeId: string, expiresAt: number) {
  const map = getHideUntilMap();
  map[placeId] = expiresAt;
  sessionStorage.setItem(HIDE_KEY, JSON.stringify(map));
}

function clearHideUntil(placeId: string) {
  const map = getHideUntilMap();
  delete map[placeId];
  sessionStorage.setItem(HIDE_KEY, JSON.stringify(map));
}

export function isHiddenUntil(placeId: string): boolean {
  const map = getHideUntilMap();
  const until = map[placeId];
  if (!until) return false;
  if (Date.now() >= until) {
    clearHideUntil(placeId);
    return false;
  }
  return true;
}

// ─── Module-level timer holders ────────────────────────────
let snoozeTimeoutId: NodeJS.Timeout | null = null;
let hideCheckTimeoutId: NodeJS.Timeout | null = null;

export function TopAlertBanner() {
  const { activeAlert, setActiveAlert, setEditingIntention } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(20);

  // Monitor sound playing status and 20s countdown
  useEffect(() => {
    if (!activeAlert) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    setSecondsRemaining(20);

    const interval = setInterval(() => {
      if (isAlarmPlaying()) {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
      } else {
        setIsPlaying(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeAlert]);

  if (!activeAlert) return null;

  /** Fully dismiss the alert — no re-check */
  const handleStop = () => {
    stopAlarmAudio();
    if (activeAlert.placeId) clearHideUntil(activeAlert.placeId);
    setActiveAlert(null);
    if (snoozeTimeoutId) clearTimeout(snoozeTimeoutId);
    if (hideCheckTimeoutId) clearTimeout(hideCheckTimeoutId);
    toast("Alert stopped", { icon: "⏹️" });
  };

  /**
   * Hide (X) — dismiss visually for now, re-check in 5 minutes.
   * Persists "hidden until" in sessionStorage so page reload also waits 5 min.
   * If the user is still at the place after 5 min → re-alert.
   * If they've left → stay silent.
   */
  const handleHide = () => {
    stopAlarmAudio();
    const alertCopy = { ...activeAlert };
    setActiveAlert(null);

    if (hideCheckTimeoutId) clearTimeout(hideCheckTimeoutId);

    const FIVE_MIN_MS = 5 * 60 * 1000;
    const expiresAt = Date.now() + FIVE_MIN_MS;

    // Persist so page reload respects the 5-min wait
    if (alertCopy.placeId) {
      setHideUntil(alertCopy.placeId, expiresAt);
    }

    toast("Hidden — Nila will check again in 5 min", { icon: "🕐", duration: 3000 });

    hideCheckTimeoutId = setTimeout(async () => {
      if (alertCopy.placeId) clearHideUntil(alertCopy.placeId);

      const { useAppStore: store } = await import("@/store/appStore");
      const { isInsideGeofence } = await import("@/services/location/geofenceService");
      const { getPlace } = await import("@/services/database/places");

      const state = store.getState();

      // Don't re-alert if another alert is already showing
      if (state.activeAlert) return;

      const place = alertCopy.placeId ? await getPlace(alertCopy.placeId) : null;
      if (!place) return;

      const coords = state.coords;
      const isStillHere =
        (coords && isInsideGeofence(coords, place)) ||
        (state.demoMode && state.demoLocationName === place.name) ||
        state.userContext?.currentPlace?.id === place.id;

      if (isStillHere) {
        const { startAlarmAudio } = await import("@/services/notifications/soundService");
        startAlarmAudio(20, alertCopy.alertSound);
        store.getState().setActiveAlert({
          ...alertCopy,
          id: `alert-${Date.now()}`,
          title: `${alertCopy.placeEmoji ?? "📍"} Still at ${alertCopy.placeName}`,
        });
        toast(`Still at ${alertCopy.placeName} — reminding you again`, { icon: "🔔" });
      } else {
        console.log("[TopAlertBanner] User left the place after hide — no re-alert");
      }
    }, FIVE_MIN_MS);
  };

  /** Snooze 5 min — always re-alert regardless of location */
  const handleSnooze = () => {
    stopAlarmAudio();
    const alertCopy = { ...activeAlert };
    setActiveAlert(null);

    if (snoozeTimeoutId) clearTimeout(snoozeTimeoutId);

    toast.success("Snoozed for 5 minutes. Nila will remind you again.", {
      icon: "⏰",
      duration: 4000,
    });

    snoozeTimeoutId = setTimeout(async () => {
      const { startAlarmAudio } = await import("@/services/notifications/soundService");
      startAlarmAudio(20, alertCopy.alertSound);
      useAppStore.getState().setActiveAlert({
        ...alertCopy,
        id: `alert-${Date.now()}`,
        title: `⏰ Snoozed: ${alertCopy.title}`,
      });
    }, 5 * 60 * 1000);
  };

  const handleReschedule = () => {
    stopAlarmAudio();
    const targetTask = activeAlert.tasks && activeAlert.tasks.length > 0 ? activeAlert.tasks[0] : null;

    setActiveAlert(null);

    if (targetTask) {
      setEditingIntention(targetTask);
      toast("Reschedule your intention timing", { icon: "🗓️" });
    } else {
      toast("No specific intention to reschedule", { icon: "ℹ️" });
    }
  };

  return (
    <div
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg animate-slide-down"
      style={{ animationDuration: "350ms" }}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-surface-container-lowest/95 dark:bg-slate-900/95 backdrop-blur-xl border-2 border-primary/40 rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(158,54,92,0.35)] flex flex-col gap-3">
        {/* Top Header info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 text-xl font-bold ring-2 ring-primary/20">
              {activeAlert.placeEmoji || "📍"}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-on-surface text-base leading-tight">
                  {activeAlert.title}
                </h3>
                {isPlaying && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary text-on-primary animate-pulse">
                    <span className="material-symbols-outlined text-[12px]">music_note</span>
                    {secondsRemaining}s
                  </span>
                )}
              </div>
              <p className="text-secondary text-xs mt-1 whitespace-pre-line leading-relaxed">
                {activeAlert.body}
              </p>
            </div>
          </div>

          {/* X = Hide: dismiss now but re-check in 5 min if still here */}
          <button
            onClick={handleHide}
            className="text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors flex-shrink-0"
            title="Hide — check again in 5 min if you're still here"
            aria-label="Hide alert and check again in 5 minutes"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Audio playing visual indicator */}
        {isPlaying && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-surface-container-low border border-primary/20 text-xs text-primary font-medium">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] animate-bounce">
                volume_up
              </span>
              <span>Playing mindful alert chime ({secondsRemaining}s remaining)</span>
            </div>
            <div className="flex items-center gap-0.5 h-3">
              <span className="w-1 bg-primary rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3"></span>
              <span className="w-1 bg-primary rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-2"></span>
              <span className="w-1 bg-primary rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s] h-3.5"></span>
              <span className="w-1 bg-primary rounded-full animate-[pulse_0.7s_ease-in-out_infinite_0.1s] h-1.5"></span>
            </div>
          </div>
        )}

        {/* 3 Action Buttons: Stop, Snooze, Reschedule */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-outline-variant/30">
          <button
            type="button"
            onClick={handleStop}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-surface-container-low hover:bg-error-container hover:text-on-error-container text-on-surface transition-all active:scale-95 border border-outline-variant/40"
            title="Stop alert completely"
          >
            <span className="material-symbols-outlined text-[16px] text-error">stop_circle</span>
            <span>Stop</span>
          </button>

          <button
            type="button"
            onClick={handleSnooze}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-surface-container-low hover:bg-secondary-container hover:text-on-secondary-container text-on-surface transition-all active:scale-95 border border-outline-variant/40"
            title="Snooze 5 minutes — re-alert regardless of location"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">snooze</span>
            <span>Snooze (5m)</span>
          </button>

          <button
            type="button"
            onClick={handleReschedule}
            className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-container text-on-primary font-semibold transition-all active:scale-95 shadow-sm"
            title="Edit the intention timing"
          >
            <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
            <span>Reschedule</span>
          </button>
        </div>
      </div>
    </div>
  );
}
