import Dexie, { type EntityTable } from "dexie";
import type {
  Place,
  Task,
  Note,
  Checklist,
  ChecklistItem,
  Reminder,
  Rule,
  Journey,
  JourneyStation,
  NotificationHistory,
  AppUser,
} from "@/core/types";

// ─── Settings row type ─────────────────────────────────────
export interface SettingsRow {
  key: string;
  value: unknown;
}

// ─── Database class ────────────────────────────────────────
export class ContextDatabase extends Dexie {
  places!: EntityTable<Place, "id">;
  tasks!: EntityTable<Task, "id">;
  notes!: EntityTable<Note, "id">;
  checklists!: EntityTable<Checklist, "id">;
  checklistItems!: EntityTable<ChecklistItem, "id">;
  reminders!: EntityTable<Reminder, "id">;
  rules!: EntityTable<Rule, "id">;
  journeys!: EntityTable<Journey, "id">;
  journeyStations!: EntityTable<JourneyStation, "id">;
  notificationHistory!: EntityTable<NotificationHistory, "id">;
  settings!: EntityTable<SettingsRow, "key">;
  users!: EntityTable<AppUser, "id">;

  constructor() {
    super("ContextDB");

    this.version(1).stores({
      places:              "id, name, createdAt",
      tasks:               "id, placeId, completed, priority, dueDate, createdAt",
      notes:               "id, placeId, createdAt",
      checklists:          "id, placeId, journeyId, createdAt",
      checklistItems:      "id, checklistId, order",
      reminders:           "id, placeId, taskId, triggerType, enabled",
      rules:               "id, placeId, triggerEvent, enabled",
      journeys:            "id, status, createdAt",
      journeyStations:     "id, journeyId, order",
      notificationHistory: "id, placeId, type, sentAt",
      settings:            "key",
    });

    // Version 2: adds users table for authentication
    this.version(2).stores({
      places:              "id, name, createdAt",
      tasks:               "id, placeId, completed, priority, dueDate, createdAt",
      notes:               "id, placeId, createdAt",
      checklists:          "id, placeId, journeyId, createdAt",
      checklistItems:      "id, checklistId, order",
      reminders:           "id, placeId, taskId, triggerType, enabled",
      rules:               "id, placeId, triggerEvent, enabled",
      journeys:            "id, status, createdAt",
      journeyStations:     "id, journeyId, order",
      notificationHistory: "id, placeId, type, sentAt",
      settings:            "key",
      users:               "id, email, role, createdAt",
    });
  }
}

// ─── Singleton ─────────────────────────────────────────────
let _db: ContextDatabase | null = null;

export function getDB(): ContextDatabase {
  if (typeof window === "undefined") {
    throw new Error("Database can only be accessed on the client side");
  }
  if (!_db) {
    _db = new ContextDatabase();
  }
  return _db;
}
