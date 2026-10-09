"use client";

import clsx from "clsx";
import {
  Award,
  BadgeCheck,
  Briefcase,
  CircleAlert,
  Code2,
  FileUp,
  FolderGit2,
  GitBranch,
  GraduationCap,
  HeartHandshake,
  Send,
  Sparkles,
  Star,
  Target,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Markdown, PageHeader, SourceTag, Tabs, scoreColor, useLoadDemo } from "@/components/ui";
import { readinessOf, statusOf } from "@/lib/engine";
import { ROLES, ROLE_BY_ID } from "@/lib/roles";
import { api, useApp, useHydrated } from "@/lib/store";
import type { Evidence, GithubSummary, Twin } from "@/lib/types";

type Tab = "build" | "profile" | "ask";

export default function TwinPage() {
  const hydrated = useHydrated();
  if (!hydrated) return null;
  return <TwinTabs />;
}

function TwinTabs() {
  const twin = useApp((s) => s.twin);
  const [tab, setTab] = useState<Tab>(twin ? "profile" : "build");
  return (
    <div className="fade-up">
      <PageHeader icon={UserRound} title="Career Digital Twin" subtitle="Not just a PDF — an AI representation of you as a candidate, built from verifiable evidence and updated every time you practise or improve.">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: "build", label: "1 · Build" },
            { id: "profile", label: "2 · Profile" },
            { id: "ask", label: "3 · Ask your twin" },
          ]}
        />
      </PageHeader>
      {tab === "build" && <BuildForm onDone={() => setTab("profile")} />}
      {tab === "profile" && (twin ? <ProfileTree twin={twin} /> : <EmptyHint onBuild={() => setTab("build")} />)}
      {tab === "ask" && (twin ? <AskTwin twin={twin} /> : <EmptyHint onBuild={() => setTab("build")} />)}
    </div>
  );
}

function EmptyHint({ onBuild }: { onBuild: () => void }) {
  return (
    <Card className="text-center">
      <p className="text-sm text-slate-400">No twin yet.</p>
      <Button className="mt-3" onClick={onBuild}>
        Build it now
      </Button>
    </Card>
  );
}

/* ------------------------------------------------------------------ */

