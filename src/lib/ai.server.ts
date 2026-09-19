// Server-only AI helper. Modular by design: swapping providers means changing
// only this file. Every caller must tolerate `null` (provider unavailable).

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.8-flash";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callAI(
  messages: AIMessage[],
  options: { model?: string; temperature?: number } = {},
): Promise<string | null> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return null;

  try {
    const response = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model ?? DEFAULT_MODEL,
        temperature: options.temperature ?? 0.4,
        messages,
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error", response.status, await response.text());
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return payload.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    console.error("AI gateway request failed", error);
    return null;
  }
}

/** Parse a JSON object out of a model response, tolerating code fences. */
export function parseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?/, (match) => (raw.trim().startsWith("{") || raw.trim().startsWith("[") ? match : ""))
    .replace(/```[\s\S]*$/, "")
    .trim();
  const candidate = cleaned.startsWith("{") || cleaned.startsWith("[") ? cleaned : raw.trim();
  try {
    return JSON.parse(candidate) as T;
  } catch {
    const start = candidate.search(/[[{]/);
    const end = Math.max(candidate.lastIndexOf("}"), candidate.lastIndexOf("]"));
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}
