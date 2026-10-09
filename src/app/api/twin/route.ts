import { buildTwin } from "@/lib/engine";
import { COACH_SYSTEM, llmJSON } from "@/lib/llm";
import { ROLE_BY_ID } from "@/lib/roles";
import type { GithubSummary, Twin, TwinInputs } from "@/lib/types";

export async function POST(req: Request) {
  const { inputs, github, prev } = (await req.json()) as { inputs: TwinInputs; github?: GithubSummary; prev?: Twin | null };
  if (!inputs?.resumeText?.trim() && !inputs?.skillsText?.trim() && !github) {
    return Response.json({ error: "Provide a resume, skills or a GitHub profile." }, { status: 400 });
  }
  const twin = buildTwin(inputs, github, prev);

  const ai = await llmJSON<{ headline: string; summary: string; archetype: string; strengths: string[]; weakAreas: string[]; soft: string[] }>(
    COACH_SYSTEM,
    `Build a "career digital twin" persona for this candidate. Skill scores were computed deterministically — do not change them.
Target role: ${ROLE_BY_ID.get(twin.targetRole)?.title}
Skills (name:strength:evidence): ${twin.technical.map((s) => `${s.name}:${s.strength}:${s.evidence.join("/")}`).join(", ")}
Projects: ${twin.projects.map((p) => `${p.title} — ${p.bullets.join(" ")}`).join(" || ").slice(0, 3000)}
Experience: ${twin.experience.map((e) => `${e.title} — ${e.bullets.join(" ")}`).join(" || ").slice(0, 1500)}
Education: ${twin.education.join("; ")}
Certifications: ${twin.certifications.join("; ")}
GitHub: ${twin.github ? `${twin.github.publicRepos} repos, langs ${twin.github.topLanguages.map((l) => l.name).join(", ")}` : "not provided"}
Engine-detected weak areas: ${twin.weakAreas.join("; ")}

Return JSON: {"headline": "<=12 words professional headline", "summary": "3 sentences: what kind of candidate they are right now, evidence, trajectory", "archetype": "<=5 word persona e.g. 'Internship-ready Full-stack Builder'", "strengths": ["4-5 specific evidence-based strengths"], "weakAreas": ["4-5 specific, actionable weak areas"], "soft": ["soft skills evidenced in text"]}`,
  );
  if (ai?.summary) {
    twin.headline = ai.headline || twin.headline;
    twin.summary = ai.summary;
    twin.archetype = ai.archetype || twin.archetype;
    if (ai.strengths?.length) twin.strengths = ai.strengths;
    if (ai.weakAreas?.length) twin.weakAreas = ai.weakAreas;
    if (ai.soft?.length) twin.soft = [...new Set([...twin.soft, ...ai.soft])].slice(0, 8);
    twin.aiEnhanced = true;
  }
  return Response.json(twin);
}
