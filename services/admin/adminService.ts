import { supabase } from "@/lib/supabase";
import type { AuthUser } from "@/core/types";

// ─── Types ────────────────────────────────────────────────

export interface UserStorageStats {
  userId: string;
  aiMessages: number;
  aiPromptsUsed: number;
  aiStorageBytes: number; // estimated bytes for chat content
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  storage: UserStorageStats;
}

export interface GlobalStats {
  totalPlaces: number;
  totalTasks: number;
  totalNotes: number;
  totalChecklists: number;
  totalChecklistItems: number;
  totalRules: number;
  totalJourneys: number;
  totalUsers: number;
  totalAiMessages: number;
}

// ─── Helpers ──────────────────────────────────────────────

function estimateBytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export { formatBytes };

// ─── Admin Service ────────────────────────────────────────

export async function getAdminUserList(): Promise<AdminUserRow[]> {
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, name, email, role, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (usersErr) throw new Error(usersErr.message);

  const { data: usageRows } = await supabase
    .from("ai_usage")
    .select("user_id, prompt_count");

  const usageMap = new Map<string, number>(
    (usageRows ?? []).map((r) => [r.user_id as string, r.prompt_count as number])
  );

  const { data: msgRows } = await supabase
    .from("ai_chat_messages")
    .select("user_id, content");

  const msgMap = new Map<string, { count: number; bytes: number }>();
  for (const row of msgRows ?? []) {
    const uid = row.user_id as string;
    const existing = msgMap.get(uid) ?? { count: 0, bytes: 0 };
    msgMap.set(uid, {
      count: existing.count + 1,
      bytes: existing.bytes + estimateBytes(row.content as string),
    });
  }

  return (users ?? []).map((u) => {
    const msgs = msgMap.get(u.id) ?? { count: 0, bytes: 0 };
    const promptsUsed = usageMap.get(u.id) ?? 0;

    return {
      id: u.id as string,
      name: u.name as string,
      email: u.email as string,
      role: u.role as string,
      createdAt: u.created_at as string,
      updatedAt: u.updated_at as string,
      storage: {
        userId: u.id as string,
        aiMessages: msgs.count,
        aiPromptsUsed: promptsUsed,
        aiStorageBytes: msgs.bytes,
      },
    };
  });
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const queries = [
    supabase.from("places").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }),
    supabase.from("notes").select("id", { count: "exact", head: true }),
    supabase.from("checklists").select("id", { count: "exact", head: true }),
    supabase.from("checklist_items").select("id", { count: "exact", head: true }),
    supabase.from("rules").select("id", { count: "exact", head: true }),
    supabase.from("journeys").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("ai_chat_messages").select("id", { count: "exact", head: true }),
  ];

  const results = await Promise.all(queries);

  const [places, tasks, notes, checklists, checklistItems, rules, journeys, users, aiMessages] =
    results.map((r) => r.count ?? 0);

  return {
    totalPlaces: places,
    totalTasks: tasks,
    totalNotes: notes,
    totalChecklists: checklists,
    totalChecklistItems: checklistItems,
    totalRules: rules,
    totalJourneys: journeys,
    totalUsers: users,
    totalAiMessages: aiMessages,
  };
}

export async function adminDeleteUser(userId: string): Promise<void> {
  await supabase.from("ai_chat_messages").delete().eq("user_id", userId);
  await supabase.from("ai_usage").delete().eq("user_id", userId);
  const { error } = await supabase.from("users").delete().eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function adminResetUserAI(userId: string): Promise<void> {
  await supabase.from("ai_chat_messages").delete().eq("user_id", userId);
  await supabase.from("ai_usage").delete().eq("user_id", userId);
}

export async function adminChangeRole(
  userId: string,
  role: "admin" | "user"
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

