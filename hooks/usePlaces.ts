"use client";

import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/core/db";
import {
  createPlace,
  updatePlace,
  deletePlace,
  type CreatePlaceInput,
} from "@/services/database/places";
import type { Place } from "@/core/types";
import toast from "react-hot-toast";

export function usePlaces() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const places: Place[] = useLiveQuery(
    () => getDB().places.orderBy("createdAt").toArray(),
    [],
    []
  ) ?? [];

  const addPlace = useCallback(async (input: CreatePlaceInput): Promise<Place | null> => {
    setLoading(true);
    setError(null);
    try {
      const place = await createPlace(input);
      toast.success(`${place.emoji} ${place.name} created`);
      return place;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create place";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const editPlace = useCallback(
    async (id: string, updates: Partial<Omit<Place, "id" | "createdAt">>): Promise<boolean> => {
      setLoading(true);
      try {
        await updatePlace(id, updates);
        toast.success("Place updated");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update place";
        toast.error(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const removePlace = useCallback(async (id: string, name: string): Promise<boolean> => {
    setLoading(true);
    try {
      await deletePlace(id);
      toast.success(`${name} deleted`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete place";
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { places, loading, error, addPlace, editPlace, removePlace };
}
