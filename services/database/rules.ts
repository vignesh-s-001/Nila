import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { Rule } from "@/core/types";

export type CreateRuleInput = Omit<Rule, "id" | "createdAt" | "updatedAt">;

export async function createRule(input: CreateRuleInput): Promise<Rule> {
  const db = getDB();
  const now = new Date().toISOString();
  const rule: Rule = {
    ...input,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  };
  await db.rules.add(rule);
  return rule;
}

export async function getRules(): Promise<Rule[]> {
  const db = getDB();
  return db.rules.orderBy("createdAt").toArray();
}

export async function getRulesByPlace(placeId: string): Promise<Rule[]> {
  const db = getDB();
  return db.rules.where("placeId").equals(placeId).sortBy("createdAt");
}

export async function updateRule(
  id: string,
  updates: Partial<Omit<Rule, "id" | "createdAt">>
): Promise<void> {
  const db = getDB();
  await db.rules.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteRule(id: string): Promise<void> {
  const db = getDB();
  await db.rules.delete(id);
}

export async function toggleRule(id: string): Promise<void> {
  const db = getDB();
  const rule = await db.rules.get(id);
  if (rule) {
    await db.rules.update(id, { enabled: !rule.enabled, updatedAt: new Date().toISOString() });
  }
}
