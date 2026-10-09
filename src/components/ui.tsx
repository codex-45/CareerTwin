"use client";

import clsx from "clsx";
import { Loader2, Sparkles, Cpu, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useApp, api } from "@/lib/store";
import { SAMPLE_CERTS, SAMPLE_LINKEDIN, SAMPLE_RESUME } from "@/lib/sample";
import type { Twin } from "@/lib/types";

export function PageHeader({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-violet-300/80">
          <Icon className="h-3.5 w-3.5" /> CareerTwin
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Card({ className, children, title, action }: { className?: string; children: React.ReactNode; title?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className={clsx("card p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-sm font-semibold text-slate-200">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  loading,
  disabled,
  className,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-600/20 hover:brightness-110",
        variant === "ghost" && "text-slate-300 hover:bg-white/5",
        variant === "outline" && "border border-white/15 text-slate-200 hover:bg-white/5",
        variant === "danger" && "bg-rose-500/90 text-white hover:bg-rose-500",
        className,
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

const TONES = {
  green: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  amber: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  red: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
  violet: "bg-violet-500/10 text-violet-200 ring-violet-400/20",
  slate: "bg-white/5 text-slate-300 ring-white/10",
  cyan: "bg-cyan-500/10 text-cyan-200 ring-cyan-400/20",
};

export function Badge({ children, tone = "slate", className }: { children: React.ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1", TONES[tone], className)}>{children}</span>;
}

export function SourceTag({ source }: { source?: string }) {
  if (!source) return null;
  return source === "ai" ? (
    <Badge tone="violet">
      <Sparkles className="h-3 w-3" /> AI-generated
    </Badge>
  ) : (
    <Badge tone="slate">
      <Cpu className="h-3 w-3" /> Rule engine
    </Badge>
  );
}

export const scoreColor = (s: number, max = 100) => {
  const p = s / max;
  return p >= 0.75 ? "#34d399" : p >= 0.55 ? "#a78bfa" : p >= 0.4 ? "#fbbf24" : "#fb7185";
};

export function ScoreRing({ value, max = 100, size = 120, label, sub }: { value: number; max?: number; size?: number; label?: string; sub?: string }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={scoreColor(value, max)}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-semibold text-white" style={{ fontSize: size / 4.6 }}>
          {max === 100 ? `${Math.round(value)}%` : value.toFixed(1)}
        </div>
        {label && <div className="text-[11px] text-slate-400">{label}</div>}
        {sub && <div className="text-[10px] text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

export function Bar({ value, max = 100, color }: { value: number; max?: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%`, background: color ?? scoreColor(value, max) }} />
    </div>
  );
}

export function Markdown({ text }: { text: string }) {
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) =>
      p.startsWith("**") ? (
        <strong key={i} className="font-semibold text-white">
          {p.slice(2, -2)}
        </strong>
      ) : p.startsWith("*") && p.endsWith("*") && p.length > 2 ? (
        <em key={i}>{p.slice(1, -1)}</em>
      ) : (
        p
      ),
    );
  return (
    <div className="space-y-1.5 text-sm leading-relaxed text-slate-300">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        const b = line.match(/^\s*([-*•]|\d+\.)\s+(.*)/);
        if (b)
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span className="text-violet-300">{/\d/.test(b[1]) ? b[1] : "•"}</span>
              <span>{inline(b[2])}</span>
            </div>
          );
        if (/^#+\s/.test(line)) return <div key={i} className="pt-1 font-semibold text-white">{line.replace(/^#+\s/, "")}</div>;
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}

export function useLoadDemo() {
  const { setInputs, setTwin, setGithub } = useApp();
  const [loading, setLoading] = useState(false);
  const run = async () => {
    setLoading(true);
    const inputs = { resumeText: SAMPLE_RESUME, linkedinText: SAMPLE_LINKEDIN, certificationsText: SAMPLE_CERTS, projectsText: "", skillsText: "", githubUser: "", targetRole: "ai-engineer" };
    setInputs(inputs);
    setGithub(undefined);
    try {
      setTwin(await api<Twin>("/api/twin", { inputs, prev: null }));
    } finally {
      setLoading(false);
    }
  };
  return { run, loading };
}

export function NeedTwin({ feature }: { feature: string }) {
  const demo = useLoadDemo();
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15">
        <UserRound className="h-7 w-7 text-violet-300" />
      </div>
      <h2 className="text-lg font-semibold text-white">Build your Career Twin first</h2>
      <p className="mt-2 text-sm text-slate-400">{feature} uses your AI career profile. Upload your resume (and optionally GitHub) to create it — or try the demo profile.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/twin" className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white">
          Create my twin
        </Link>
        <Button variant="outline" onClick={demo.run} loading={demo.loading}>
          Load demo profile
        </Button>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
      {items.map((i) => (
        <button key={i.id} onClick={() => onChange(i.id)} className={clsx("rounded-lg px-3.5 py-1.5 text-sm transition", value === i.id ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200")}>
          {i.label}
        </button>
      ))}
    </div>
  );
}
