import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Checklist, ChecklistItem } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

import { loadSession } from "@/services/auth/authService";

function rowToChecklist(row: Record<string, unknown>): Checklist {
  return {
    id:        row.id as string,
    userId:    row.user_id as string | undefined,
    placeId:   row.place_id as string | undefined,
    journeyId: row.journey_id as string | undefined,
    name:      row.name as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToChecklistItem(row: Record<string, unknown>): ChecklistItem {
  return {
    id:          row.id as string,
    checklistId: row.checklist_id as string,
    text:        row.text as string,
    completed:   row.completed as boolean,
    order:       row.order as number,
    createdAt:   row.created_at as string | undefined,
    updatedAt:   row.updated_at as string | undefined,
  };
}

// ─── Checklist CRUD ────────────────────────────────────────

export async function createChecklist(input: {
  name: string;
  placeId?: string;
  journeyId?: string;
  userId?: string;
}): Promise<Checklist> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const currentUserId = input.userId ?? loadSession()?.id ?? null;

  const payload: Record<string, unknown> = {
    id,
    place_id:   input.placeId ?? null,
    journey_id: input.journeyId ?? null,
    name:       input.name,
    created_at: now,
    updated_at: now,
  };

  if (currentUserId) {
    payload.user_id = currentUserId;
  }

  let { data, error } = await supabase
    .from("checklists")
    .insert(payload)
    .select()
    .single();

  if (error && (error.message.includes("user_id") || error.code === "PGRST204")) {
    delete payload.user_id;
    const retry = await supabase.from("checklists").insert(payload).select().single();
    if (retry.error) throw new Error(retry.error.message);
    return rowToChecklist(retry.data);
  }

  if (error) throw new Error(error.message);
  return rowToChecklist(data);
}

export async function getChecklists(userId?: string): Promise<Checklist[]> {
  const currentUserId = userId ?? loadSession()?.id;

  let query = supabase
    .from("checklists")
    .select("*")
    .order("created_at", { ascending: true });

  if (currentUserId) {
    query = query.eq("user_id", currentUserId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("user_id") || error.code === "PGRST204") {
      const fallback = await supabase
        .from("checklists")
        .select("*")
        .order("created_at", { ascending: true });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map(rowToChecklist);
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(rowToChecklist);
}

export async function getChecklistsByPlace(placeId: string): Promise<Checklist[]> {
  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToChecklist);
}

export async function getChecklist(id: string): Promise<Checklist | undefined> {
  const { data, error } = await supabase
    .from("checklists")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToChecklist(data) : undefined;
}

export async function updateChecklist(
  id: string,
  updates: Partial<Omit<Checklist, "id" | "createdAt">>
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name      !== undefined) payload.name       = updates.name;
  if (updates.placeId   !== undefined) payload.place_id   = updates.placeId;
  if (updates.journeyId !== undefined) payload.journey_id = updates.journeyId;

  const { error } = await supabase.from("checklists").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteChecklist(id: string): Promise<void> {
  // Items cascade via FK; delete parent first
  const { error } = await supabase.from("checklists").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Checklist Items CRUD ──────────────────────────────────

export async function addChecklistItem(input: {
  checklistId: string;
  text: string;
  order: number;
}): Promise<ChecklistItem> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabase
    .from("checklist_items")
    .insert({
      id,
      checklist_id: input.checklistId,
      text:         input.text,
      completed:    false,
      order:        input.order,
      created_at:   now,
      updated_at:   now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToChecklistItem(data);
}

export async function getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from("checklist_items")
    .select("*")
    .eq("checklist_id", checklistId)
    .order("order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToChecklistItem);
}

export async function toggleChecklistItem(id: string): Promise<void> {
  // Fetch current value then flip
  const { data: existing, error: fetchErr } = await supabase
    .from("checklist_items")
    .select("completed")
    .eq("id", id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await supabase
    .from("checklist_items")
    .update({ completed: !existing.completed, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const { error } = await supabase.from("checklist_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function resetChecklist(checklistId: string): Promise<void> {
  const { error } = await supabase
    .from("checklist_items")
    .update({ completed: false, updated_at: new Date().toISOString() })
    .eq("checklist_id", checklistId);

  if (error) throw new Error(error.message);
}
