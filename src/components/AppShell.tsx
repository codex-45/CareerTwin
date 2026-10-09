"use client";

import clsx from "clsx";
import { BrainCircuit, Gauge, LayoutDashboard, Map, Megaphone, Mic, ScanSearch, ShieldCheck, Target, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp, useHydrated } from "@/lib/store";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/twin", label: "Digital Twin", icon: UserRound },
  { href: "/gap", label: "JD Gap Detector", icon: Target },
  { href: "/interview", label: "Adaptive Interview", icon: Mic },
  { href: "/pitch", label: "Hire-Me Pitch", icon: Megaphone },
  { href: "/truth", label: "Truth Checker", icon: ShieldCheck },
  { href: "/ats", label: "ATS Simulator", icon: ScanSearch },
  { href: "/roadmap", label: "Career Roadmap", icon: Map },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hydrated = useHydrated();
  const twin = useApp((s) => s.twin);
  const [status, setStatus] = useState<{ ai: boolean; label: string } | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ai: false, label: "Offline engine" }));
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-black/20 p-4 md:flex">
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2 pt-1">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
            <BrainCircuit className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-white">CareerTwin</div>
            <div className="text-[11px] text-slate-500">AI Resume & Interview Coach</div>
          </div>
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? path === "/" : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active ? "bg-gradient-to-r from-violet-500/20 to-cyan-500/5 text-white ring-1 ring-violet-400/20" : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
                )}
              >
                <Icon className={clsx("h-4 w-4", active ? "text-violet-300" : "")} />
                {label}
              </Link>
            );
          })}
        </nav>
        {hydrated && twin && (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Your twin</div>
            <div className="mt-1 truncate text-sm font-medium text-white">{twin.name}</div>
            <div className="truncate text-xs text-violet-300">{twin.archetype}</div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2 text-xs text-slate-400">
          <Gauge className="h-3.5 w-3.5" />
          <span className={clsx("h-2 w-2 rounded-full", status?.ai ? "bg-emerald-400" : "bg-amber-400")} />
          <span className="truncate">{status ? (status.ai ? status.label : "Offline engine (no API key)") : "…"}</span>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-20 flex gap-1 overflow-x-auto border-b border-white/5 bg-ink/90 p-2 backdrop-blur md:hidden">
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} className={clsx("whitespace-nowrap rounded-lg px-3 py-1.5 text-xs", path === href ? "bg-violet-500/20 text-white" : "text-slate-400")}>
              {label}
            </Link>
          ))}
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
