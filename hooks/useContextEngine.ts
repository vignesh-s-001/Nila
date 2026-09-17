"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/appStore";
import { usePlaces } from "@/hooks/usePlaces";
import { computeContext } from "@/core/context/contextEngine";
import { useLocation } from "./useLocation";
import { processContextEvent } from "@/services/notifications/notificationEngine";

export function useContextEngine() {
  const { coords } = useLocation();
  const { places } = usePlaces();
  const { userContext, setUserContext } = useAppStore();

  // Keep a mutable ref of the context to pass to the engine without triggering endless dependency cycles
  const prevContextRef = useRef(userContext);

  // When staying at the same place, poll the notification engine every 30s
  // so that freshly added intentions can alert even when you are already physically present
  const lastStayNotifiedAtRef = useRef<number>(0);
  const initialEnterFiredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Only compute if we have places loaded
    if (!places || places.length === 0) return;

    const newContext = computeContext(coords, places, prevContextRef.current);
    const prevCtx = prevContextRef.current;

    const placeChanged = newContext.currentPlace?.id !== prevCtx?.currentPlace?.id;
    const eventChanged = newContext.event !== prevCtx?.event;

    // True first-time arrival at a new place (or STAY event where we haven't fired ENTER yet)
    const isEnterOrNewStay =
      newContext.event === "ENTER" ||
      (newContext.event === "STAY" &&
        newContext.currentPlace &&
        !initialEnterFiredRef.current.has(newContext.currentPlace.id));

    // For continued STAY at the same place: re-check every 30s
    const now = Date.now();
    const isStayAtSamePlace =
      newContext.event === "STAY" &&
      newContext.currentPlace &&
      prevCtx?.currentPlace?.id === newContext.currentPlace.id;
    const stayNeedsCheck = isStayAtSamePlace && now - lastStayNotifiedAtRef.current > 30_000;

    const isDifferent = eventChanged || placeChanged || isEnterOrNewStay || stayNeedsCheck;

    if (isDifferent) {
      setUserContext(newContext);
      prevContextRef.current = newContext;

      // Fire notification engine
      const contextToFire = { ...newContext };

      // For first-time STAY at a place (user was already here when app loaded),
      // treat it as an ENTER so all ENTER-trigger intentions fire
      if (
        newContext.event === "STAY" &&
        newContext.currentPlace &&
        !initialEnterFiredRef.current.has(newContext.currentPlace.id)
      ) {
        initialEnterFiredRef.current.add(newContext.currentPlace.id);
        contextToFire.event = "ENTER";
        lastStayNotifiedAtRef.current = now;
      } else if (stayNeedsCheck) {
        lastStayNotifiedAtRef.current = now;
      }

      // Reset the initial-enter tracker when leaving a place
      if (newContext.event === "EXIT" && prevCtx?.currentPlace) {
        initialEnterFiredRef.current.delete(prevCtx.currentPlace.id);
      }

      console.log(
        `[Context Engine] Event: ${contextToFire.event} at ${contextToFire.currentPlace?.name ?? "nowhere"}`
      );
      processContextEvent(contextToFire).catch(console.error);
    }
  }, [coords, places, setUserContext]);

  return userContext;
}
