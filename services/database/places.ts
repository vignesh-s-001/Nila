import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { Place, PlaceColor } from "@/core/types";

export interface CreatePlaceInput {
  name: string;
  emoji: string;
  color: PlaceColor;
  lat: number;
  lng: number;
  radius: number;
  address?: string;
}

export async function createPlace(input: CreatePlaceInput): Promise<Place> {
  const db = getDB();
  const now = new Date().toISOString();
  const place: Place = {
    id: uuidv4(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };
  await db.places.add(place);
  return place;
}

export async function getPlaces(): Promise<Place[]> {
  const db = getDB();
  return db.places.orderBy("createdAt").toArray();
}

export async function getPlace(id: string): Promise<Place | undefined> {
  const db = getDB();
  return db.places.get(id);
}

export async function updatePlace(
  id: string,
  updates: Partial<Omit<Place, "id" | "createdAt">>
): Promise<void> {
  const db = getDB();
  await db.places.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deletePlace(id: string): Promise<void> {
  const db = getDB();
  // Cascade-delete related data
  await Promise.all([
    db.places.delete(id),
    db.tasks.where("placeId").equals(id).delete(),
    db.notes.where("placeId").equals(id).delete(),
    db.checklists.where("placeId").equals(id).delete(),
    db.rules.where("placeId").equals(id).delete(),
    db.reminders.where("placeId").equals(id).delete(),
  ]);
}
