import type { Coordinates } from "@/core/types";
import { LOCATION_MAX_AGE, LOCATION_TIMEOUT } from "@/core/constants";

let watchId: number | null = null;

export type LocationCallback = (coords: Coordinates) => void;
export type ErrorCallback = (error: GeolocationPositionError) => void;

export function startWatching(onLocation: LocationCallback, onError?: ErrorCallback): void {
  if (!navigator.geolocation) {
    console.error("Geolocation not supported by this browser");
    return;
  }

  if (watchId !== null) return; // already watching

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      onLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      });
    },
    (err) => {
      if (onError) onError(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: LOCATION_MAX_AGE,
      timeout: LOCATION_TIMEOUT,
    }
  );
}

export function stopWatching(): void {
  if (watchId !== null && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
}

export async function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => reject(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  });
}
