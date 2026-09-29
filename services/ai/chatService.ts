import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const AI_PROMPT_LIMIT = 10;

export interface ChatMessage {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

// ─── helpers ───────────────────────────────────────────────

function rowToMessage(row: Record<string, unknown>): ChatMessage {
  return {
    id:        row.id as string,
    userId:    row.user_id as string,
    role:      row.role as "user" | "assistant",
    content:   row.content as string,
    createdAt: row.created_at as string,
  };
}

// ─── Usage tracking ────────────────────────────────────────

export async function getPromptCount(userId: string): Promise<number> {
  const { data } = await supabase
    .from("ai_usage")
    .select("prompt_count")
    .eq("user_id", userId)
    .maybeSingle();

  return (data?.prompt_count as number) ?? 0;
}

export async function incrementPromptCount(userId: string): Promise<number> {
  const current = await getPromptCount(userId);
  const next = current + 1;

  await supabase
    .from("ai_usage")
    .upsert(
      { user_id: userId, prompt_count: next, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  return next;
}

// ─── Chat history ──────────────────────────────────────────

export async function getChatHistory(userId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToMessage);
}

export async function saveMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessage> {
  const now = new Date().toISOString();
  const id = uuidv4();

  const { data, error } = await supabase
    .from("ai_chat_messages")
    .insert({ id, user_id: userId, role, content, created_at: now })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToMessage(data);
}

export async function clearChatHistory(userId: string): Promise<void> {
  await supabase.from("ai_chat_messages").delete().eq("user_id", userId);
  await supabase.from("ai_usage").delete().eq("user_id", userId);
}

// ─── Gemini chat call ──────────────────────────────────────

// Models tried in order — falls back automatically on 503
const GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
];

async function callGemini(
  model: string,
  contents: object[],
  systemInstruction: string,
  apiKey: string
): Promise<Response> {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    }
  );
}

export async function sendChatMessage(
  userMessage: string,
  history: ChatMessage[],
  apiKey: string
): Promise<string> {
  const systemInstruction = `You are Nila 🌙, a warm, mindful AI companion built into the Nila app.
Your role is to help users reflect, plan their day, set intentions, and feel grounded.
You speak gently, supportively, and concisely — like a caring friend, not a robotic assistant.
Keep responses focused and mindful. Use soft, encouraging language.`;

  const contents = [
    ...history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  let lastError = "";

  for (const model of GEMINI_MODELS) {
    const res = await callGemini(model, contents, systemInstruction, apiKey);

    if (res.ok) {
      const data = await res.json();
      console.log(`[Gemini] Responded via ${model}`);
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "I'm not sure how to respond right now 🌙";
    }

    const errorText = await res.text();

    // Only fall through to next model on capacity errors
    if (res.status === 503 || res.status === 429) {
      console.warn(`[Gemini] ${model} unavailable (${res.status}), trying next model…`);
      lastError = errorText;
      continue;
    }

    // For other errors (400, 404, etc.) fail immediately
    console.error("[Gemini API Error] Status:", res.status, "Body:", errorText);
    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
  }

  // All models exhausted
  console.error("[Gemini] All models exhausted. Last error:", lastError);
  throw new Error("All Gemini models are currently busy. Please try again in a moment 🌙");
}
