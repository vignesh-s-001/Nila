import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { Journey, JourneyStation, JourneyStatus } from "@/core/types";

export interface CreateJourneyInput {
  name: string;
  startName: string;
  startLat: number;
  startLng: number;
  destName: string;
  destLat: number;
  destLng: number;
  alertDistance?: number;
}

export async function createJourney(input: CreateJourneyInput): Promise<Journey> {
  const db = getDB();
  const now = new Date().toISOString();
  const journey: Journey = {
    id: uuidv4(),
    ...input,
    alertDistance: input.alertDistance ?? 1000,
    status: "planned",
    createdAt: now,
    updatedAt: now,
  };
  await db.journeys.add(journey);
  return journey;
}

export async function getJourneys(): Promise<Journey[]> {
  const db = getDB();
  return db.journeys.orderBy("createdAt").reverse().toArray();
}

export async function getJourney(id: string): Promise<Journey | undefined> {
  const db = getDB();
  return db.journeys.get(id);
}

export async function updateJourneyStatus(id: string, status: JourneyStatus): Promise<void> {
  const db = getDB();
  const updates: Partial<Journey> = { status, updatedAt: new Date().toISOString() };
  if (status === "active") updates.startedAt = new Date().toISOString();
  if (status === "completed") updates.completedAt = new Date().toISOString();
  
  await db.journeys.update(id, updates);
}

export async function deleteJourney(id: string): Promise<void> {
  const db = getDB();
  await db.transaction("rw", db.journeys, db.journeyStations, async () => {
    await db.journeyStations.where("journeyId").equals(id).delete();
    await db.journeys.delete(id);
  });
}

// ─── Journey Stations ──────────────────────────────────────

export interface CreateStationInput {
  journeyId: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

export async function addJourneyStation(input: CreateStationInput): Promise<JourneyStation> {
  const db = getDB();
  const station: JourneyStation = {
    id: uuidv4(),
    ...input,
    reached: false,
    createdAt: new Date().toISOString(),
  };
  await db.journeyStations.add(station);
  return station;
}

export async function getStationsForJourney(journeyId: string): Promise<JourneyStation[]> {
  const db = getDB();
  return db.journeyStations.where("journeyId").equals(journeyId).sortBy("order");
}

export async function markStationReached(id: string): Promise<void> {
  const db = getDB();
  await db.journeyStations.update(id, { reached: true, reachedAt: new Date().toISOString() });
}
