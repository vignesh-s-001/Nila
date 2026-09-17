"use client";

import { getDB } from "@/core/db";

export interface CustomAudioSound {
  id: string; // e.g. "custom_1710000000000"
  name: string; // display name e.g. "Peaceful Piano"
  fileName: string; // original filename e.g. "piano.mp3"
  dataUrl: string; // data:audio/mpeg;base64,...
  createdAt: string;
}

const CUSTOM_SOUNDS_KEY = "custom_audio_sounds";

// In-memory cache for instant synchronous lookup
let cachedCustomSounds: CustomAudioSound[] = [];
let isLoaded = false;

export async function getCustomSounds(): Promise<CustomAudioSound[]> {
  if (typeof window === "undefined") return [];
  try {
    const db = getDB();
    const row = await db.settings.get(CUSTOM_SOUNDS_KEY);
    const list = (row?.value as CustomAudioSound[]) ?? [];
    cachedCustomSounds = list;
    isLoaded = true;
    return list;
  } catch {
    return cachedCustomSounds;
  }
}

export function getCachedCustomSound(id: string): CustomAudioSound | undefined {
  return cachedCustomSounds.find((s) => s.id === id);
}

export async function saveCustomAudioFile(file: File): Promise<CustomAudioSound> {
  return new Promise((resolve, reject) => {
    // Check file size (max ~10MB for smooth client-side storage)
    if (file.size > 12 * 1024 * 1024) {
      reject(new Error("Audio file must be under 12MB."));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const displayName = file.name.replace(/\.[^/.]+$/, ""); // Strip file extension
        const newSound: CustomAudioSound = {
          id: `custom_${Date.now()}`,
          name: displayName,
          fileName: file.name,
          dataUrl,
          createdAt: new Date().toISOString(),
        };

        const existing = await getCustomSounds();
        const updated = [...existing, newSound];
        cachedCustomSounds = updated;

        const db = getDB();
        await db.settings.put({ key: CUSTOM_SOUNDS_KEY, value: updated });
        resolve(newSound);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read audio file."));
    reader.readAsDataURL(file);
  });
}

export async function deleteCustomAudioSound(id: string): Promise<void> {
  const existing = await getCustomSounds();
  const updated = existing.filter((s) => s.id !== id);
  cachedCustomSounds = updated;
  const db = getDB();
  await db.settings.put({ key: CUSTOM_SOUNDS_KEY, value: updated });
}

