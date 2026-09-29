import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Task, TaskPriority, TriggerType, RepeatType, AlertSound } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

function rowToTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    placeId: row.place_id as string | undefined,
    title: row.title as string,
    description: row.description as string | undefined,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date as string | undefined,
    dueTime: row.due_time as string | undefined,
    timeStart: row.time_start as string | undefined,
    timeEnd: row.time_end as string | undefined,
    repeat: row.repeat as RepeatType,
    completed: row.completed as boolean,
    completedAt: row.completed_at as string | undefined,
    triggerType: row.trigger_type as TriggerType,
    alertSound: row.alert_sound as AlertSound | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

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

// ─── CRUD ──────────────────────────────────────────────────

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      id,
      place_id:     input.placeId ?? null,
      title:        input.title,
      description:  input.description ?? null,
      priority:     input.priority ?? "medium",
      due_date:     input.dueDate ?? null,
      due_time:     input.dueTime ?? null,
      time_start:   input.timeStart ?? null,
      time_end:     input.timeEnd ?? null,
      repeat:       input.repeat ?? "none",
      completed:    false,
      trigger_type: input.triggerType ?? "NONE",
      alert_sound:  input.alertSound ?? "chime",
      created_at:   now,
      updated_at:   now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToTask(data);
}

export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToTask);
}

export async function getTasksByPlace(placeId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToTask);
}

export async function getIncompleteTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("completed", false)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToTask);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToTask(data) : undefined;
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<Task, "id" | "createdAt">>
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined)       payload.title        = updates.title;
  if (updates.description !== undefined) payload.description  = updates.description;
  if (updates.placeId !== undefined)     payload.place_id     = updates.placeId;
  if (updates.priority !== undefined)    payload.priority     = updates.priority;
  if (updates.dueDate !== undefined)     payload.due_date     = updates.dueDate;
  if (updates.dueTime !== undefined)     payload.due_time     = updates.dueTime;
  if (updates.timeStart !== undefined)   payload.time_start   = updates.timeStart;
  if (updates.timeEnd !== undefined)     payload.time_end     = updates.timeEnd;
  if (updates.repeat !== undefined)      payload.repeat       = updates.repeat;
  if (updates.completed !== undefined)   payload.completed    = updates.completed;
  if (updates.completedAt !== undefined) payload.completed_at = updates.completedAt;
  if (updates.triggerType !== undefined) payload.trigger_type = updates.triggerType;
  if (updates.alertSound !== undefined)  payload.alert_sound  = updates.alertSound;

  const { error } = await supabase.from("tasks").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function completeTask(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: true, completed_at: now, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function uncompleteTask(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("tasks")
    .update({ completed: false, completed_at: null, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
