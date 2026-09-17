import type { AppSettings, TaskIntent, ReminderIntent } from "@/core/types";
import { getSettings } from "@/services/database/settings";

export async function parseNaturalLanguageInput(text: string): Promise<TaskIntent | null> {
  const settings = await getSettings();
  if (!settings.aiEnabled || !settings.aiApiKey) {
    throw new Error("AI is not enabled or API key is missing");
  }

  if (settings.aiProvider === "openai") {
    return await parseWithOpenAI(text, settings.aiApiKey);
  } else if (settings.aiProvider === "gemini") {
    return await parseWithGemini(text, settings.aiApiKey);
  }
  
  throw new Error("Unsupported AI Provider");
}

async function parseWithOpenAI(text: string, apiKey: string): Promise<TaskIntent> {
  const prompt = `
Extract task details from this text and return ONLY valid JSON:
Text: "${text}"

Schema:
{
  "title": "string (the core task without the location part)",
  "placeName": "string or null (e.g. 'Home', 'Office')",
  "priority": "low" | "medium" | "high"
}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return {
    title: parsed.title,
    // placeId would be resolved by the caller comparing placeName to the user's DB
    priority: parsed.priority || "medium",
  };
}

async function parseWithGemini(text: string, apiKey: string): Promise<TaskIntent> {
  const prompt = `
Extract task details from this text and return ONLY valid JSON:
Text: "${text}"

Schema:
{
  "title": "string (the core task without the location part)",
  "placeName": "string or null (e.g. 'Home', 'Office')",
  "priority": "low" | "medium" | "high"
}
`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text);
  
  return {
    title: parsed.title,
    priority: parsed.priority || "medium",
  };
}
