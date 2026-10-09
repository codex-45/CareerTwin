"use client";

import { ArrowRight, BrainCircuit, Map, Megaphone, Mic, ScanSearch, ShieldCheck, Target, TrendingUp, UserRound } from "lucide-react";
import Link from "next/link";
import { Radar } from "@/components/Radar";
import { Badge, Bar, Button, Card, ScoreRing, useLoadDemo } from "@/components/ui";
import { readinessOf, statusOf } from "@/lib/engine";
import { ROLE_BY_ID } from "@/lib/roles";
import { CATEGORIES } from "@/lib/skills";
import { useApp, useHydrated } from "@/lib/store";

const FEATURES = [
  { href: "/twin", icon: UserRound, title: "Career Digital Twin", text: "An AI persona built from your resume, GitHub & LinkedIn that evolves as you grow." },
  { href: "/gap", icon: Target, title: "JD Gap Detector", text: "Paste any job → match %, gaps and a personalised 30-day plan." },
  { href: "/interview", icon: Mic, title: "Adaptive AI Interviewer", text: "Difficulty adapts to your answers. Voice + webcam delivery coaching." },
  { href: "/pitch", icon: Megaphone, title: "“Why hire you?” Pitch", text: "A 30-second pitch tailored to each company's values." },
  { href: "/truth", icon: ShieldCheck, title: "Resume Truth Checker", text: "Flags hype without evidence and rewrites it credibly." },
  { href: "/ats", icon: ScanSearch, title: "ATS Simulator", text: "See your match across roles — without keyword stuffing." },
  { href: "/roadmap", icon: Map, title: "Career Roadmap", text: "Skill tree for your target role: learned, learning, missing." },
];

export default function Dashboard() {
  const hydrated = useHydrated();
  const twin = useApp((s) => s.twin);
  const interviews = useApp((s) => s.interviews);
  const demo = useLoadDemo();

  if (!hydrated) return null;

  if (!twin) {
    return (
      <div className="fade-up">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-500/10 p-10 md:p-14">
          <Badge tone="violet">
            <BrainCircuit className="h-3 w-3" /> AI Resume & Interview Coach
          </Badge>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            Don&apos;t just fix your resume. <span className="gradient-text">Build your Career Digital Twin.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            CareerTwin turns your resume, GitHub and LinkedIn into a living AI profile — then tells you exactly what to do next: which roles fit, what&apos;s missing, how to prove it, and how to
            nail the interview.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/twin" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-600/30">
              Create my twin <ArrowRight className="h-4 w-4" />
            </Link>
            <Button variant="outline" onClick={demo.run} loading={demo.loading} className="px-5 py-3">
              Try with demo profile
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="card group p-5 transition hover:border-violet-400/30 hover:bg-white/[0.05]">
              <f.icon className="h-5 w-5 text-violet-300" />
              <div className="mt-3 font-medium text-white">{f.title}</div>
              <p className="mt-1 text-sm text-slate-400">{f.text}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const target = ROLE_BY_ID.get(twin.targetRole);
  const readiness = readinessOf(twin);
  const evidenced = twin.technical.filter((s) => statusOf(s) === "evidenced").length;
  const last = interviews[0];

  return (
    <div className="fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-sm text-slate-400">Welcome back,</div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{twin.name}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone="violet">{twin.archetype}</Badge>
            <Badge tone="cyan">Target: {target?.title}</Badge>
            {twin.aiEnhanced && <Badge tone="green">AI-enhanced</Badge>}
          </div>
        </div>
        <Link href="/twin" className="text-sm text-violet-300 hover:text-violet-200">
          Update twin →
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Readiness for target role" className="flex flex-col items-center">
          <ScoreRing value={readiness} size={150} label={target?.title} />
          <p className="mt-4 text-center text-sm text-slate-400">{twin.summary}</p>
        </Card>
        <Card title="Skill fingerprint">
          <Radar data={CATEGORIES.map((c) => ({ label: c, value: twin.categoryScores[c] ?? 0 }))} />
        </Card>
        <Card title="Best-fit roles">
          <div className="space-y-3.5">
            {twin.roleFit.slice(0, 6).map((r) => (
              <div key={r.id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{r.title}</span>
                  <span className="font-medium text-white">{r.score}%</span>
                </div>
                <Bar value={r.score} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-5 md:grid-cols-4">
        {[
          { label: "Proven skills", value: evidenced, sub: `of ${twin.technical.length} detected` },
          { label: "Projects", value: twin.projects.length, sub: twin.github ? "incl. GitHub" : "from resume" },
          { label: "Quantified bullets", value: `${Math.round(twin.metricsRatio * 100)}%`, sub: "target ≥ 40%" },
          { label: "Last interview", value: last ? `${last.overall}/10` : "—", sub: last ? `${last.questions} adaptive Qs` : "not taken yet" },
        ].map((k) => (
          <div key={k.label} className="card p-5">
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{k.value}</div>
            <div className="text-xs text-slate-500">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-300" /> Your twin is evolving</span>}>
          <Timeline points={twin.history} />
        </Card>
        <Card title="Recommended next steps">
          <div className="space-y-2.5">
            {twin.weakAreas.slice(0, 4).map((w) => (
              <div key={w} className="flex gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {w}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/gap" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Check a job →</Link>
            <Link href="/interview" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Mock interview →</Link>
            <Link href="/truth" className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10">Fix weak bullets →</Link>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.slice(1).map((f) => (
          <Link key={f.href} href={f.href} className="card group flex items-start gap-3 p-4 transition hover:border-violet-400/30">
            <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <div>
              <div className="text-sm font-medium text-white">{f.title}</div>
              <p className="mt-0.5 text-xs text-slate-500">{f.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Timeline({ points }: { points: { at: string; readiness: number; note: string }[] }) {
  if (points.length < 2) {
    return (
      <div className="text-sm text-slate-400">
        Readiness snapshot: <span className="font-semibold text-white">{points[0]?.readiness ?? 0}%</span>. Take a mock interview or update your resume — every change is tracked here so you can see your growth.
      </div>
    );
  }
  const w = 460;
  const h = 120;
  const xs = (i: number) => 20 + (i * (w - 40)) / (points.length - 1);
  const ys = (v: number) => h - 15 - (v / 100) * (h - 30);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full">
        <polyline fill="none" stroke="#a78bfa" strokeWidth="2" points={points.map((p, i) => `${xs(i)},${ys(p.readiness)}`).join(" ")} />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(p.readiness)} r="4" fill="#0d1322" stroke="#c4b5fd" strokeWidth="2" />
            <text x={xs(i)} y={ys(p.readiness) - 9} fontSize="10" fill="#cbd5e1" textAnchor="middle">
              {p.readiness}%
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        {points.slice(-5).map((p, i) => (
          <span key={i}>
            {new Date(p.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · {p.note}
          </span>
        ))}
      </div>
    </div>
  );
}
