"use client";

import { create } from "zustand";
import type { UserContext, AppSettings, Journey, Coordinates, Task, AuthUser } from "@/core/types";
import { DEFAULT_SETTINGS } from "@/core/types";
import { DEMO_LOCATIONS } from "@/core/constants";

interface AppState {
  // ─── Auth ─────────────────────────────────────────────────
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;

  // ─── Context ──────────────────────────────────────────────
  userContext: UserContext | null;
  setUserContext: (ctx: UserContext) => void;

  // ─── Settings ─────────────────────────────────────────────
  settings: AppSettings;
  setSettings: (s: Partial<AppSettings>) => void;

  // ─── Active journey ───────────────────────────────────────
  activeJourney: Journey | null;
  setActiveJourney: (j: Journey | null) => void;

  // ─── Location ─────────────────────────────────────────────
  coords: Coordinates | null;
  setCoords: (c: Coordinates | null) => void;
  locationPermission: PermissionState | "unknown";
  setLocationPermission: (p: PermissionState | "unknown") => void;

  // ─── Notification permission ──────────────────────────────
  notificationPermission: NotificationPermission | "unknown";
  setNotificationPermission: (p: NotificationPermission | "unknown") => void;

  // ─── Demo mode ────────────────────────────────────────────
  demoMode: boolean;
  demoLocationName: string;
  demoCoords: Coordinates | null;
  setDemoMode: (enabled: boolean, locationName?: string, coords?: Coordinates | null) => void;

  // ─── UI state ─────────────────────────────────────────────
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // ─── Active Alert (Top Banner with Music & Actions) ───────
  activeAlert: ActiveAlert | null;
  setActiveAlert: (alert: ActiveAlert | null) => void;

  // ─── Editing Intention ────────────────────────────────────
  editingIntention: Task | null;
  setEditingIntention: (task: Task | null) => void;
}

export interface ActiveAlert {
  id: string;
  title: string;
  body: string;
  placeId?: string;
  placeName?: string;
  placeEmoji?: string;
  tasks?: Task[];
  alertSound?: import("@/core/types").AlertSound;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Context
  userContext: null,
  setUserContext: (ctx) => set({ userContext: ctx }),

  // Settings
  settings: DEFAULT_SETTINGS,
  setSettings: (updates) =>
    set((state) => ({ settings: { ...state.settings, ...updates } })),

  // Active journey
  activeJourney: null,
  setActiveJourney: (j) => set({ activeJourney: j }),

  // Location
  coords: null,
  setCoords: (c) => set({ coords: c }),
  locationPermission: "unknown",
  setLocationPermission: (p) => set({ locationPermission: p }),

  // Notifications
  notificationPermission: "unknown",
  setNotificationPermission: (p) => set({ notificationPermission: p }),

  // Demo mode
  demoMode: false,
  demoLocationName: "",
  demoCoords: null,
  setDemoMode: (enabled, locationName = "", coords = null) => {
    let activeCoords = coords;
    if (enabled && !activeCoords && locationName) {
      const demoLoc = DEMO_LOCATIONS.find((l) => l.name === locationName);
      if (demoLoc) activeCoords = { lat: demoLoc.lat, lng: demoLoc.lng, accuracy: 5 };
    }
    set({
      demoMode: enabled,
      demoLocationName: locationName,
      demoCoords: activeCoords,
      ...(enabled ? { coords: activeCoords } : {}),
    });
  },

  // UI
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  // Active Alert
  activeAlert: null,
  setActiveAlert: (alert) => set({ activeAlert: alert }),

  // Editing Intention
  editingIntention: null,
  setEditingIntention: (task) => set({ editingIntention: task }),
}));
