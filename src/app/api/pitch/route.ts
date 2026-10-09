import { statusOf, templatePitch, type PitchInput } from "@/lib/engine";
import { COACH_SYSTEM, llmJSON } from "@/lib/llm";
import { detectCompany } from "@/lib/roles";
import type { Twin } from "@/lib/types";

export async function POST(req: Request) {
  const { twin, input } = (await req.json()) as { twin: Twin; input: PitchInput };
  const company = detectCompany(input.company) ?? detectCompany(input.jd ?? "");
  const ai = await llmJSON<{ pitch: string; proofPoints: string[]; tone: string }>(
    COACH_SYSTEM,
    `Write a ~75-word (30-second) spoken "Why should we hire you?" pitch in first person.
Company: ${input.company || "unspecified"}${company ? ` (values: ${company.values}; angle: ${company.pitchAngle} pitch)` : ""}
Role: ${input.role}
JD excerpt: ${(input.jd ?? "").slice(0, 1500)}
Proven skills: ${twin.technical.filter((s) => statusOf(s) === "evidenced").map((s) => s.name).join(", ")}
Projects: ${twin.projects.map((p) => `${p.title}: ${p.bullets.join(" ")}`).join(" || ").slice(0, 2000)}
Experience: ${twin.experience.map((e) => e.title).join("; ")}
Education: ${twin.education[0] ?? ""}
Interview performance strengths: ${(input.interviewStrengths ?? []).join(", ") || "not available"}
Rules: use ONLY facts above (no invented numbers), conversational, confident but humble, tailored to the company's values, end with why this company.
Return JSON: {"pitch": "...", "proofPoints": ["3 facts from the profile used"], "tone": "2-3 word tone description"}`,
  );
  if (ai?.pitch) return Response.json({ ...ai, source: "ai" });
  return Response.json({ pitch: templatePitch(twin, input), proofPoints: [], tone: company ? `${company.pitchAngle} focus` : "Balanced", source: "engine" });
}
