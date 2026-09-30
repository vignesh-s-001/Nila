// ============================================================
// Core domain types for the Context app
// ============================================================

// ─── Places ────────────────────────────────────────────────

export type PlaceIcon =
  | "home" | "office" | "gym" | "library" | "supermarket"
  | "metro" | "hospital" | "restaurant" | "park" | "school"
  | "airport" | "hotel" | "coffee" | "mall" | "pharmacy" | "custom";

export type PlaceColor =
  | "blue" | "purple" | "green" | "orange" | "red"
  | "pink" | "teal" | "amber" | "indigo" | "rose";

export interface Place {
  id: string;
  userId?: string;
  name: string;
  emoji: string;
  color: PlaceColor;
  lat: number;
  lng: number;
  radius: number; // metres
  address?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Tasks ─────────────────────────────────────────────────

export type TaskPriority = "low" | "medium" | "high";
export type TriggerType = "NONE" | "ENTER" | "EXIT" | "APPROACH" | "STAY";
export type RepeatType = "none" | "daily" | "weekdays" | "weekends" | "weekly" | "monthly";
export type AlertSound = "chime" | "bell" | "bowl" | "birds" | "marimba" | (string & {});

export interface AlertSoundOption {
  id: AlertSound;
  name: string;
  emoji: string;
  description: string;
}

export const ALERT_SOUNDS: AlertSoundOption[] = [
  { id: "chime",   name: "Zen Chime",     emoji: "🎐", description: "Peaceful melodic pentatonic sequence" },
  { id: "bell",    name: "Mindful Bell",  emoji: "🔔", description: "Resonant acoustic temple bell chime" },
  { id: "bowl",    name: "Singing Bowl",  emoji: "🥣", description: "Deep meditative Tibetan singing bowl" },
  { id: "birds",   name: "Morning Birds", emoji: "🐦", description: "Gentle morning forest birdsong" },
  { id: "marimba", name: "Warm Marimba",  emoji: "🪵", description: "Uplifting warm wooden arpeggio" },
];

export interface Task {
  id: string;
  userId?: string;
  placeId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;      // ISO date string YYYY-MM-DD
  dueTime?: string;      // HH:MM
  timeStart?: string;    // HH:MM (e.g. 09:00)
  timeEnd?: string;      // HH:MM (e.g. 17:00)
  repeat: RepeatType;
  completed: boolean;
  completedAt?: string;
  triggerType: TriggerType;
  alertSound?: AlertSound;
  createdAt: string;
  updatedAt: string;
}

// ─── Notes ─────────────────────────────────────────────────

export interface Note {
  id: string;
  userId?: string;
  placeId?: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Checklists ────────────────────────────────────────────

export interface Checklist {
  id: string;
  userId?: string;
  placeId?: string;
  journeyId?: string;
  name: string;
  title?: string; // alias kept for backwards compat
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  checklistId: string;
  text: string;
  completed: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Reminders ─────────────────────────────────────────────

export interface Reminder {
  id: string;
  placeId?: string;
  taskId?: string;
  title: string;
  triggerType: TriggerType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Rules ─────────────────────────────────────────────────

/** Rule conditions are stored as an object (not array) in rulesEngine */
export interface RuleCondition {
  type?: string;
  value?: unknown;
  timeStart?: string;
  timeEnd?: string;
  days?: number[];
}

export interface Rule {
  id: string;
  placeId: string;
  triggerEvent: TriggerType;
  conditions: RuleCondition;
  actions: string[];
  actionsTriggered: string[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Journeys ──────────────────────────────────────────────

export type JourneyStatus = "planned" | "active" | "completed" | "cancelled";
export type TransportMode = "metro" | "bus" | "walk" | "auto" | "cab" | "train";

export interface Journey {
  id: string;
  userId?: string;
  /** Display name of the journey */
  name: string;
  status: JourneyStatus;
  transportMode?: TransportMode;
  // Origin
  startName: string;
  startLat: number;
  startLng: number;
  // Destination
  destName: string;
  destLat: number;
  destLng: number;
  /** Alert distance in metres when approaching destination */
  alertDistance: number;
  // Saved place references (optional)
  startPlaceId?: string;
  endPlaceId?: string;
  // Legacy fields kept for data compat
  startAddress?: string;
  endAddress?: string;
  alertDistanceMeters?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JourneyStation {
  id: string;
  journeyId: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
  reached: boolean;
  reachedAt?: string;
  createdAt?: string;
}

export interface JourneyProgress {
  currentStationIndex: number;
  stopsRemaining: number;
  distanceToDestination: number;
  approachingDestination: boolean;
  veryClose: boolean;
  isNearDestination?: boolean;
}

// ─── Notification History ──────────────────────────────────

export interface NotificationHistory {
  id: string;
  placeId?: string;
  type: string;
  sentAt: string;
  /** ISO string — notification suppressed until this time */
  cooldownUntil: string;
  /** Legacy alias */
  expiresAt?: string;
}

// ─── Authentication ────────────────────────────────────────

export type UserRole = "admin" | "special" | "user";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  /** PBKDF2 hash — never plaintext */
  passwordHash: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/** Minimal public representation stored in Zustand / sessionStorage */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// ─── Settings ──────────────────────────────────────────────

export type AIProvider = "openai" | "gemini";

export interface AppSettings {
  // Notifications
  notificationsEnabled: boolean;
  // Location
  locationEnabled: boolean;
  locationUpdateInterval: number; // seconds
  // Appearance
  theme: "light" | "dark" | "system";
  // AI
  aiEnabled: boolean;
  aiProvider: AIProvider;
  aiApiKey?: string; // stored separately in secure storage
  aiFeatureSmartParsing: boolean;
  aiFeatureTaskExtraction: boolean;
  aiFeatureSummaries: boolean;
  // Privacy
  locationHistoryEnabled: boolean;
  // Sound & Alerts
  alertSound?: AlertSound;
  // Demo
  demoMode: boolean;
  demoLocation?: { lat: number; lng: number; name: string };
  // Onboarding
  onboardingComplete: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  locationEnabled: true,
  locationUpdateInterval: 30,
  theme: "light",
  alertSound: "chime",
  aiEnabled: false,
  aiProvider: "openai",
  aiFeatureSmartParsing: true,
  aiFeatureTaskExtraction: true,
  aiFeatureSummaries: true,
  locationHistoryEnabled: false,
  demoMode: false,
  onboardingComplete: false,
};

// ─── Context Engine ────────────────────────────────────────

export type ContextEvent =
  | "ENTER"
  | "EXIT"
  | "APPROACH"
  | "STAY"
  | "MOVING"
  | "IDLE"
  | "NONE";

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface UserContext {
  currentPlace?: Place;
  previousPlace?: Place;
  event: ContextEvent;
  nearbyPlaces: Place[];
  coords?: Coordinates;
  timestamp: string;
}

// ─── AI Types ──────────────────────────────────────────────

export interface ReminderIntent {
  location?: string;
  date?: string;
  time?: string;
  action: string;
  confidence: number;
}

export interface TaskIntent {
  title: string;
  placeId?: string;
  priority?: TaskPriority;
}

// ─── UI helpers ────────────────────────────────────────────

export interface SelectOption<T = string> {
  label: string;
  value: T;
  emoji?: string;
}
