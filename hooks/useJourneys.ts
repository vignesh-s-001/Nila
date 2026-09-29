"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  getJourneys,
  getStationsForJourney,
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
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeStations, setActiveStations] = useState<JourneyStation[]>([]);
  const [loading, setLoading] = useState(false);
  const { coords } = useLocation();

  const [progress, setProgress] = useState<JourneyProgress | null>(null);

  // Track which notifications have been sent for this active journey
  const notifiedStations = useRef<Set<string>>(new Set());
  const notifiedArrival = useRef<string | null>(null);

  const refreshJourneys = useCallback(async () => {
    try {
      const data = await getJourneys();
      setJourneys(data);
      // Fetch stations for active journey
      const active = data.find((j) => j.status === "active");
      if (active) {
        const stations = await getStationsForJourney(active.id);
        setActiveStations(stations);
      } else {
        setActiveStations([]);
      }
    } catch (err) {
      console.error("useJourneys refresh error:", err);
    }
  }, []);

  useEffect(() => {
    refreshJourneys();
  }, [refreshJourneys]);

  const activeJourney = journeys.find((j) => j.status === "active");

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

    // ─── Intermediate station arrival ─────────────────────────────────
    if (p.currentStationIndex !== -1) {
      const target = activeStations[p.currentStationIndex];
      if (target && !target.reached && !notifiedStations.current.has(target.id)) {
        const distToTarget =
          Math.sqrt(
            Math.pow(target.lat - coords.lat, 2) + Math.pow(target.lng - coords.lng, 2)
          ) * 111000;
        if (distToTarget <= 200) {
          notifiedStations.current.add(target.id);
          markStationReached(target.id).then(() => refreshJourneys());
          sendNotification(`📍 Arrived at ${target.name}`, {
            body: `${p.stopsRemaining - 1} stop${p.stopsRemaining - 1 !== 1 ? "s" : ""} remaining to ${activeJourney.destName}`,
          });
        }
      }
    }

    // ─── Final destination ARRIVAL notification ────────────────────────
    if (p.veryClose && notifiedArrival.current !== activeJourney.id) {
      notifiedArrival.current = activeJourney.id;
      sendNotification(`🎉 You have arrived at ${activeJourney.destName}!`, {
        body: "You reached your destination. Tap to mark the trip as complete.",
      });
      toast.success(`You've arrived at ${activeJourney.destName}! 🎉`);
      updateJourneyStatus(activeJourney.id, "completed").then(() => refreshJourneys());
    } else if (
      p.approachingDestination &&
      !p.veryClose &&
      notifiedArrival.current !== `approaching-${activeJourney.id}`
    ) {
      notifiedArrival.current = `approaching-${activeJourney.id}`;
      sendNotification(`🚉 Approaching ${activeJourney.destName}`, {
        body: `${(p.distanceToDestination / 1000).toFixed(1)} km away. Get ready to get off!`,
      });
      toast.success(`Approaching ${activeJourney.destName} — get ready!`);
    }
  }, [coords, activeJourney, activeStations, refreshJourneys]);

  const addJourney = useCallback(async (input: CreateJourneyInput) => {
    setLoading(true);
    try {
      const j = await createJourney(input);
      toast.success("Journey created");
      await refreshJourneys();
      return j;
    } catch {
      toast.error("Failed to create journey");
      return null;
    } finally {
      setLoading(false);
    }
  }, [refreshJourneys]);

  const setStatus = useCallback(async (id: string, status: Journey["status"]) => {
    try {
      await updateJourneyStatus(id, status);
      await refreshJourneys();
    } catch {
      toast.error("Failed to update status");
    }
  }, [refreshJourneys]);

  const removeJourney = useCallback(async (id: string) => {
    try {
      await deleteJourney(id);
      toast.success("Journey deleted");
      await refreshJourneys();
    } catch {
      toast.error("Failed to delete journey");
    }
  }, [refreshJourneys]);

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
    refresh: refreshJourneys,
  };
}
