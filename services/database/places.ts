import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Place, PlaceColor } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

import { loadSession } from "@/services/auth/authService";

function rowToPlace(row: Record<string, unknown>): Place {
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    name: row.name as string,
    emoji: row.emoji as string,
    color: row.color as PlaceColor,
    lat: row.lat as number,
    lng: row.lng as number,
    radius: row.radius as number,
    address: row.address as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export interface CreatePlaceInput {
  name: string;
  emoji: string;
  color: PlaceColor;
  lat: number;
  lng: number;
  radius: number;
  address?: string;
  userId?: string;
}

// ─── CRUD ──────────────────────────────────────────────────

export async function createPlace(input: CreatePlaceInput): Promise<Place> {
  const now = new Date().toISOString();
  const id = uuidv4();
  const currentUserId = input.userId ?? loadSession()?.id ?? null;

  const payload: Record<string, unknown> = {
    id,
    name: input.name,
    emoji: input.emoji,
    color: input.color,
    lat: input.lat,
    lng: input.lng,
    radius: input.radius,
    address: input.address ?? null,
    created_at: now,
    updated_at: now,
  };

  if (currentUserId) {
    payload.user_id = currentUserId;
  }

  let { data, error } = await supabase
    .from("places")
    .insert(payload)
    .select()
    .single();

  if (error && (error.message.includes("user_id") || error.code === "PGRST204")) {
    delete payload.user_id;
    const retry = await supabase.from("places").insert(payload).select().single();
    if (retry.error) throw new Error(retry.error.message);
    return rowToPlace(retry.data);
  }

  if (error) throw new Error(error.message);
  return rowToPlace(data);
}

export async function getPlaces(userId?: string): Promise<Place[]> {
  const currentUserId = userId ?? loadSession()?.id;

  let query = supabase
    .from("places")
    .select("*")
    .order("created_at", { ascending: true });

  if (currentUserId) {
    query = query.eq("user_id", currentUserId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message.includes("user_id") || error.code === "PGRST204") {
      const fallback = await supabase
        .from("places")
        .select("*")
        .order("created_at", { ascending: true });
      if (fallback.error) throw new Error(fallback.error.message);
      return (fallback.data ?? []).map(rowToPlace);
    }
    throw new Error(error.message);
  }
  return (data ?? []).map(rowToPlace);
}

export async function getPlace(id: string): Promise<Place | undefined> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToPlace(data) : undefined;
}

export async function updatePlace(
  id: string,
  updates: Partial<Omit<Place, "id" | "createdAt">>
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined)    payload.name    = updates.name;
  if (updates.emoji !== undefined)   payload.emoji   = updates.emoji;
  if (updates.color !== undefined)   payload.color   = updates.color;
  if (updates.lat !== undefined)     payload.lat     = updates.lat;
  if (updates.lng !== undefined)     payload.lng     = updates.lng;
  if (updates.radius !== undefined)  payload.radius  = updates.radius;
  if (updates.address !== undefined) payload.address = updates.address;

  const { error } = await supabase.from("places").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deletePlace(id: string): Promise<void> {
  // Cascade delete is handled by FK constraints in Supabase schema.
  // Additional tables without FK: notification_history (place_id not FK).
  const { error } = await supabase.from("places").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
