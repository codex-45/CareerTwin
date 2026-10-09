"use client";

import clsx from "clsx";
import { ArrowDown, Copy, ShieldCheck, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, NeedTwin, PageHeader, ScoreRing, SourceTag, scoreColor } from "@/components/ui";
import { analyzeClaims, type ClaimCheck, type EvidenceInput } from "@/lib/engine";
import { api, useApp, useHydrated } from "@/lib/store";

const FIELDS: { key: keyof EvidenceInput; label: string; ph: string }[] = [
  { key: "dataset", label: "Dataset size", ph: "170K+ song" },
  { key: "users", label: "Number of users", ph: "500+ students in beta" },
  { key: "architecture", label: "Architecture", ph: "Flask API + cosine-similarity index cached in memory" },
  { key: "performance", label: "Performance", ph: "recommendations in <200 ms" },
  { key: "technologies", label: "Technologies", ph: "Python, Pandas, Scikit-learn" },
];

export default function TruthPage() {
  const hydrated = useHydrated();
  const twin = useApp((s) => s.twin);
  const claims = useMemo(() => (twin ? analyzeClaims(twin) : []), [twin]);
  const [custom, setCustom] = useState("");
  const [extra, setExtra] = useState<ClaimCheck[]>([]);

  if (!hydrated) return null;
  if (!twin) return <NeedTwin feature="The Truth Checker" />;

  const all = [...extra, ...claims];
  const avg = all.length ? Math.round(all.reduce((a, c) => a + c.credibility, 0) / all.length) : 0;
  const flagged = all.filter((c) => c.flags.length || !c.hasMetric).length;

  const checkCustom = () => {
    if (!custom.trim()) return;
    const fake = { ...twin, projects: [{ title: "Custom", tech: [], bullets: [custom.trim()], source: "manual" as const }], experience: [] };
    setExtra((e) => [...analyzeClaims(fake), ...e]);
    setCustom("");
  };

  return (
    <div className="fade-up">
      <PageHeader icon={ShieldCheck} title="Resume Truth Checker" subtitle="Detects statements that sound impressive but aren't backed by evidence, asks you for proof, and rewrites them so your resume is credible — not artificially impressive." />
      <div className="mb-6 grid gap-5 md:grid-cols-3">
        <Card className="flex items-center gap-5">
          <ScoreRing value={avg} size={100} />
          <div>
            <div className="text-sm font-medium text-white">Resume credibility</div>
            <div className="text-xs text-slate-400">avg across {all.length} bullets</div>
          </div>
        </Card>
        <Card className="flex flex-col justify-center">
          <div className="text-3xl font-semibold text-amber-300">{flagged}</div>
          <div className="text-xs text-slate-400">bullets need evidence</div>
        </Card>
        <Card>
          <div className="mb-2 text-xs text-slate-400">Test any bullet</div>
          <div className="flex gap-2">
            <input className="input text-xs" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Built a highly scalable AI chatbot" onKeyDown={(e) => e.key === "Enter" && checkCustom()} />
            <Button variant="outline" onClick={checkCustom}>
              Check
            </Button>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        {all.map((c, i) => (
          <ClaimCard key={`${c.text}-${i}`} c={c} defaultOpen={i === 0} />
        ))}
        {!all.length && <Card>No project or experience bullets detected. Add bullets under PROJECTS / EXPERIENCE headings in your resume.</Card>}
      </div>
    </div>
  );
}

function ClaimCard({ c, defaultOpen }: { c: ClaimCheck; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen && (c.flags.length > 0 || !c.hasMetric));
  const [ev, setEv] = useState<EvidenceInput>({ technologies: c.tech.join(", ") });
  const [out, setOut] = useState<{ rewrite: string; why: string; source: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ok = !c.flags.length && c.hasMetric;

  const rewrite = async () => {
    setLoading(true);
    setErr(null);
    try {
      setOut(await api("/api/rewrite", { text: c.text, evidence: ev, context: c.context }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={clsx(ok && "opacity-80")}>
      <button className="flex w-full items-start gap-4 text-left" onClick={() => setOpen(!open)}>
        <div className="mt-0.5 text-center">
          <div className="text-lg font-semibold" style={{ color: scoreColor(c.credibility) }}>
            {c.credibility}
          </div>
          <div className="text-[10px] text-slate-500">credibility</div>
        </div>
        <div className="flex-1">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">{c.context}</div>
          <div className="mt-0.5 text-sm text-white">“{c.text}”</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.flags.map((f) => (
              <Badge key={f} tone="amber">
                <TriangleAlert className="h-3 w-3" /> {f}
              </Badge>
            ))}
            {!c.hasMetric && <Badge tone="red">No measurable result</Badge>}
            {ok && <Badge tone="green">Evidence-backed ✓</Badge>}
          </div>
        </div>
        <span className="text-xs text-violet-300">{open ? "close" : "fix"}</span>
      </button>

      {open && (
        <div className="mt-5 grid gap-5 border-t border-white/5 pt-5 lg:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200">
              <TriangleAlert className="h-4 w-4" /> Evidence check
            </div>
            <ul className="mb-4 space-y-1.5">
              {c.questions.map((q) => (
                <li key={q} className="text-sm text-slate-300">
                  • {q}
                </li>
              ))}
            </ul>
            <div className="grid gap-2">
              {FIELDS.map((f) => (
                <div key={f.key} className="grid grid-cols-[110px_1fr] items-center gap-2">
                  <label className="text-xs text-slate-400">{f.label}</label>
                  <input className="input py-2 text-xs" placeholder={f.ph} value={ev[f.key] ?? ""} onChange={(e) => setEv({ ...ev, [f.key]: e.target.value })} />
                </div>
              ))}
            </div>
            <Button className="mt-3" onClick={rewrite} loading={loading}>
              Generate credible version
            </Button>
            {err && <p className="mt-2 text-xs text-rose-300">{err}</p>}
          </div>
          <div className="flex flex-col justify-center">
            <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-slate-300 line-through decoration-rose-400/50">{c.text}</div>
            <ArrowDown className="mx-auto my-2 h-5 w-5 text-slate-500" />
            <div className={clsx("rounded-xl border p-4 text-sm", out ? "border-emerald-400/30 bg-emerald-500/[0.07] text-white" : "border-dashed border-white/10 text-slate-500")}>
              {out ? out.rewrite : "Your evidence-backed bullet will appear here. Only facts you provide are used — nothing is invented."}
            </div>
            {out && (
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400">{out.why}</span>
                <div className="flex items-center gap-2">
                  <SourceTag source={out.source} />
                  <button onClick={() => navigator.clipboard.writeText(out.rewrite)} className="text-slate-400 hover:text-white" title="Copy">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
