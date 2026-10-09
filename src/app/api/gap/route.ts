import { gapReport } from "@/lib/engine";
import { COACH_SYSTEM, llmJSON } from "@/lib/llm";
import type { PlanWeek, Twin } from "@/lib/types";

export async function POST(req: Request) {
  const { twin, jd } = (await req.json()) as { twin: Twin; jd: string };
  if (!jd?.trim()) return Response.json({ error: "Paste a job description or title" }, { status: 400 });
  const report = gapReport(twin, jd);

  const missing = report.items.filter((i) => i.status !== "evidenced").map((i) => `${i.name} (${i.status}, weight ${i.weight})`);
  const ai = await llmJSON<{ plan: PlanWeek[]; verdict: string }>(
    COACH_SYSTEM,
    `Create a personalised 30-day plan (exactly 4 weeks) to close this candidate's gaps for: ${report.roleTitle}${report.company ? ` at ${report.company}` : ""}.
Match score: ${report.score}%.
Gaps: ${missing.join(", ")}
Candidate's existing projects (reuse them! e.g. "deploy your existing X project"): ${twin.projects.map((p) => `${p.title} [${p.tech.join(", ")}]`).join("; ")}
Proven skills: ${report.items.filter((i) => i.status === "evidenced").map((i) => i.name).join(", ")}
JD excerpt: ${jd.slice(0, 2500)}
Pattern to follow: Week 1 fundamentals of top gap → Week 2 apply it to an EXISTING project → Week 3 build a new project combining gaps → Week 4 add to resume honestly + interview prep.
Return JSON: {"verdict": "1 sentence honest verdict", "plan": [{"week": 1, "focus": "short title", "goal": "1 sentence", "tasks": ["3-4 concrete tasks"], "deliverable": "tangible output", "resource": "one free resource"}]}`,
  );
  if (ai?.plan?.length === 4) {
    report.plan = ai.plan;
    report.verdict = ai.verdict || report.verdict;
  }
  return Response.json({ ...report, source: ai?.plan?.length === 4 ? "ai" : "engine" });
}