function BuildForm({ onDone }: { onDone: () => void }) {
  const { inputs, setInputs, twin, setTwin, github, setGithub } = useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const demo = useLoadDemo();

  const upload = async (file: File, field: "resumeText" | "linkedinText") => {
    setBusy(field);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/parse", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInputs({ [field]: data.text });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const fetchGithub = async () => {
    setBusy("github");
    setErr(null);
    try {
      setGithub(await api<GithubSummary>(`/api/github?user=${encodeURIComponent(inputs.githubUser)}`));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const build = async () => {
    setBusy("build");
    setErr(null);
    try {
      setTwin(await api<Twin>("/api/twin", { inputs, github, prev: twin }));
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        <Card title="Resume" action={<span className="text-xs text-slate-500">PDF or TXT · parsed on your server</span>}>
          <DropZone label="Drop your resume PDF here or click to upload" loading={busy === "resumeText"} onFile={(f) => upload(f, "resumeText")} />
          <textarea
            className="input scroll-thin mt-3 h-56 font-mono text-xs"
            placeholder="…or paste resume text here"
            value={inputs.resumeText}
            onChange={(e) => setInputs({ resumeText: e.target.value })}
          />
        </Card>
        <Card title="LinkedIn" action={<span className="text-xs text-slate-500">Paste About / Experience / Skills, or upload the “Save to PDF” export</span>}>
          <DropZone compact label="Upload LinkedIn PDF export" loading={busy === "linkedinText"} onFile={(f) => upload(f, "linkedinText")} />
          <textarea className="input mt-3 h-24 text-xs" placeholder="Paste your LinkedIn About + Skills…" value={inputs.linkedinText} onChange={(e) => setInputs({ linkedinText: e.target.value })} />
        </Card>
      </div>

      <div className="space-y-5 lg:col-span-2">
        <Card title={<span className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> GitHub profile</span>}>
          <div className="flex gap-2">
            <input className="input" placeholder="username or github.com/username" value={inputs.githubUser} onChange={(e) => setInputs({ githubUser: e.target.value })} />
            <Button variant="outline" onClick={fetchGithub} loading={busy === "github"} disabled={!inputs.githubUser.trim()}>
              Analyse
            </Button>
          </div>
          {github && (
            <div className="mt-3 rounded-xl bg-black/30 p-3 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">@{github.username}</span>
                <button className="text-slate-500 hover:text-rose-300" onClick={() => setGithub(undefined)}>
                  remove
                </button>
              </div>
              <div className="mt-1 text-slate-400">
                {github.publicRepos} repos · ★ {github.totalStars} · {github.followers} followers
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {github.topLanguages.map((l) => (
                  <Badge key={l.name}>
                    {l.name} · {l.count}
                  </Badge>
                ))}
              </div>
              <div className="mt-2 text-slate-500">Skills evidenced from repos: {github.skills.join(", ") || "—"}</div>
            </div>
          )}
        </Card>
        <Card title="Extra evidence (optional)">
          <label className="mb-1 block text-xs text-slate-400">Projects not on the resume</label>
          <textarea className="input h-20 text-xs" placeholder={"Portfolio site | Next.js, Tailwind\n• Deployed on Vercel with 300 monthly visitors"} value={inputs.projectsText} onChange={(e) => setInputs({ projectsText: e.target.value })} />
          <label className="mb-1 mt-3 block text-xs text-slate-400">Certifications</label>
          <input className="input text-xs" placeholder="AWS Cloud Practitioner, Google Data Analytics…" value={inputs.certificationsText} onChange={(e) => setInputs({ certificationsText: e.target.value })} />
          <label className="mb-1 mt-3 block text-xs text-slate-400">Additional skills</label>
          <input className="input text-xs" placeholder="Docker, Figma, Public speaking…" value={inputs.skillsText} onChange={(e) => setInputs({ skillsText: e.target.value })} />
          <label className="mb-1 mt-3 block text-xs text-slate-400">Target career</label>
          <select className="input text-sm" value={inputs.targetRole} onChange={(e) => setInputs({ targetRole: e.target.value })}>
            <option value="">Auto-detect best fit</option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </Card>
        {err && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{err}</div>}
        <div className="flex gap-3">
          <Button className="flex-1 py-3" onClick={build} loading={busy === "build"} disabled={!inputs.resumeText.trim() && !github && !inputs.skillsText.trim()}>
            <Sparkles className="h-4 w-4" /> {twin ? "Update my twin" : "Generate my Career Twin"}
          </Button>
          <Button variant="outline" onClick={() => demo.run().then(onDone)} loading={demo.loading}>
            Demo
          </Button>
        </div>
      </div>
    </div>
  );
}

function DropZone({ label, onFile, loading, compact }: { label: string; onFile: (f: File) => void; loading?: boolean; compact?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
      className={clsx(
        "flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed text-sm transition",
        compact ? "py-3" : "py-7",
        over ? "border-violet-400 bg-violet-500/10" : "border-white/15 text-slate-400 hover:border-violet-400/50 hover:bg-white/[0.03]",
      )}
    >
      <FileUp className="h-5 w-5 text-violet-300" />
      {loading ? "Parsing…" : label}
      <input ref={ref} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const EV_LABEL: Record<Evidence, string> = {
  experience: "work",
  project: "project",
  github: "GitHub",
  certification: "cert",
  listed: "listed",
  implied: "implied",
};

function Branch({ icon: Icon, title, children, last }: { icon: React.ElementType; title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className="relative pl-10">
      <div className={clsx("absolute left-[15px] top-0 w-px bg-gradient-to-b from-violet-400/50 to-cyan-400/20", last ? "h-6" : "h-full")} />
      <div className="absolute left-[15px] top-6 h-px w-6 bg-violet-400/40" />
      <div className="pb-5">
        <div className="mb-2 flex items-center gap-2 pt-3.5 text-sm font-semibold text-white">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-violet-500/15">
            <Icon className="h-3.5 w-3.5 text-violet-300" />
          </span>
          {title}
        </div>
        <div className="card p-4">{children}</div>
      </div>
    </div>
  );
}

function ProfileTree({ twin }: { twin: Twin }) {
  const target = ROLE_BY_ID.get(twin.targetRole);
  const readiness = readinessOf(twin);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="card relative flex items-center gap-4 border-violet-400/30 bg-gradient-to-r from-violet-500/15 to-transparent p-5">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-xl font-semibold text-white">{twin.name[0]}</div>
          <div className="min-w-0">
            <div className="text-lg font-semibold text-white">{twin.name}</div>
            <div className="text-sm text-violet-200">{twin.archetype}</div>
            <div className="truncate text-xs text-slate-400">{twin.headline}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <SourceTag source={twin.aiEnhanced ? "ai" : "engine"} />
          </div>
        </div>

        <div className="mt-1">
          <Branch icon={Code2} title={`Technical Skills (${twin.technical.length})`}>
            <div className="mb-3 flex flex-wrap gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400" /> proven in projects/work/GitHub</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" /> only listed</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {twin.technical.map((s) => (
                <div
                  key={s.name}
                  title={`Evidence: ${s.evidence.map((e) => EV_LABEL[e]).join(", ")}`}
                  className={clsx("rounded-lg border px-2.5 py-1.5 text-xs", statusOf(s) === "evidenced" ? "border-emerald-400/25 bg-emerald-500/[0.07]" : "border-amber-400/25 bg-amber-500/[0.06]")}
                >
                  <div className="flex items-center gap-1.5 text-slate-100">
                    {s.name} <span style={{ color: scoreColor(s.strength) }}>{s.strength}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{s.evidence.map((e) => EV_LABEL[e]).join(" · ")}</div>
                </div>
              ))}
            </div>
          </Branch>
          <Branch icon={HeartHandshake} title="Soft Skills">
            <div className="flex flex-wrap gap-2">{twin.soft.length ? twin.soft.map((s) => <Badge key={s} tone="cyan">{s}</Badge>) : <span className="text-sm text-slate-500">None evidenced yet — add leadership/club/hackathon activities.</span>}</div>
          </Branch>
          <Branch icon={FolderGit2} title={`Projects (${twin.projects.length})`}>
            <div className="space-y-3">
              {twin.projects.map((p, i) => (
                <div key={i} className="text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-white">{p.title}</span>
                    {p.source === "github" && <Badge>GitHub</Badge>}
                    {p.tech.slice(0, 5).map((t) => (
                      <span key={t} className="text-[11px] text-violet-300">#{t}</span>
                    ))}
                  </div>
                  {p.bullets.slice(0, 2).map((b, j) => (
                    <div key={j} className="mt-0.5 text-xs text-slate-400">• {b}</div>
                  ))}
                </div>
              ))}
            </div>
          </Branch>
          <Branch icon={Briefcase} title="Experience">
            {twin.experience.length ? (
              twin.experience.map((e, i) => (
                <div key={i} className="mb-2 text-sm">
                  <div className="font-medium text-white">{e.title}</div>
                  {e.bullets.map((b, j) => <div key={j} className="text-xs text-slate-400">• {b}</div>)}
                </div>
              ))
            ) : (
              <span className="text-sm text-slate-500">No internships yet — projects carry extra weight for you.</span>
            )}
          </Branch>
          <Branch icon={GraduationCap} title="Education">
            {twin.education.map((e, i) => <div key={i} className="text-sm text-slate-300">{e}</div>)}
            {twin.certifications.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {twin.certifications.map((c) => (
                  <Badge key={c} tone="violet"><Award className="h-3 w-3" /> {c}</Badge>
                ))}
              </div>
            )}
          </Branch>
          <Branch icon={Star} title="Strengths">
            {twin.strengths.map((s) => (
              <div key={s} className="flex gap-2 text-sm text-slate-300"><BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />{s}</div>
            ))}
          </Branch>
          <Branch icon={CircleAlert} title="Weak Areas">
            {twin.weakAreas.map((s) => (
              <div key={s} className="flex gap-2 text-sm text-slate-300"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />{s}</div>
            ))}
          </Branch>
          <Branch icon={Target} title="Target Career" last>
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-medium text-white">{target?.title}</div>
                <div className="text-xs text-slate-400">{target?.blurb}</div>
              </div>
              <div className="text-2xl font-semibold" style={{ color: scoreColor(readiness) }}>{readiness}%</div>
            </div>
          </Branch>
        </div>
      </div>

      <div className="space-y-5">
        <Card title="Role suitability">
          <div className="space-y-2.5">
            {twin.roleFit.map((r) => (
              <div key={r.id} className="flex items-center gap-3 text-sm">
                <span className={clsx("w-40 truncate", r.id === twin.targetRole ? "text-violet-200" : "text-slate-400")}>{r.title}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: scoreColor(r.score) }} />
                </div>
                <span className="w-9 text-right text-xs text-white">{r.score}%</span>
              </div>
            ))}
          </div>
        </Card>
        {twin.github && (
          <Card title={<span className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> GitHub signal</span>}>
            <div className="text-sm text-slate-300">@{twin.github.username} · {twin.github.publicRepos} repos · ★ {twin.github.totalStars}</div>
            <div className="mt-2 space-y-1">
              {twin.github.topLanguages.slice(0, 5).map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="w-24">{l.name}</span>
                  <div className="h-1.5 flex-1 rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-400/70" style={{ width: `${(l.count / twin.github!.topLanguages[0].count) * 100}%` }} /></div>
                  <span>{l.count}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card title="How scores work">
          <p className="text-xs leading-relaxed text-slate-400">
            Each skill&apos;s strength comes from <b className="text-slate-200">evidence</b>, not keywords: listed only (30) → used in a project (+25) → work experience (+22) → GitHub repos (+14) → certification (+10).
            Mock-interview results raise or lower strengths over time, so your twin evolves with you.
          </p>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const SUGGESTED = ["What kind of candidate am I currently?", "What roles am I most suitable for?", "What skills am I missing for an AI Engineer role?", "What are my strongest proof points?"];

function AskTwin({ twin }: { twin: Twin }) {
  const [msgs, setMsgs] = useState<{ role: "user" | "assistant"; content: string; source?: string }[]>([
    { role: "assistant", content: `Hi ${twin.name.split(" ")[0]}! I'm your **Career Digital Twin**. I know your skills, projects and gaps. Ask me anything about your career.` },
  ]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const history = msgs.map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: "user", content: question }]);
    setQ("");
    setLoading(true);
    try {
      const r = await api<{ answer: string; source: string }>("/api/ask", { twin, question, history });
      setMsgs((m) => [...m, { role: "assistant", content: r.answer, source: r.source }]);
    } catch (e) {
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card flex h-[640px] flex-col">
      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-5">
        {msgs.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={clsx("max-w-[80%] rounded-2xl px-4 py-3", m.role === "user" ? "bg-violet-500/25 text-sm text-white" : "border border-white/10 bg-black/20")}>
              {m.role === "assistant" ? <Markdown text={m.content} /> : m.content}
              {m.source && <div className="mt-2"><SourceTag source={m.source} /></div>}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">Your twin is thinking…</div>}
        <div ref={end} />
      </div>
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {SUGGESTED.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 hover:border-violet-400/40 hover:bg-violet-500/10">
              {s}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask(q);
          }}
        >
          <input className="input" placeholder="Ask your twin…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" loading={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
