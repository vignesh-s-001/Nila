"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getNotes,
  getNotesByPlace,
  createNote,
  updateNote,
  deleteNote,
  type CreateNoteInput,
} from "@/services/database/notes";
import type { Note } from "@/core/types";
import toast from "react-hot-toast";

export function useNotes(placeId?: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = placeId ? await getNotesByPlace(placeId) : await getNotes();
      setNotes(data);
    } catch (err) {
      console.error("useNotes refresh error:", err);
    }
  }, [placeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addNote = useCallback(async (input: CreateNoteInput): Promise<Note | null> => {
    setLoading(true);
    try {
      const note = await createNote(input);
      toast.success("Note saved");
      await refresh();
      return note;
    } catch {
      toast.error("Failed to save note");
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const editNote = useCallback(
    async (id: string, updates: Partial<Omit<Note, "id" | "createdAt">>): Promise<boolean> => {
      try {
        await updateNote(id, updates);
        toast.success("Note updated");
        await refresh();
        return true;
      } catch {
        toast.error("Failed to update note");
        return false;
      }
    },
    [refresh]
  );

  const removeNote = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteNote(id);
      toast.success("Note deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete note");
    }
  }, [refresh]);

  return { notes, loading, addNote, editNote, removeNote, refresh };
}
