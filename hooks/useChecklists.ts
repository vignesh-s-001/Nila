"use client";

import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/core/db";
import {
  createChecklist,
  updateChecklist,
  deleteChecklist,
  addChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
  resetChecklist,
} from "@/services/database/checklists";
import type { Checklist, ChecklistItem } from "@/core/types";
import toast from "react-hot-toast";

export function useChecklists(placeId?: string, journeyId?: string) {
  const [loading, setLoading] = useState(false);

  // Live query checklists
  const checklists: Checklist[] = useLiveQuery(
    () => {
      const db = getDB();
      if (placeId) {
        return db.checklists.where("placeId").equals(placeId).sortBy("createdAt");
      }
      if (journeyId) {
        return db.checklists.where("journeyId").equals(journeyId).sortBy("createdAt");
      }
      return db.checklists.orderBy("createdAt").toArray();
    },
    [placeId, journeyId],
    []
  ) ?? [];

  // Live query all checklist items, and group them below
  const allItems: ChecklistItem[] = useLiveQuery(
    () => getDB().checklistItems.orderBy("order").toArray(),
    [],
    []
  ) ?? [];

  const addList = useCallback(async (name: string, pId?: string, jId?: string) => {
    setLoading(true);
    try {
      await createChecklist({ name, placeId: pId, journeyId: jId });
      toast.success("Checklist created");
    } catch {
      toast.error("Failed to create checklist");
    } finally {
      setLoading(false);
    }
  }, []);

  const editList = useCallback(async (id: string, name: string) => {
    try {
      await updateChecklist(id, { name });
    } catch {
      toast.error("Failed to update checklist");
    }
  }, []);

  const removeList = useCallback(async (id: string) => {
    try {
      await deleteChecklist(id);
      toast.success("Checklist deleted");
    } catch {
      toast.error("Failed to delete checklist");
    }
  }, []);

  const addItem = useCallback(async (checklistId: string, text: string, order: number) => {
    try {
      await addChecklistItem({ checklistId, text, order });
    } catch {
      toast.error("Failed to add item");
    }
  }, []);

  const toggleItem = useCallback(async (itemId: string) => {
    try {
      await toggleChecklistItem(itemId);
    } catch {
      toast.error("Failed to toggle item");
    }
  }, []);

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId);
    } catch {
      toast.error("Failed to delete item");
    }
  }, []);

  const resetList = useCallback(async (checklistId: string) => {
    try {
      await resetChecklist(checklistId);
      toast.success("Checklist reset");
    } catch {
      toast.error("Failed to reset checklist");
    }
  }, []);

  return {
    checklists,
    allItems,
    loading,
    addList,
    editList,
    removeList,
    addItem,
    toggleItem,
    removeItem,
    resetList,
  };
}
