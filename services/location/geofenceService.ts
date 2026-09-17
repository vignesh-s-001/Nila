import type { Coordinates, Place } from "@/core/types";

// Haversine distance in metres
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isInsideGeofence(coords: Coordinates, place: Place): boolean {
  const dist = getDistance(coords.lat, coords.lng, place.lat, place.lng);
  return dist <= place.radius;
}

export function isApproachingGeofence(coords: Coordinates, place: Place): boolean {
  const dist = getDistance(coords.lat, coords.lng, place.lat, place.lng);
  // Approach threshold is 3x the radius or fixed minimum (e.g., 500m)
  const approachThreshold = Math.max(place.radius * 3, 500);
  return dist > place.radius && dist <= approachThreshold;
}
