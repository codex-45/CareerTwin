"use client";

import clsx from "clsx";
import { Check, CircleDashed, Flag, Target, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Button, Card, NeedTwin, PageHeader, ScoreRing, SourceTag } from "@/components/ui";
import { SAMPLE_JD } from "@/lib/sample";
import { api, useApp, useHydrated } from "@/lib/store";
import type { GapReport } from "@/lib/types";

const QUICK = ["Software Engineer – Google", "Cloud Engineer – Microsoft", "Backend Developer – Amazon", "AI Engineer – Startup", "Data Analyst – Deloitte"];

export default function GapPage() {
  const hydrated = useHydrated();
  const { twin, gap, setGap } = useApp();
  const [jd, setJd] = useState(gap?.jd ?? "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!hydrated) return null;
  if (!twin) return <NeedTwin feature="The Gap Detector" />;

  const run = async (text = jd) => {
    setJd(text);
    setLoading(true);
    setErr(null);
    try {
      const r = await api<GapReport & { source: string }>("/api/gap", { twin, jd: text });
      setGap({ ...r, jd: text });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <PageHeader icon={Target} title="Job Description → Personalised Gap Detector" subtitle="Paste a job title or full JD. The matching engine compares it with your twin's proven skills and tells you exactly what to do next." />

      <Card>
        <textarea className="input h-32 text-sm" placeholder="e.g. Software Engineer – Google, or paste the full job description…" value={jd} onChange={(e) => setJd(e.target.value)} />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={() => run()} loading={loading} disabled={!jd.trim()}>
            Analyse match
          </Button>
          <button onClick={() => run(SAMPLE_JD)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
            Sample: full Google JD
          </button>
          {QUICK.map((q) => (
            <button key={q} onClick={() => run(q)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:bg-white/5">
              {q}
            </button>
          ))}
        </div>
        {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
      </Card>

      {gap && (
        <div className="mt-6 grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-2">
            <Card className="text-center">
              <div className="font-mono text-xs uppercase tracking-widest text-slate-500">AI Matching Engine</div>
              <div className="mt-1 text-lg font-semibold text-white">
                {gap.roleTitle}
                {gap.company && <span className="text-violet-300"> – {gap.company}</span>}
              </div>
              <div className="my-4 flex justify-center">
                <ScoreRing value={gap.score} size={160} label="Match" />
              </div>
              <p className="text-sm text-slate-300">{gap.verdict}</p>
            </Card>
            <Card title="Requirement breakdown">
              <div className="space-y-1.5 font-mono text-sm">
                {gap.items.map((i) => (
                  <div key={i.name} className="flex items-center gap-2.5">
                    {i.status === "evidenced" ? <Check className="h-4 w-4 text-emerald-400" /> : i.status === "listed" ? <CircleDashed className="h-4 w-4 text-amber-400" /> : <X className="h-4 w-4 text-rose-400" />}
                    <span className={clsx(i.status === "missing" ? "text-slate-400" : "text-slate-100")}>{i.name}</span>
                    <span className="ml-auto flex items-center gap-1.5">
                      {i.weight === 3 && <Badge tone="violet">core</Badge>}
                      {i.status === "listed" && <Badge tone="amber">unproven</Badge>}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-white/5 pt-3 text-[11px] text-slate-500">✓ proven · ◌ listed but no project evidence · ✗ missing</div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card
              title={
                <span className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-violet-300" /> Your personalised 30-day plan
                </span>
              }
              action={<SourceTag source={gap.source} />}
            >
              <div className="relative space-y-4 before:absolute before:left-[17px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-violet-400/60 before:to-cyan-400/10">
                {gap.plan.map((w) => (
                  <div key={w.week} className="relative pl-12">
                    <div className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">W{w.week}</div>
                    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                      <div className="font-medium text-white">{w.focus}</div>
                      <div className="text-xs text-slate-400">{w.goal}</div>
                      <ul className="mt-2.5 space-y-1">
                        {w.tasks.map((t, i) => (
                          <li key={i} className="flex gap-2 text-sm text-slate-300">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-300" />
                            {t}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <Badge tone="green">Deliverable: {w.deliverable}</Badge>
                        {w.resource && <Badge>📚 {w.resource}</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/interview" className="rounded-lg bg-violet-500/15 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-500/25">
                  Practise interview for this job →
                </Link>
                <Link href="/pitch" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">
                  Generate pitch for this job →
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
