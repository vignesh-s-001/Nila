import type { Coordinates, Journey, JourneyStation, JourneyProgress } from "@/core/types";
import { getDistance } from "@/services/location/geofenceService";

export function computeJourneyProgress(
  coords: Coordinates | null,
  journey: Journey,
  stations: JourneyStation[]
): JourneyProgress {
  if (!coords) {
    return {
      currentStationIndex: -1,
      stopsRemaining: stations.length,
      distanceToDestination: -1,
      approachingDestination: false,
      veryClose: false,
    };
  }

  const distanceToDest = getDistance(coords.lat, coords.lng, journey.destLat, journey.destLng);
  const approaching = distanceToDest <= journey.alertDistance;
  const veryClose = distanceToDest <= 100;

  // Find the next unreached station
  let currentIndex = -1;
  let remaining = 0;
  
  for (let i = 0; i < stations.length; i++) {
    if (!stations[i].reached) {
      if (currentIndex === -1) currentIndex = i;
      remaining++;
    }
  }

  // Check if we have reached the current target station
  // Assumes a station radius of ~200m
  if (currentIndex !== -1) {
    const target = stations[currentIndex];
    const distToTarget = getDistance(coords.lat, coords.lng, target.lat, target.lng);
    if (distToTarget <= 200) {
      // Reached! (The caller should update DB when this happens)
    }
  }

  return {
    currentStationIndex: currentIndex,
    stopsRemaining: remaining,
    distanceToDestination: distanceToDest,
    approachingDestination: approaching,
    veryClose,
  };
}
