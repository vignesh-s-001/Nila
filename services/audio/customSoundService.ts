"use client";

import { getSettings, setSetting } from "@/services/database/settings";
import type { AppSettings } from "@/core/types";

export interface CustomAudioSound {
  id: string; // e.g. "custom_1710000000000"
  name: string; // display name e.g. "Peaceful Piano"
  fileName: string; // original filename e.g. "piano.mp3"
  dataUrl: string; // data:audio/mpeg;base64,...
  createdAt: string;
}

const CUSTOM_SOUNDS_KEY: keyof AppSettings = "alertSound"; // we'll store array as JSON in a separate settings key
// We use a dedicated localStorage key for custom audio blobs since they can be large
const LS_KEY = "nila_custom_audio_sounds";

// In-memory cache for instant synchronous lookup
let cachedCustomSounds: CustomAudioSound[] = [];
let isLoaded = false;

export async function getCustomSounds(): Promise<CustomAudioSound[]> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_KEY);
    const list: CustomAudioSound[] = raw ? JSON.parse(raw) : [];
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

        localStorage.setItem(LS_KEY, JSON.stringify(updated));
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
  localStorage.setItem(LS_KEY, JSON.stringify(updated));
}
