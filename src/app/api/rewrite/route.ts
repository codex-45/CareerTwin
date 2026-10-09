import { rewriteClaim, type EvidenceInput } from "@/lib/engine";
import { COACH_SYSTEM, llmJSON } from "@/lib/llm";

export async function POST(req: Request) {
  const { text, evidence, context } = (await req.json()) as { text: string; evidence: EvidenceInput; context?: string };
  const provided = Object.entries(evidence).filter(([, v]) => v?.trim());
  if (!provided.length) return Response.json({ error: "Add at least one piece of evidence" }, { status: 400 });

  const ai = await llmJSON<{ rewrite: string; why: string }>(
    COACH_SYSTEM,
    `Rewrite this resume bullet to be credible, specific and ATS-friendly. Remove unsupported hype words (e.g. "highly scalable", "advanced", "robust") unless the evidence justifies them. Use ONLY the evidence given — never invent numbers. Start with a strong action verb, max 30 words, one line.
Project/role: ${context ?? ""}
Original: "${text}"
Evidence: ${provided.map(([k, v]) => `${k}: ${v}`).join("; ")}
Return JSON: {"rewrite": "...", "why": "1 sentence on what changed"}`,
  );
  if (ai?.rewrite) return Response.json({ ...ai, source: "ai" });
  return Response.json({ rewrite: rewriteClaim(text, evidence), why: "Removed unsupported adjectives and attached your concrete evidence.", source: "engine" });
}
