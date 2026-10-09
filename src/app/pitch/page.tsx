"use client";

import clsx from "clsx";
import { Copy, Megaphone, Mic, MicOff, Volume2 } from "lucide-react";
import { useState } from "react";
import { Badge, Button, Card, NeedTwin, PageHeader, SourceTag } from "@/components/ui";
import { useSpeechCoach } from "@/hooks/useSpeechCoach";
import { api, useApp, useHydrated } from "@/lib/store";
import type { DeliveryMetrics } from "@/lib/types";

interface Pitch {
  pitch: string;
  proofPoints: string[];
  tone: string;
  source: string;
}

const PRESETS = [
  { company: "Google", role: "Software Engineer" },
  { company: "Microsoft", role: "Cloud / Software Engineer" },
  { company: "Amazon", role: "Backend Engineer (SDE-1)" },
  { company: "Startup", role: "Full-stack Developer" },
];

export default function PitchPage() {
  const hydrated = useHydrated();
  const { twin, gap, interviews } = useApp();
  const [company, setCompany] = useState(gap?.company ?? "Google");
  const [role, setRole] = useState(gap?.roleTitle ?? "Software Engineer");
  const [jd, setJd] = useState(gap?.jd ?? "");
  const [result, setResult] = useState<Pitch | null>(null);
  const [compare, setCompare] = useState<(Pitch & { company: string; role: string })[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [practice, setPractice] = useState<DeliveryMetrics | null>(null);
  const speech = useSpeechCoach();
  const [spoken, setSpoken] = useState("");

  if (!hydrated) return null;
  if (!twin) return <NeedTwin feature="The pitch generator" />;

  const interviewStrengths = interviews[0]?.topics.filter((t) => t.overall >= 6).map((t) => t.topic) ?? [];

  const gen = async (c = company, r = role, j = jd) => api<Pitch>("/api/pitch", { twin, input: { company: c, role: r, jd: j, interviewStrengths } });

  const generate = async () => {
    setLoading("one");
    setPractice(null);
    try {
      setResult(await gen());
    } finally {
      setLoading(null);
    }
  };

  const generateAll = async () => {
    setLoading("all");
    try {
      const out = await Promise.all(PRESETS.map(async (p) => ({ ...(await gen(p.company, p.role, "")), ...p })));
      setCompare(out);
    } finally {
      setLoading(null);
    }
  };

  const speak = (t: string) => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(t));
  };

  const words = result?.pitch.split(/\s+/).length ?? 0;

  return (
    <div className="fade-up">
      <PageHeader icon={Megaphone} title={`“Why should we hire you?” Generator`} subtitle="Combines your resume, the job description and your mock-interview performance into a personalised 30-second pitch — different for every company." />
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2" title="Inputs">
          <div className="mb-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.company}
                onClick={() => {
                  setCompany(p.company);
                  setRole(p.role);
                }}
                className={clsx("rounded-lg border px-3 py-1.5 text-xs", company === p.company ? "border-violet-400/50 bg-violet-500/15 text-white" : "border-white/10 text-slate-400")}
              >
                {p.company}
              </button>
            ))}
          </div>
          <label className="mb-1 block text-xs text-slate-400">Company</label>
          <input className="input" value={company} onChange={(e) => setCompany(e.target.value)} />
          <label className="mb-1 mt-3 block text-xs text-slate-400">Role</label>
          <input className="input" value={role} onChange={(e) => setRole(e.target.value)} />
          <label className="mb-1 mt-3 block text-xs text-slate-400">Job description (optional)</label>
          <textarea className="input h-24 text-xs" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste JD for a sharper pitch" />
          <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs text-slate-400">
            <div className="mb-1 font-medium text-slate-300">Inputs used</div>
            ✓ Resume twin ({twin.technical.length} skills, {twin.projects.length} projects)
            <br />
            {jd ? "✓" : "○"} Job description
            <br />
            {interviewStrengths.length ? `✓ Interview strengths: ${interviewStrengths.join(", ")}` : "○ Interview performance (take a mock interview to include it)"}
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="flex-1" onClick={generate} loading={loading === "one"}>
              Generate pitch
            </Button>
            <Button variant="outline" onClick={generateAll} loading={loading === "all"}>
              Compare 4 companies
            </Button>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          {result ? (
            <Card title={`Your ${company} pitch`} action={<SourceTag source={result.source} />}>
              <blockquote className="border-l-2 border-violet-400 pl-4 text-[17px] leading-relaxed text-white">“{result.pitch}”</blockquote>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={words >= 60 && words <= 95 ? "green" : "amber"}>
                  {words} words · ~{Math.round(words / 2.5)}s
                </Badge>
                <Badge tone="violet">{result.tone}</Badge>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" onClick={() => speak(result.pitch)}>
                    <Volume2 className="h-4 w-4" /> Listen
                  </Button>
                  <Button variant="ghost" onClick={() => navigator.clipboard.writeText(result.pitch)}>
                    <Copy className="h-4 w-4" /> Copy
                  </Button>
                </div>
              </div>
              {result.proofPoints.length > 0 && (
                <div className="mt-4 text-xs text-slate-400">
                  <div className="mb-1 text-slate-300">Proof points drawn from your profile:</div>
                  {result.proofPoints.map((p) => (
                    <div key={p}>• {p}</div>
                  ))}
                </div>
              )}
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-200">Practise saying it</div>
                  <button
                    onClick={() => {
                      if (speech.listening) setPractice(speech.stop(spoken));
                      else {
                        setSpoken("");
                        setPractice(null);
                        speech.start(setSpoken);
                      }
                    }}
                    className={clsx("grid h-10 w-10 place-items-center rounded-full", speech.listening ? "rec-pulse bg-rose-500 text-white" : "bg-white/10 text-slate-200")}
                  >
                    {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
                {(spoken || speech.interim) && <p className="mt-2 text-xs text-slate-400">{spoken} {speech.interim}</p>}
                {practice && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-black/30 p-2">
                      <div className="text-lg font-semibold text-white">{practice.durationSec}s</div>
                      <div className="text-slate-500">target ≈ 30s</div>
                    </div>
                    <div className="rounded-lg bg-black/30 p-2">
                      <div className="text-lg font-semibold text-white">{practice.wpm || "—"}</div>
                      <div className="text-slate-500">WPM</div>
                    </div>
                    <div className="rounded-lg bg-black/30 p-2">
                      <div className="text-lg font-semibold text-white">{practice.fillers}</div>
                      <div className="text-slate-500">fillers</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            !compare.length && (
              <Card>
                <p className="text-sm text-slate-400">Pick a company and generate. Try “Compare 4 companies” to see how the same profile is pitched differently to Google, Microsoft, Amazon and a startup.</p>
              </Card>
            )
          )}
          {compare.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {compare.map((c) => (
                <Card key={c.company} title={`${c.company} → ${c.role}`} action={<SourceTag source={c.source} />}>
                  <p className="text-sm leading-relaxed text-slate-300">“{c.pitch}”</p>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge tone="violet">{c.tone}</Badge>
                    <button className="text-xs text-slate-400 hover:text-white" onClick={() => speak(c.pitch)}>
                      ▶ listen
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
