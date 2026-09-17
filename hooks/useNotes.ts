"use client";

import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/core/db";
import {
  createNote,
  updateNote,
  deleteNote,
  type CreateNoteInput,
} from "@/services/database/notes";
import type { Note } from "@/core/types";
import toast from "react-hot-toast";

export function useNotes(placeId?: string) {
  const [loading, setLoading] = useState(false);

  const notes: Note[] = useLiveQuery(
    () => {
      const db = getDB();
      if (placeId) {
        return db.notes.where("placeId").equals(placeId).sortBy("updatedAt");
      }
      return db.notes.orderBy("updatedAt").reverse().toArray();
    },
    [placeId],
    []
  ) ?? [];

  const addNote = useCallback(async (input: CreateNoteInput): Promise<Note | null> => {
    setLoading(true);
    try {
      const note = await createNote(input);
      toast.success("Note saved");
      return note;
    } catch {
      toast.error("Failed to save note");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const editNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>): Promise<boolean> => {
      try {
        await updateNote(id, updates);
        toast.success("Note updated");
        return true;
      } catch {
        toast.error("Failed to update note");
        return false;
      }
    },
    []
  );

  const removeNote = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteNote(id);
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }, []);

  return { notes, loading, addNote, editNote, removeNote };
}
