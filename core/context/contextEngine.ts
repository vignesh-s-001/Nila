import type { Coordinates, Place, UserContext, ContextEvent } from "@/core/types";
import { isInsideGeofence, isApproachingGeofence } from "@/services/location/geofenceService";

export function computeContext(
  coords: Coordinates | null,
  places: Place[],
  previousContext: UserContext | null
): UserContext {
  const timestamp = new Date().toISOString();

  // If no coords, preserve previous or return default
  if (!coords) {
    return previousContext ?? { event: "NONE", nearbyPlaces: [], timestamp };
  }

  const nearbyPlaces: Place[] = [];
  let currentPlace: Place | undefined = undefined;
  let event: ContextEvent = "MOVING";
  let previousPlace = previousContext?.currentPlace;

  for (const place of places) {
    if (isInsideGeofence(coords, place)) {
      currentPlace = place;
    } else if (isApproachingGeofence(coords, place)) {
      nearbyPlaces.push(place);
    }
  }

  // Determine transition event
  if (currentPlace) {
    if (!previousPlace || previousPlace.id !== currentPlace.id) {
      event = "ENTER";
    } else {
      event = "STAY"; // Ideally we'd measure time to distinguish IDLE vs STAY
    }
  } else {
    if (previousPlace) {
      event = "EXIT";
    } else if (nearbyPlaces.length > 0) {
      event = "APPROACH";
    } else {
      event = "MOVING";
    }
  }

  return {
    currentPlace,
    previousPlace: event === "EXIT" ? previousPlace : undefined, // only log previous on exit
    event,
    nearbyPlaces,
    coords,
    timestamp,
  };
}
