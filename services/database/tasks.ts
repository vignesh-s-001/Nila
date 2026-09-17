import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { Task, TaskPriority, TriggerType, RepeatType, AlertSound } from "@/core/types";

export interface CreateTaskInput {
  title: string;
  description?: string;
  placeId?: string;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  timeStart?: string;
  timeEnd?: string;
  repeat?: RepeatType;
  triggerType?: TriggerType;
  alertSound?: AlertSound;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = getDB();
  const now = new Date().toISOString();
  const task: Task = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    placeId: input.placeId,
    priority: input.priority ?? "medium",
    dueDate: input.dueDate,
    dueTime: input.dueTime,
    timeStart: input.timeStart,
    timeEnd: input.timeEnd,
    repeat: input.repeat ?? "none",
    completed: false,
    triggerType: input.triggerType ?? "NONE",
    alertSound: input.alertSound ?? "chime",
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(task);
  return task;
}

export async function getTasks(): Promise<Task[]> {
  const db = getDB();
  return db.tasks.orderBy("createdAt").toArray();
}

export async function getTasksByPlace(placeId: string): Promise<Task[]> {
  const db = getDB();
  return db.tasks.where("placeId").equals(placeId).sortBy("createdAt");
}

export async function getIncompleteTasks(): Promise<Task[]> {
  const db = getDB();
  return db.tasks.where("completed").equals(0).sortBy("createdAt");
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = getDB();
  return db.tasks.get(id);
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "createdAt">>
): Promise<void> {
  const db = getDB();
  await db.tasks.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function completeTask(id: string): Promise<void> {
  const db = getDB();
  await db.tasks.update(id, {
    completed: true,
    completedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function uncompleteTask(id: string): Promise<void> {
  const db = getDB();
  await db.tasks.update(id, {
    completed: false,
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDB();
  await db.tasks.delete(id);
}
