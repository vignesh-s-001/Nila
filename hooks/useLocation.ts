"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/store/appStore";
import {
  startWatching,
  stopWatching,
  getCurrentLocation,
} from "@/services/location/locationService";
import {
  requestLocationPermission,
  getLocationPermissionState,
} from "@/services/location/permissionService";
import { DEMO_LOCATIONS } from "@/core/constants";

export function useLocation() {
  const {
    coords,
    setCoords,
    locationPermission,
    setLocationPermission,
    demoMode,
    demoLocationName,
    demoCoords,
    settings,
  } = useAppStore();

  const isLocationActive = settings.locationEnabled !== false;
  const initialFetchAttempted = useRef(false);

  // Request & sync permission state on mount
  useEffect(() => {
    getLocationPermissionState().then((state) => {
      setLocationPermission(state);
      if (state === "prompt" || state === "unknown") {
        // Auto-request so browser displays the native permission prompt
        requestLocationPermission().then((newState) => {
          setLocationPermission(newState);
        });
      }
    });
  }, [setLocationPermission]);

  // Try immediate one-shot location on load to get instant coordinates
  useEffect(() => {
    if (demoMode || !isLocationActive || initialFetchAttempted.current) return;
    initialFetchAttempted.current = true;

    getCurrentLocation()
      .then((c) => {
        setCoords(c);
        setLocationPermission("granted");
      })
      .catch(() => {
        // Ignore, watchPosition will handle it or fallback
      });
  }, [demoMode, isLocationActive, setCoords, setLocationPermission]);

  // Main location watcher effect
  useEffect(() => {
    // If demo mode is active, simulate coords from store or constants
    if (demoMode) {
      stopWatching(); // ensure real GPS is off
      if (demoCoords) {
        setCoords(demoCoords);
      } else if (demoLocationName) {
        const demoLoc = DEMO_LOCATIONS.find((l) => l.name === demoLocationName);
        if (demoLoc) {
          setCoords({ lat: demoLoc.lat, lng: demoLoc.lng, accuracy: 5 });
        }
      } else {
        // "Moving (No Place)"
        setCoords(null);
      }
      return;
    }

    // Normal mode: check if location is enabled
    if (isLocationActive && locationPermission !== "denied") {
      startWatching(
        (newCoords) => {
          setCoords(newCoords);
          if (useAppStore.getState().locationPermission !== "granted") {
            setLocationPermission("granted");
          }
        },
        async (error) => {
          console.warn("Location error:", error.message);
          if (error.code === error.PERMISSION_DENIED) {
            setLocationPermission("denied");
          }
          // If GPS fails on desktop, attempt IP location fallback
          const currentStoreCoords = useAppStore.getState().coords;
          if (!currentStoreCoords) {
            try {
              const res = await fetch("https://get.geojs.io/v1/ip/geo.json");
              if (res.ok) {
                const data = await res.json();
                if (data.latitude && data.longitude) {
                  setCoords({
                    lat: parseFloat(data.latitude),
                    lng: parseFloat(data.longitude),
                    accuracy: 1000,
                  });
                }
              }
            } catch {
              // ignore
            }
          }
        }
      );
    } else {
      stopWatching();
    }

    return () => {
      stopWatching();
    };
  }, [
    demoMode,
    demoLocationName,
    demoCoords,
    isLocationActive,
    locationPermission,
    setLocationPermission,
    setCoords,
  ]);

  const requestPermission = useCallback(async () => {
    const state = await requestLocationPermission();
    setLocationPermission(state);
    if (state === "granted") {
      try {
        const c = await getCurrentLocation();
        setCoords(c);
      } catch (e) {
        console.warn("Failed to get current location after grant", e);
      }
    }
    return state;
  }, [setLocationPermission, setCoords]);

  const refreshLocation = useCallback(async () => {
    if (demoMode) return;
    try {
      const c = await getCurrentLocation();
      setCoords(c);
    } catch (e) {
      console.warn("Failed to refresh location", e);
    }
  }, [demoMode, setCoords]);

  return {
    coords,
    permission: locationPermission,
    requestPermission,
    refreshLocation,
  };
}
