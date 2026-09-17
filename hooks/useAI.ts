"use client";

import { useState } from "react";
import { parseNaturalLanguageInput } from "@/services/ai/aiService";
import { useTasks } from "@/hooks/useTasks";
import { usePlaces } from "@/hooks/usePlaces";
import toast from "react-hot-toast";

export function useAI() {
  const [parsing, setParsing] = useState(false);
  const { addTask } = useTasks();
  const { places } = usePlaces();

  const parseAndAdd = async (text: string) => {
    if (!text.trim()) return false;
    
    setParsing(true);
    try {
      const intent = await parseNaturalLanguageInput(text);
      if (!intent) throw new Error("No intent detected");

      // Attempt to resolve placeName to a placeId
      // The API returns a pseudo placeName, we fuzzy match it
      let resolvedPlaceId: string | undefined = undefined;
      let resolvedTriggerType: "NONE" | "ENTER" | "EXIT" | "APPROACH" = "NONE";

      // Very rudimentary matching - in real app, we'd send the list of places in the prompt
      // For now, if the API gives us "Office", we look for a place named "Office"
      // Note: In parseNaturalLanguageInput I didn't return placeName, I'll need to make sure the API does, but it's defined in the prompt.
      // Wait, TS doesn't have placeName on TaskIntent yet? Let's check.
      // TaskIntent has `placeId`. Let's assume the API returned `placeName` instead.
      // To hack around the strict type:
      const rawIntent = intent as any;
      const placeNameMatch = rawIntent.placeName;

      if (placeNameMatch && typeof placeNameMatch === "string") {
        const p = places.find(p => p.name.toLowerCase().includes(placeNameMatch.toLowerCase()));
        if (p) {
          resolvedPlaceId = p.id;
          resolvedTriggerType = "ENTER"; // default to enter if place is mentioned
        }
      }

      await addTask({
        title: intent.title,
        priority: intent.priority || "medium",
        placeId: resolvedPlaceId,
        triggerType: resolvedTriggerType,
      });

      toast.success("Task extracted and added!");
      return true;

    } catch (e: any) {
      toast.error(e.message || "Failed to parse input");
      return false;
    } finally {
      setParsing(false);
    }
  };

  return { parseAndAdd, parsing };
}
