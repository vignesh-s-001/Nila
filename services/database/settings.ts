import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { AppSettings } from "@/core/types";
import { DEFAULT_SETTINGS } from "@/core/types";

// ─── Settings Service ──────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const db = getDB();
  const rows = await db.settings.toArray();
  const map: Record<string, unknown> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return { ...DEFAULT_SETTINGS, ...map } as AppSettings;
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const db = getDB();
  await db.settings.put({ key: key as string, value });
}

export async function setSettings(updates: Partial<AppSettings>): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.settings, async () => {
    for (const [key, value] of Object.entries(updates)) {
      await db.settings.put({ key, value });
    }
  });
}

// ─── Notification History ──────────────────────────────────

export async function recordNotification(
  type: string,
  placeId?: string,
  cooldownMs = 5 * 60 * 1000
): Promise<void> {
  const db = getDB();
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + cooldownMs);
  await db.notificationHistory.add({
    id: uuidv4(),
    type,
    placeId,
    sentAt: now.toISOString(),
    cooldownUntil: cooldownUntil.toISOString(),
  });
}

export async function isOnCooldown(type: string): Promise<boolean> {
  const db = getDB();
  const now = new Date().toISOString();
  const recent = await db.notificationHistory
    .where("type")
    .equals(type)
    .toArray();
  return recent.some((n) => n.cooldownUntil > now);
}

export async function clearNotificationHistory(): Promise<void> {
  const db = getDB();
  await db.notificationHistory.clear();
}

export async function deleteLocationHistory(): Promise<void> {
  // Location history is not stored — this is a no-op placeholder for UI
  // All location processing is done in-memory only
  console.info("Location history cleared (was never stored)");
}
