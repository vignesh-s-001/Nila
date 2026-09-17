import type { PlaceColor, SelectOption } from "@/core/types";

// ─── Geofencing ────────────────────────────────────────────
export const DEFAULT_GEOFENCE_RADIUS = 150; // metres
export const MIN_GEOFENCE_RADIUS = 50;
export const MAX_GEOFENCE_RADIUS = 2000;
export const APPROACH_MULTIPLIER = 3; // approach = radius * 3
export const STAY_DURATION_DEFAULT = 5; // minutes

// ─── Location ──────────────────────────────────────────────
export const LOCATION_UPDATE_INTERVAL = 30_000; // ms – normal mode
export const LOCATION_JOURNEY_INTERVAL = 10_000; // ms – journey active
export const LOCATION_MAX_AGE = 30_000; // ms
export const LOCATION_TIMEOUT = 15_000; // ms

// ─── Notifications ─────────────────────────────────────────
export const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1_000; // 5 minutes
export const NOTIFICATION_APP_NAME = "Context";

// ─── Place Emojis ──────────────────────────────────────────
export const PLACE_EMOJIS: SelectOption[] = [
  { label: "Home", value: "🏠" },
  { label: "Office", value: "🏢" },
  { label: "Gym", value: "🏋️" },
  { label: "Library", value: "📚" },
  { label: "Supermarket", value: "🛒" },
  { label: "Metro / Train", value: "🚇" },
  { label: "Hospital", value: "🏥" },
  { label: "Restaurant", value: "🍽️" },
  { label: "Park", value: "🌳" },
  { label: "School", value: "🏫" },
  { label: "Airport", value: "✈️" },
  { label: "Hotel", value: "🏨" },
  { label: "Coffee Shop", value: "☕" },
  { label: "Mall", value: "🏬" },
  { label: "Pharmacy", value: "💊" },
  { label: "Bank", value: "🏦" },
  { label: "Gas Station", value: "⛽" },
  { label: "Place", value: "📍" },
];

// ─── Place Colors ──────────────────────────────────────────
export const PLACE_COLORS: { value: PlaceColor; label: string; hex: string; light: string }[] = [
  { value: "blue",   label: "Blue",   hex: "#3B82F6", light: "#EFF6FF" },
  { value: "purple", label: "Purple", hex: "#8B5CF6", light: "#F5F3FF" },
  { value: "green",  label: "Green",  hex: "#10B981", light: "#ECFDF5" },
  { value: "orange", label: "Orange", hex: "#F59E0B", light: "#FFFBEB" },
  { value: "red",    label: "Red",    hex: "#EF4444", light: "#FEF2F2" },
  { value: "pink",   label: "Pink",   hex: "#EC4899", light: "#FDF2F8" },
  { value: "teal",   label: "Teal",   hex: "#14B8A6", light: "#F0FDFA" },
  { value: "amber",  label: "Amber",  hex: "#D97706", light: "#FFFBEB" },
  { value: "indigo", label: "Indigo", hex: "#6366F1", light: "#EEF2FF" },
  { value: "rose",   label: "Rose",   hex: "#F43F5E", light: "#FFF1F2" },
];

export function getPlaceColorHex(color: PlaceColor): string {
  return PLACE_COLORS.find((c) => c.value === color)?.hex ?? "#3B82F6";
}

// ─── Priority ──────────────────────────────────────────────
export const PRIORITY_CONFIG = {
  low:    { label: "Low",    color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-800" },
  medium: { label: "Medium", color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-900/30" },
  high:   { label: "High",   color: "text-red-600",    bg: "bg-red-50 dark:bg-red-900/30" },
} as const;

// ─── Trigger Labels ────────────────────────────────────────
export const TRIGGER_LABELS = {
  NONE:     "No location trigger",
  ENTER:    "When I arrive",
  EXIT:     "When I leave",
  APPROACH: "When I approach",
  STAY:     "When I stay",
} as const;

// ─── Demo Locations ────────────────────────────────────────
export const DEMO_LOCATIONS = [
  { name: "Home",         lat: 13.0827, lng: 80.2707, emoji: "🏠" },
  { name: "Office",       lat: 13.0569, lng: 80.2425, emoji: "🏢" },
  { name: "Gym",          lat: 13.0612, lng: 80.2490, emoji: "🏋️" },
  { name: "Library",      lat: 13.0678, lng: 80.2550, emoji: "📚" },
  { name: "Supermarket",  lat: 13.0750, lng: 80.2650, emoji: "🛒" },
  { name: "Metro Stn 1",  lat: 13.0840, lng: 80.2720, emoji: "🚇" },
  { name: "Metro Stn 2",  lat: 13.0900, lng: 80.2800, emoji: "🚇" },
  { name: "Metro Stn 3",  lat: 13.0960, lng: 80.2870, emoji: "🚇" },
] as const;

// ─── Navigation ────────────────────────────────────────────
export const NAV_ITEMS = [
  { href: "/",         label: "Home",    icon: "Home"    },
  { href: "/places",   label: "Places",  icon: "MapPin"  },
  { href: "/tasks",    label: "Tasks",   icon: "CheckSquare" },
  { href: "/journey",  label: "Journey", icon: "Train"   },
  { href: "/settings", label: "Settings",icon: "Settings"},
] as const;
