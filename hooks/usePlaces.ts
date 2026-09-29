"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getPlaces,
  createPlace,
  updatePlace,
  deletePlace,
  type CreatePlaceInput,
} from "@/services/database/places";
import type { Place } from "@/core/types";
import toast from "react-hot-toast";

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getPlaces();
      setPlaces(data);
    } catch (err) {
      console.error("usePlaces refresh error:", err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPlace = useCallback(async (input: CreatePlaceInput): Promise<Place | null> => {
    setLoading(true);
    setError(null);
    try {
      const place = await createPlace(input);
      toast.success(`${place.emoji} ${place.name} created`);
      await refresh();
      return place;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create place";
      setError(msg);
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const editPlace = useCallback(
    async (id: string, updates: Partial<Omit<Place, "id" | "createdAt">>): Promise<boolean> => {
      setLoading(true);
      try {
        await updatePlace(id, updates);
        toast.success("Place updated");
        await refresh();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update place";
        toast.error(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  const removePlace = useCallback(async (id: string, name: string): Promise<boolean> => {
    setLoading(true);
    try {
      await deletePlace(id);
      toast.success(`${name} deleted`);
      await refresh();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete place";
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  return { places, loading, error, addPlace, editPlace, removePlace, refresh };
}
