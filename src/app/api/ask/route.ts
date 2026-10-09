import { offlineAnswer, statusOf } from "@/lib/engine";
import { COACH_SYSTEM, llmText } from "@/lib/llm";
import { ROLES } from "@/lib/roles";
import type { Twin } from "@/lib/types";

export async function POST(req: Request) {
  const { twin, question, history = [] } = (await req.json()) as { twin: Twin; question: string; history?: { role: string; content: string }[] };
  const profile = {
    name: twin.name,
    archetype: twin.archetype,
    summary: twin.summary,
    skills: twin.technical.map((s) => ({ name: s.name, strength: s.strength, status: statusOf(s) })),
    soft: twin.soft,
    projects: twin.projects.map((p) => ({ title: p.title, tech: p.tech, bullets: p.bullets })),
    experience: twin.experience,
    education: twin.education,
    strengths: twin.strengths,
    weakAreas: twin.weakAreas,
    roleFit: twin.roleFit,
    roleRequirements: Object.fromEntries(ROLES.map((r) => [r.title, r.skills])),
  };
  const answer = await llmText(
    `${COACH_SYSTEM}\nYou are the candidate's Career Digital Twin — you know their profile below and answer in second person ("you"). Use markdown with bold and short bullet lists. Keep answers under 180 words. Ground every claim in the profile; when recommending skills, say whether they are missing or only listed.\nPROFILE:\n${JSON.stringify(profile).slice(0, 12000)}`,
    `${history.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${question}`,
  );
  return Response.json({ answer: answer ?? offlineAnswer(twin, question), source: answer ? "ai" : "engine" });
}
