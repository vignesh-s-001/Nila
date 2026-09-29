import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { AppSettings } from "@/core/types";
import { DEFAULT_SETTINGS } from "@/core/types";

// ─── Settings Service ──────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw new Error(error.message);

  const map: Record<string, unknown> = {};
  for (const row of data ?? []) {
    map[row.key] = row.value;
  }
  return { ...DEFAULT_SETTINGS, ...map } as AppSettings;
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert({ key: key as string, value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function setSettings(updates: Partial<AppSettings>): Promise<void> {
  const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
  const { error } = await supabase
    .from("settings")
    .upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

// ─── Notification History ──────────────────────────────────

export async function recordNotification(
  type: string,
  placeId?: string,
  cooldownMs = 5 * 60 * 1000
): Promise<void> {
  const now = new Date();
  const cooldownUntil = new Date(now.getTime() + cooldownMs);

  const { error } = await supabase.from("notification_history").insert({
    id:             uuidv4(),
    type,
    place_id:       placeId ?? null,
    sent_at:        now.toISOString(),
    cooldown_until: cooldownUntil.toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function isOnCooldown(type: string): Promise<boolean> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("notification_history")
    .select("cooldown_until")
    .eq("type", type);

  if (error) throw new Error(error.message);
  return (data ?? []).some((n) => n.cooldown_until > now);
}

export async function clearNotificationHistory(): Promise<void> {
  const { error } = await supabase.from("notification_history").delete().neq("id", "");
  if (error) throw new Error(error.message);
}

export async function deleteLocationHistory(): Promise<void> {
  // Location history is not stored — this is a no-op placeholder for UI
  // All location processing is done in-memory only
  console.info("Location history cleared (was never stored)");
}
