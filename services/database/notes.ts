import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { Note } from "@/core/types";

export interface CreateNoteInput {
  title: string;
  content: string;
  placeId?: string;
  tags?: string[];
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const db = getDB();
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    title: input.title,
    content: input.content,
    placeId: input.placeId,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.notes.add(note);
  return note;
}

export async function getNotes(): Promise<Note[]> {
  const db = getDB();
  return db.notes.orderBy("updatedAt").reverse().toArray();
}

export async function getNotesByPlace(placeId: string): Promise<Note[]> {
  const db = getDB();
  return db.notes.where("placeId").equals(placeId).sortBy("updatedAt");
}

export async function getNote(id: string): Promise<Note | undefined> {
  const db = getDB();
  return db.notes.get(id);
}

export async function updateNote(
  id: string,
  updates: Partial<Omit<Note, "id" | "createdAt">>
): Promise<void> {
  const db = getDB();
  await db.notes.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteNote(id: string): Promise<void> {
  const db = getDB();
  await db.notes.delete(id);
}
