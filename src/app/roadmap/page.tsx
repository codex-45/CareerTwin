"use client";

import clsx from "clsx";
import { Briefcase, Building2, FolderKanban, Map } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Card, NeedTwin, PageHeader, ScoreRing } from "@/components/ui";
import { roadmapFor, type RoadStatus } from "@/lib/engine";
import { ROLES, guideFor } from "@/lib/roles";
import { useApp, useHydrated } from "@/lib/store";

const STYLE: Record<RoadStatus, { cls: string; icon: string; label: string }> = {
  learned: { cls: "border-emerald-400/40 bg-emerald-500/10 text-emerald-100", icon: "✓", label: "Learned" },
  learning: { cls: "border-amber-400/40 bg-amber-500/10 text-amber-100", icon: "🟡", label: "Learning" },
  missing: { cls: "border-rose-400/40 bg-rose-500/10 text-rose-100", icon: "🔴", label: "Missing" },
};
const CYCLE: RoadStatus[] = ["missing", "learning", "learned"];

export default function RoadmapPage() {
  const hydrated = useHydrated();
  const { twin, roadmap, setRoadStatus } = useApp();
  const [roleId, setRoleId] = useState<string | null>(null);

  if (!hydrated) return null;
  if (!twin) return <NeedTwin feature="The Career Roadmap" />;

  const id = roleId ?? twin.targetRole;
  const map = roadmapFor(twin, id, roadmap[id]);
  const cols = map.pillars.length;
  const projectsDone = map.progress >= 70;

  return (
    <div className="fade-up">
      <PageHeader icon={Map} title="AI Career Roadmap" subtitle="Your target role as a skill tree. Status is auto-detected from your twin's evidence — click any skill to update it as you learn.">
        <select className="input w-56" value={id} onChange={(e) => setRoleId(e.target.value)}>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              Target: {r.title}
            </option>
          ))}
        </select>
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <div className="flex flex-col items-center">
            <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-center font-semibold uppercase tracking-widest text-white shadow-lg shadow-violet-600/30">{map.role.title}</div>
            <div className="h-6 w-px bg-violet-400/50" />
            <div className="h-px bg-violet-400/50" style={{ width: `${((cols - 1) / cols) * 100}%` }} />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {map.pillars.map((p) => (
              <div key={p.name} className="flex flex-col items-center">
                <div className="h-5 w-px bg-violet-400/50" />
                <div className="w-full rounded-xl border border-white/15 bg-white/5 py-2 text-center text-sm font-semibold text-white">{p.name}</div>
                <div className="h-3 w-px bg-white/15" />
                <div className="w-full space-y-2">
                  {p.skills.map((s) => {
                    const st = STYLE[s.status];
                    return (
                      <button
                        key={s.name}
                        title={`${st.label}${s.status !== s.auto ? " (manual)" : " (auto-detected)"} · Resource: ${guideFor(s.name).resource}`}
                        onClick={() => {
                          const nextIdx = (CYCLE.indexOf(s.status) + 1) % CYCLE.length;
                          const nextSt = CYCLE[nextIdx];
                          setRoadStatus(id, s.name, nextSt === s.auto ? null : nextSt);
                        }}
                        className={clsx("flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:brightness-125", st.cls)}
                      >
                        <span>{s.name}</span>
                        <span className="text-xs">{st.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-center">
            <div className="h-px bg-violet-400/50" style={{ width: `${((cols - 1) / cols) * 100}%` }} />
            <div className="h-6 w-px bg-violet-400/50" />
            <Stage icon={FolderKanban} title="Projects" active={map.progress >= 45} sub={map.role.projects.join("  ·  ")} />
            <div className="h-6 w-px bg-violet-400/50" />
            <Stage icon={Briefcase} title="Internship" active={twin.experience.length > 0} sub={twin.experience.length ? `✓ ${twin.experience[0].title}` : "Apply once 2 roadmap projects are deployed"} />
            <div className="h-6 w-px bg-violet-400/50" />
            <Stage icon={Building2} title="Job" active={projectsDone && twin.experience.length > 0} sub={`${map.role.title} offer`} />
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="flex flex-col items-center">
            <ScoreRing value={map.progress} size={130} label="roadmap done" />
          </Card>
          <Card title="Legend">
            {(Object.keys(STYLE) as RoadStatus[]).map((k) => (
              <div key={k} className="mb-1.5 flex items-center gap-2 text-sm text-slate-300">
                <span className="w-5 text-center">{STYLE[k].icon}</span> {STYLE[k].label}
              </div>
            ))}
            <p className="mt-2 text-[11px] text-slate-500">Learned = proven in a project/work. Learning = listed or weak evidence. Click to override.</p>
          </Card>
          <Card title="Do next">
            {map.next.length ? (
              map.next.map((n) => (
                <div key={n} className="mb-3 text-sm">
                  <div className="font-medium text-white">🔴 {n}</div>
                  <div className="text-xs text-slate-400">{guideFor(n).learn[0]}</div>
                  <div className="text-[11px] text-violet-300">📚 {guideFor(n).resource}</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">All skills started — focus on the projects stage!</p>
            )}
            <Link href="/gap" className="mt-2 inline-block text-xs text-violet-300">
              Turn into a 30-day plan →
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stage({ icon: Icon, title, sub, active }: { icon: React.ElementType; title: string; sub: string; active: boolean }) {
  return (
    <div className={clsx("w-full max-w-lg rounded-xl border px-5 py-3 text-center", active ? "border-emerald-400/30 bg-emerald-500/[0.07]" : "border-white/10 bg-white/[0.03]")}>
      <div className="flex items-center justify-center gap-2 font-semibold text-white">
        <Icon className="h-4 w-4 text-violet-300" /> {title}
      </div>
      <div className="mt-0.5 text-xs text-slate-400">{sub}</div>
    </div>
  );
}
