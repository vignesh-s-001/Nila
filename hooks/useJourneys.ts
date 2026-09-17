"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/core/db";
import {
  createJourney,
  updateJourneyStatus,
  deleteJourney,
  addJourneyStation,
  markStationReached,
  type CreateJourneyInput,
} from "@/services/database/journeys";
import { useLocation } from "./useLocation";
import { computeJourneyProgress } from "@/core/context/journeyTracker";
import { sendNotification } from "@/services/notifications/notificationService";
import type { Journey, JourneyStation, JourneyProgress } from "@/core/types";
import toast from "react-hot-toast";

export function useJourneys() {
  const [loading, setLoading] = useState(false);
  const { coords } = useLocation();

  const journeys: Journey[] = useLiveQuery(
    () => getDB().journeys.orderBy("createdAt").reverse().toArray(),
    [],
    []
  ) ?? [];

  const activeJourney = journeys.find((j) => j.status === "active");

  const activeStations: JourneyStation[] = useLiveQuery(
    () => {
      if (!activeJourney) return [];
      return getDB().journeyStations.where("journeyId").equals(activeJourney.id).sortBy("order");
    },
    [activeJourney?.id],
    []
  ) ?? [];

  const [progress, setProgress] = useState<JourneyProgress | null>(null);

  // Track which notifications have been sent for this active journey
  // to avoid spamming the same notification on every GPS coordinate update.
  const notifiedStations = useRef<Set<string>>(new Set());
  const notifiedArrival = useRef<string | null>(null); // stores journey id when arrival was notified

  // Reset notification tracking when the active journey changes
  useEffect(() => {
    notifiedStations.current = new Set();
    notifiedArrival.current = null;
  }, [activeJourney?.id]);

  // Tracker Effect — runs every time GPS coordinates update
  useEffect(() => {
    if (!activeJourney || !coords) return;

    const p = computeJourneyProgress(coords, activeJourney, activeStations);
    setProgress(p);

    // ─── Intermediate station arrival (e.g. metro stops along the way) ───
    if (p.currentStationIndex !== -1) {
      const target = activeStations[p.currentStationIndex];
      if (target && !target.reached && !notifiedStations.current.has(target.id)) {
        const distToTarget = Math.sqrt(
          Math.pow(target.lat - coords.lat, 2) + Math.pow(target.lng - coords.lng, 2)
        ) * 111000; // rough metres
        if (distToTarget <= 200) {
          // Send ONE notification when entering each intermediate stop
          notifiedStations.current.add(target.id);
          markStationReached(target.id);
          sendNotification(`📍 Arrived at ${target.name}`, {
            body: `${p.stopsRemaining - 1} stop${p.stopsRemaining - 1 !== 1 ? "s" : ""} remaining to ${activeJourney.destName}`,
          });
        }
      }
    }

    // ─── Final destination ARRIVAL notification (sent only once) ───
    if (p.veryClose && notifiedArrival.current !== activeJourney.id) {
      notifiedArrival.current = activeJourney.id;
      sendNotification(`🎉 You have arrived at ${activeJourney.destName}!`, {
        body: "You reached your destination. Tap to mark the trip as complete.",
      });
      toast.success(`You've arrived at ${activeJourney.destName}! 🎉`);
      // Auto-complete the journey after arrival
      updateJourneyStatus(activeJourney.id, "completed");
    } else if (p.approachingDestination && !p.veryClose && notifiedArrival.current !== `approaching-${activeJourney.id}`) {
      // One "approaching" warning before arriving
      notifiedArrival.current = `approaching-${activeJourney.id}`;
      sendNotification(`🚉 Approaching ${activeJourney.destName}`, {
        body: `${(p.distanceToDestination / 1000).toFixed(1)} km away. Get ready to get off!`,
      });
      toast.success(`Approaching ${activeJourney.destName} — get ready!`);
    }

  }, [coords, activeJourney, activeStations]);

  const addJourney = useCallback(async (input: CreateJourneyInput) => {
    setLoading(true);
    try {
      const j = await createJourney(input);
      toast.success("Journey created");
      return j;
    } catch {
      toast.error("Failed to create journey");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const setStatus = useCallback(async (id: string, status: Journey["status"]) => {
    try {
      await updateJourneyStatus(id, status);
    } catch {
      toast.error("Failed to update status");
    }
  }, []);

  const removeJourney = useCallback(async (id: string) => {
    try {
      await deleteJourney(id);
      toast.success("Journey deleted");
    } catch {
      toast.error("Failed to delete journey");
    }
  }, []);

  return {
    journeys,
    activeJourney,
    activeStations,
    progress,
    loading,
    addJourney,
    setStatus,
    removeJourney,
    addJourneyStation,
  };
}
