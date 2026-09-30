import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Journey, JourneyStation, JourneyStatus } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

import { loadSession } from "@/services/auth/authService";

function rowToJourney(row: Record<string, unknown>): Journey {
  return {
    id:                   row.id as string,
    userId:               row.user_id as string | undefined,
    name:                 row.name as string,
    status:               row.status as JourneyStatus,
    transportMode:        row.transport_mode as Journey["transportMode"],
    startName:            row.start_name as string,
    startLat:             row.start_lat as number,
    startLng:             row.start_lng as number,
    destName:             row.dest_name as string,
    destLat:              row.dest_lat as number,
    destLng:              row.dest_lng as number,
    alertDistance:        row.alert_distance as number,
    startPlaceId:         row.start_place_id as string | undefined,
    endPlaceId:           row.end_place_id as string | undefined,
    startAddress:         row.start_address as string | undefined,
    endAddress:           row.end_address as string | undefined,
    alertDistanceMeters:  row.alert_distance_meters as number | undefined,
    scheduledAt:          row.scheduled_at as string | undefined,
    startedAt:            row.started_at as string | undefined,
    completedAt:          row.completed_at as string | undefined,
    createdAt:            row.created_at as string,
    updatedAt:            row.updated_at as string,
  };
}

function rowToStation(row: Record<string, unknown>): JourneyStation {
  return {
    id:        row.id as string,
    journeyId: row.journey_id as string,
    name:      row.name as string,
    lat:       row.lat as number,
    lng:       row.lng as number,
    order:     row.order as number,
    reached:   row.reached as boolean,
    reachedAt: row.reached_at as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}

export interface CreateJourneyInput {
  name: string;
  startName: string;
  startLat: number;
  startLng: number;
  destName: string;
  destLat: number;
  destLng: number;
  alertDistance?: number;
  userId?: string;
}

export interface CreateStationInput {
  journeyId: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
}

// ─── CRUD ──────────────────────────────────────────────────

export async function createJourney(input: CreateJourneyInput): Promise<Journey> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const currentUserId = input.userId ?? loadSession()?.id ?? null;

  const payload: Record<string, unknown> = {
    id,
    name:           input.name,
    status:         "planned",
    start_name:     input.startName,
    start_lat:      input.startLat,
    start_lng:      input.startLng,
    dest_name:      input.destName,
    dest_lat:       input.destLat,
    dest_lng:       input.destLng,
    alert_distance: input.alertDistance ?? 1000,
    created_at:     now,
    updated_at:     now,
  };

  if (currentUserId) {
    payload.user_id = currentUserId;
  }

  let { data, error } = await supabase
    .from("journeys")
    .insert(payload)
    .select()
    .single();

  if (error && (error.message.includes("user_id") || error.code === "PGRST204")) {
    delete payload.user_id;
    const retry = await supabase.from("journeys").insert(payload).select().single();
    if (retry.error) throw new Error(retry.error.message);
    return rowToJourney(retry.data);
  }

  if (error) throw new Error(error.message);
  return rowToJourney(data);
}

export async function getJourneys(userId?: string): Promise<Journey[]> {
  const currentUserId = userId ?? loadSession()?.id;

  let query = supabase
    .from("journeys")
    .select("*")
    .order("created_at", { ascending: false });

  if (currentUserId) {
    query = query.eq("user_id", currentUserId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("user_id") || error.code === "PGRST204") {
      const fallback = await supabase
        .from("journeys")
        .select("*")
        .order("created_at", { ascending: false });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map(rowToJourney);
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(rowToJourney);
}

export async function getJourney(id: string): Promise<Journey | undefined> {
  const { data, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToJourney(data) : undefined;
}

export async function updateJourneyStatus(id: string, status: JourneyStatus): Promise<void> {
  const now = new Date().toISOString();
  const payload: Record<string, unknown> = { status, updated_at: now };
  if (status === "active")    payload.started_at   = now;
  if (status === "completed") payload.completed_at = now;

  const { error } = await supabase.from("journeys").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteJourney(id: string): Promise<void> {
  // Stations cascade via FK
  const { error } = await supabase.from("journeys").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Journey Stations ──────────────────────────────────────

export async function addJourneyStation(input: CreateStationInput): Promise<JourneyStation> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabase
    .from("journey_stations")
    .insert({
      id,
      journey_id: input.journeyId,
      name:       input.name,
      lat:        input.lat,
      lng:        input.lng,
      order:      input.order,
      reached:    false,
      created_at: now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToStation(data);
}

export async function getStationsForJourney(journeyId: string): Promise<JourneyStation[]> {
  const { data, error } = await supabase
    .from("journey_stations")
    .select("*")
    .eq("journey_id", journeyId)
    .order("order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToStation);
}

export async function markStationReached(id: string): Promise<void> {
  const { error } = await supabase
    .from("journey_stations")
    .update({ reached: true, reached_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
