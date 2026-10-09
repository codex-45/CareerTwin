import { BANK, heuristicEvaluate } from "@/lib/interview";
import { llmJSON } from "@/lib/llm";
import type { Evaluation, InterviewQuestion, Level } from "@/lib/types";

const INTERVIEWER =
  "You are a senior technical interviewer at a top tech company running an adaptive interview for a student. Be fair, specific and encouraging. Never reveal the ideal answer inside the question.";

const LEVEL_DESC: Record<Level, string> = {
  easy: "definition / basic concept",
  medium: "applied understanding — how and when to use it",
  hard: "deep internals, trade-offs and edge cases",
  scenario: "realistic production / project scenario requiring step-by-step problem solving",
};

export async function POST(req: Request) {
  const body = await req.json();

  if (body.action === "question") {
    const { topic, level, kind, focus, asked = [], context = "" } = body as {
      topic: string;
      level: Level;
      kind: InterviewQuestion["kind"];
      focus?: string;
      asked: string[];
      context?: string;
    };
    const ai = await llmJSON<{ q: string; keyPoints: string[]; ideal: string }>(
      INTERVIEWER,
      `Topic: ${topic}. Difficulty: ${level} (${LEVEL_DESC[level]}).
Question type: ${kind === "practical" ? "PRACTICAL follow-up — the candidate knows the theory but struggled to apply it; ask how they'd apply it in a concrete project" : kind === "followup" ? `FOLLOW-UP probing the missed point "${focus}" from their last answer` : "core question"}.
Candidate context: ${context.slice(0, 800)}
Already asked (do not repeat): ${asked.slice(-8).join(" | ")}
Return JSON: {"q": "the question (1-2 sentences)", "keyPoints": ["4 short key points a strong answer must cover, each 1-4 words"], "ideal": "2-sentence model answer"}`,
    );
    if (ai?.q) {
      const keys = (ai.keyPoints ?? []).slice(0, 5).map((p) => [p.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "")]);
      return Response.json({ question: { topic, level, kind, q: ai.q, keys, ideal: ai.ideal } satisfies InterviewQuestion, source: "ai" });
    }
    return Response.json({ question: null, source: "engine" });
  }

  if (body.action === "evaluate") {
    const { question, answer } = body as { question: InterviewQuestion; answer: string };
    const base = heuristicEvaluate(question, answer);
    if (answer.trim().split(/\s+/).length < 4) return Response.json({ evaluation: base, source: "engine" });
    const ai = await llmJSON<Evaluation>(
      INTERVIEWER,
      `Evaluate the candidate's answer.
Difficulty: ${question.level}. Topic: ${question.topic}.
Question: ${question.q}
Key points expected: ${question.keys.map((g) => g[0]).join(", ")}
Reference answer: ${question.ideal}
Candidate answer: """${answer.slice(0, 3000)}"""
Score each 0-10 (decimals allowed): conceptual (correctness of theory), practical (ability to apply: examples, trade-offs, steps), communication (structure, clarity, concision). overall = weighted for difficulty (scenario weighs practical more).
Return JSON: {"conceptual": n, "practical": n, "communication": n, "overall": n, "feedback": "2 sentences, specific", "covered": ["key points covered"], "missed": ["key points missed, 1-4 words each"]}`,
    );
    if (ai && typeof ai.overall === "number") {
      const clamp = (n: number) => Math.max(0, Math.min(10, +Number(n).toFixed(1)));
      return Response.json({
        evaluation: { ...ai, conceptual: clamp(ai.conceptual), practical: clamp(ai.practical), communication: clamp(ai.communication), overall: clamp(ai.overall), missed: ai.missed ?? [], covered: ai.covered ?? [] },
        source: "ai",
      });
    }
    return Response.json({ evaluation: base, source: "engine" });
  }

  return Response.json({ error: "unknown action", topics: Object.keys(BANK) }, { status: 400 });
}
