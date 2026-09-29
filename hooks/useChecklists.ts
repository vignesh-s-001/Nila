"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getChecklists,
  getChecklistsByPlace,
  getChecklistItems,
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
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [allItems, setAllItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshLists = useCallback(async () => {
    try {
      let lists: Checklist[];
      if (placeId) {
        lists = await getChecklistsByPlace(placeId);
      } else {
        lists = await getChecklists();
        if (journeyId) {
          lists = lists.filter((c) => c.journeyId === journeyId);
        }
      }
      setChecklists(lists);

      // Fetch all items for these checklists
      const itemGroups = await Promise.all(lists.map((c) => getChecklistItems(c.id)));
      setAllItems(itemGroups.flat());
    } catch (err) {
      console.error("useChecklists refresh error:", err);
    }
  }, [placeId, journeyId]);

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  const addList = useCallback(async (name: string, pId?: string, jId?: string) => {
    setLoading(true);
    try {
      await createChecklist({ name, placeId: pId, journeyId: jId });
      toast.success("Checklist created");
      await refreshLists();
    } catch {
      toast.error("Failed to create checklist");
    } finally {
      setLoading(false);
    }
  }, [refreshLists]);

  const editList = useCallback(async (id: string, name: string) => {
    try {
      await updateChecklist(id, { name });
      await refreshLists();
    } catch {
      toast.error("Failed to update checklist");
    }
  }, [refreshLists]);

  const removeList = useCallback(async (id: string) => {
    try {
      await deleteChecklist(id);
      toast.success("Checklist deleted");
      await refreshLists();
    } catch {
      toast.error("Failed to delete checklist");
    }
  }, [refreshLists]);

  const addItem = useCallback(async (checklistId: string, text: string, order: number) => {
    try {
      await addChecklistItem({ checklistId, text, order });
      await refreshLists();
    } catch {
      toast.error("Failed to add item");
    }
  }, [refreshLists]);

  const toggleItem = useCallback(async (itemId: string) => {
    try {
      await toggleChecklistItem(itemId);
      await refreshLists();
    } catch {
      toast.error("Failed to toggle item");
    }
  }, [refreshLists]);

  const removeItem = useCallback(async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId);
      await refreshLists();
    } catch {
      toast.error("Failed to delete item");
    }
  }, [refreshLists]);

  const resetList = useCallback(async (checklistId: string) => {
    try {
      await resetChecklist(checklistId);
      toast.success("Checklist reset");
      await refreshLists();
    } catch {
      toast.error("Failed to reset checklist");
    }
  }, [refreshLists]);

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
    refresh: refreshLists,
  };
}
