import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import type { Rule } from "@/core/types";

// ─── helpers ───────────────────────────────────────────────

function rowToRule(row: Record<string, unknown>): Rule {
  return {
    id:               row.id as string,
    placeId:          row.place_id as string,
    triggerEvent:     row.trigger_event as Rule["triggerEvent"],
    conditions:       row.conditions as Rule["conditions"],
    actions:          row.actions as string[],
    actionsTriggered: row.actions_triggered as string[],
    enabled:          row.enabled as boolean,
    createdAt:        row.created_at as string,
    updatedAt:        row.updated_at as string,
  };
}

export type CreateRuleInput = Omit<Rule, "id" | "createdAt" | "updatedAt">;

// ─── CRUD ──────────────────────────────────────────────────

export async function createRule(input: CreateRuleInput): Promise<Rule> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabase
    .from("rules")
    .insert({
      id,
      place_id:          input.placeId,
      trigger_event:     input.triggerEvent,
      conditions:        input.conditions,
      actions:           input.actions,
      actions_triggered: input.actionsTriggered,
      enabled:           input.enabled,
      created_at:        now,
      updated_at:        now,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToRule(data);
}

export async function getRules(): Promise<Rule[]> {
  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToRule);
}

export async function getRulesByPlace(placeId: string): Promise<Rule[]> {
  const { data, error } = await supabase
    .from("rules")
    .select("*")
    .eq("place_id", placeId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToRule);
}

export async function updateRule(
  id: string,
  updates: Partial<Omit<Rule, "id" | "createdAt">>
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.placeId          !== undefined) payload.place_id          = updates.placeId;
  if (updates.triggerEvent     !== undefined) payload.trigger_event     = updates.triggerEvent;
  if (updates.conditions       !== undefined) payload.conditions        = updates.conditions;
  if (updates.actions          !== undefined) payload.actions           = updates.actions;
  if (updates.actionsTriggered !== undefined) payload.actions_triggered = updates.actionsTriggered;
  if (updates.enabled          !== undefined) payload.enabled           = updates.enabled;

  const { error } = await supabase.from("rules").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteRule(id: string): Promise<void> {
  const { error } = await supabase.from("rules").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function toggleRule(id: string): Promise<void> {
  const { data: existing, error: fetchErr } = await supabase
    .from("rules")
    .select("enabled")
    .eq("id", id)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);

  const { error } = await supabase
    .from("rules")
    .update({ enabled: !existing.enabled, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
