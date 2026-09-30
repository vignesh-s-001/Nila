import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Note } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

import { loadSession } from "@/services/auth/authService";

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id:        row.id as string,
    userId:    row.user_id as string | undefined,
    placeId:   row.place_id as string | undefined,
    title:     row.title as string,
    content:   row.content as string,
    tags:      row.tags as string[] | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface CreateNoteInput {
  title: string;
  content: string;
  placeId?: string;
  tags?: string[];
  userId?: string;
}

// ─── CRUD ──────────────────────────────────────────────────

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const currentUserId = input.userId ?? loadSession()?.id ?? null;

  const payload: Record<string, unknown> = {
    id,
    place_id:   input.placeId ?? null,
    title:      input.title,
    content:    input.content,
    tags:       input.tags ?? [],
    created_at: now,
    updated_at: now,
  };

  if (currentUserId) {
    payload.user_id = currentUserId;
  }

  let { data, error } = await supabase
    .from("notes")
    .insert(payload)
    .select()
    .single();

  if (error && (error.message.includes("user_id") || error.code === "PGRST204")) {
    delete payload.user_id;
    const retry = await supabase.from("notes").insert(payload).select().single();
    if (retry.error) throw new Error(retry.error.message);
    return rowToNote(retry.data);
  }

  if (error) throw new Error(error.message);
  return rowToNote(data);
}

export async function getNotes(userId?: string): Promise<Note[]> {
  const currentUserId = userId ?? loadSession()?.id;

  let query = supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (currentUserId) {
    query = query.eq("user_id", currentUserId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("user_id") || error.code === "PGRST204") {
      const fallback = await supabase
        .from("notes")
        .select("*")
        .order("updated_at", { ascending: false });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map(rowToNote);
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(rowToNote);
}

export async function getNotesByPlace(placeId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("place_id", placeId)
    .order("updated_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToNote);
}

export async function getNote(id: string): Promise<Note | undefined> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToNote(data) : undefined;
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, "id" | "createdAt">>
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title   !== undefined) payload.title    = updates.title;
  if (updates.content !== undefined) payload.content  = updates.content;
  if (updates.placeId !== undefined) payload.place_id = updates.placeId;
  if (updates.tags    !== undefined) payload.tags     = updates.tags;

  const { error } = await supabase.from("notes").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
