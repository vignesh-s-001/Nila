import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/core/db";
import type { Checklist, ChecklistItem } from "@/core/types";

// ─── Checklist CRUD ────────────────────────────────────────

export async function createChecklist(input: {
  name: string;
  placeId?: string;
  journeyId?: string;
}): Promise<Checklist> {
  const db = getDB();
  const now = new Date().toISOString();
  const checklist: Checklist = {
    id: uuidv4(),
    name: input.name,
    placeId: input.placeId,
    journeyId: input.journeyId,
    createdAt: now,
    updatedAt: now,
  };
  await db.checklists.add(checklist);
  return checklist;
}

export async function getChecklists(): Promise<Checklist[]> {
  const db = getDB();
  return db.checklists.orderBy("createdAt").toArray();
}

export async function getChecklistsByPlace(placeId: string): Promise<Checklist[]> {
  const db = getDB();
  return db.checklists.where("placeId").equals(placeId).sortBy("createdAt");
}

export async function getChecklist(id: string): Promise<Checklist | undefined> {
  const db = getDB();
  return db.checklists.get(id);
}

export async function updateChecklist(
  id: string,
  updates: Partial<Omit<Checklist, "id" | "createdAt">>
): Promise<void> {
  const db = getDB();
  await db.checklists.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteChecklist(id: string): Promise<void> {
  const db = getDB();
  await db.checklists.delete(id);
  await db.checklistItems.where("checklistId").equals(id).delete();
}

// ─── Checklist Items CRUD ──────────────────────────────────

export async function addChecklistItem(input: {
  checklistId: string;
  text: string;
  order: number;
}): Promise<ChecklistItem> {
  const db = getDB();
  const item: ChecklistItem = {
    id: uuidv4(),
    checklistId: input.checklistId,
    text: input.text,
    completed: false,
    order: input.order,
  };
  await db.checklistItems.add(item);
  return item;
}

export async function getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
  const db = getDB();
  return db.checklistItems.where("checklistId").equals(checklistId).sortBy("order");
}

export async function toggleChecklistItem(id: string): Promise<void> {
  const db = getDB();
  const item = await db.checklistItems.get(id);
  if (item) {
    await db.checklistItems.update(id, { completed: !item.completed });
  }
}

export async function deleteChecklistItem(id: string): Promise<void> {
  const db = getDB();
  await db.checklistItems.delete(id);
}

export async function resetChecklist(checklistId: string): Promise<void> {
  const db = getDB();
  const items = await db.checklistItems.where("checklistId").equals(checklistId).toArray();
  await Promise.all(items.map((item) => db.checklistItems.update(item.id, { completed: false })));
}
