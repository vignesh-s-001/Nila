import toast from "react-hot-toast";

export async function requestNotificationPermission(): Promise<NotificationPermission | "unknown"> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return "unknown";
  }

  try {
    if (Notification.permission === "granted") {
      return "granted";
    }
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return Notification.permission;
  } catch (e) {
    console.error("Failed to request notification permission", e);
    return "unknown";
  }
}

export function getNotificationPermissionState(): NotificationPermission | "unknown" {
  if (typeof window === "undefined" || !("Notification" in window)) return "unknown";
  return Notification.permission;
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  // 1. In-app visual notification banner (always visible even without desktop notification permissions)
  toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? "animate-enter" : "animate-leave"
        } max-w-md w-full bg-white dark:bg-slate-900 border-2 border-amber-500/50 shadow-2xl rounded-2xl p-4 flex gap-3 items-start pointer-events-auto`}
        style={{
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center flex-shrink-0 text-xl font-bold">
          📍
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{title}</p>
          {options?.body && (
            <p className="text-slate-600 dark:text-slate-300 text-xs whitespace-pre-line leading-relaxed">
              {options.body}
            </p>
          )}
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 text-xs"
          aria-label="Close notification"
        >
          ✕
        </button>
      </div>
    ),
    { duration: 8000 }
  );

  // 2. Play subtle alert chime
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio may be blocked before first user interaction
  }

  // 3. Desktop Web Notification (if permission granted or can prompt)
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(title, {
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          ...options,
        });

        notification.onclick = function () {
          window.focus();
          this.close();
        };
      } catch (e) {
        console.warn("Failed to send native notification. May require ServiceWorker.", e);
      }
    } else if (Notification.permission === "default") {
      // Request permission on user context
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          new Notification(title, {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-72x72.png",
            ...options,
          });
        }
      });
    }
  }
}
