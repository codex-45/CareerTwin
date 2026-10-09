import "server-only";

export type Provider = "gemini" | "openai" | "none";

export function provider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

export function providerLabel(): string {
  const p = provider();
  if (p === "gemini") return `Gemini (${process.env.GEMINI_MODEL || "gemini-2.5-flash"})`;
  if (p === "openai") return `${process.env.OPENAI_BASE_URL?.includes("groq") ? "Groq" : "OpenAI"} (${process.env.OPENAI_MODEL || "gpt-4o-mini"})`;
  return "Offline engine";
}

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms = 30000): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await p(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

async function complete(system: string, user: string, json: boolean): Promise<string | null> {
  const p = provider();
  if (p === "none") return null;
  try {
    if (p === "gemini") {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const res = await withTimeout((signal) =>
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { temperature: 0.6, ...(json ? { responseMimeType: "application/json" } : {}) },
          }),
        }),
      );
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map((x: { text?: string }) => x.text ?? "").join("") ?? null;
    }
    const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const res = await withTimeout((signal) =>
      fetch(`${base}/chat/completions`, {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.6,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          ...(json ? { response_format: { type: "json_object" } } : {}),
        }),
      }),
    );
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (e) {
    console.error("[llm]", (e as Error).message);
    return null;
  }
}

export async function llmJSON<T>(system: string, user: string): Promise<T | null> {
  const out = await complete(`${system}\nRespond ONLY with valid JSON.`, user, true);
  if (!out) return null;
  try {
    const cleaned = out.replace(/^```(json)?/m, "").replace(/```\s*$/m, "").trim();
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("[llm] bad JSON", out.slice(0, 200));
    return null;
  }
}

export const llmText = (system: string, user: string) => complete(system, user, false);

export const COACH_SYSTEM =
  "You are CareerTwin, an honest, encouraging career coach for engineering students. Never invent experience, skills or numbers the candidate does not have. Distinguish clearly between skills the candidate has proven, skills only listed, and skills they should learn (never tell them to claim skills they lack). Be concise and specific.";
