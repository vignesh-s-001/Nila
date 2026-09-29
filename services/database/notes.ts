import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Note } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id:        row.id as string,
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
}

// ─── CRUD ──────────────────────────────────────────────────

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      id,
      place_id:   input.placeId ?? null,
      title:      input.title,
      content:    input.content,
      tags:       input.tags ?? [],
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToNote(data);
}

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
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
