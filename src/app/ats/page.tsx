"use client";

import clsx from "clsx";
import { Ban, Check, CircleDashed, ScanSearch, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Bar, Card, NeedTwin, PageHeader, ScoreRing } from "@/components/ui";
import { atsSimulate } from "@/lib/engine";
import { useApp, useHydrated } from "@/lib/store";

export default function AtsPage() {
  const hydrated = useHydrated();
  const twin = useApp((s) => s.twin);
  const gap = useApp((s) => s.gap);
  const sim = useMemo(() => (twin ? atsSimulate(twin) : null), [twin]);
  const [sel, setSel] = useState<string | null>(null);

  if (!hydrated) return null;
  if (!twin || !sim) return <NeedTwin feature="The ATS Simulator" />;

  const row = sim.rows.find((r) => r.id === (sel ?? sim.rows[0].id))!;

  return (
    <div className="fade-up">
      <PageHeader icon={ScanSearch} title="Resume ATS Simulator" subtitle="Instead of one magic ATS number, see how your same resume scores against different job families — and which keywords you can honestly add vs. skills you must learn first." />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card title="Simulated match by job" className="lg:col-span-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pb-2 font-normal">Job</th>
                <th className="w-1/2 pb-2 font-normal">Match</th>
                <th className="w-16 pb-2 text-right font-normal">Score</th>
              </tr>
            </thead>
            <tbody>
              {gap && (
                <tr className="border-t border-white/5">
                  <td className="py-2.5 text-violet-200">
                    <Link href="/gap">
                      Your JD: {gap.roleTitle}
                      {gap.company ? ` – ${gap.company}` : ""}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4">
                    <Bar value={gap.score} />
                  </td>
                  <td className="py-2.5 text-right font-mono text-white">{gap.score}%</td>
                </tr>
              )}
              {sim.rows.map((r) => (
                <tr key={r.id} onClick={() => setSel(r.id)} className={clsx("cursor-pointer border-t border-white/5 transition hover:bg-white/[0.03]", row.id === r.id && "bg-violet-500/10")}>
                  <td className="py-2.5 pl-2 text-slate-200">{r.title}</td>
                  <td className="py-2.5 pr-4">
                    <Bar value={r.score} />
                  </td>
                  <td className="py-2.5 pr-2 text-right font-mono text-white">{r.score}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="ATS formatting check" className="lg:col-span-2">
          <div className="mb-4 flex items-center gap-4">
            <ScoreRing value={sim.formatScore} size={90} />
            <div className="text-xs text-slate-400">How reliably an ATS can parse your resume ({sim.words} words detected).</div>
          </div>
          <div className="space-y-2">
            {sim.checks.map((c) => (
              <div key={c.label} className="flex gap-2 text-sm">
                {c.ok ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}
                <div>
                  <div className={c.ok ? "text-slate-300" : "text-white"}>{c.label}</div>
                  {!c.ok && <div className="text-xs text-slate-500">{c.tip}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-5" title={`Keyword analysis — ${row.title} (${row.score}%)`} action={<span className="text-xs text-slate-500">click a job above to switch</span>}>
        <div className="grid gap-4 md:grid-cols-3">
          <Column
            icon={<Check className="h-4 w-4 text-emerald-400" />}
            title="Proven — keep them prominent"
            tone="green"
            items={row.evidenced}
            empty="No proven skills for this role yet."
            hint="These appear in your projects / experience / GitHub."
          />
          <Column
            icon={<CircleDashed className="h-4 w-4 text-amber-400" />}
            title="Listed but unproven — add evidence"
            tone="amber"
            items={row.listedOnly}
            empty="Nothing claimed without evidence. 👏"
            hint="You claim these, but no project shows them. Add a bullet that proves usage."
          />
          <Column
            icon={<Ban className="h-4 w-4 text-rose-400" />}
            title="Missing — learn first, don't claim"
            tone="red"
            items={row.missing}
            empty="No missing keywords!"
            hint="Do NOT add these to your resume until you've actually used them."
          />
        </div>
        <div className="mt-5 rounded-xl border border-violet-400/20 bg-violet-500/[0.06] p-4 text-sm text-slate-300">
          <b className="text-violet-200">Integrity guard:</b> CareerTwin never suggests keyword stuffing. ATS filters may pass a stuffed resume, but interviewers ask about every keyword — and the Adaptive Interviewer will too. Missing skills go into your{" "}
          <Link href="/roadmap" className="text-violet-300 underline">
            roadmap
          </Link>{" "}
          and{" "}
          <Link href="/gap" className="text-violet-300 underline">
            30-day plan
          </Link>{" "}
          instead.
        </div>
      </Card>
    </div>
  );
}

function Column({ icon, title, items, empty, hint, tone }: { icon: React.ReactNode; title: string; items: string[]; empty: string; hint: string; tone: "green" | "amber" | "red" }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        {icon} {title}
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.length ? (
          items.map((i) => (
            <Badge key={i} tone={tone}>
              {i}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-slate-500">{empty}</span>
        )}
      </div>
    </div>
  );
}
