"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { readinessOf, roleFitScore, type RoadStatus } from "./engine";
import { BANK } from "./interview";
import { ROLES } from "./roles";
import type { DeliveryMetrics, GapReport, GithubSummary, PresenceMetrics, Twin, TwinInputs } from "./types";

export interface InterviewRecord {
  at: string;
  overall: number;
  questions: number;
  topics: { topic: string; conceptual: number; practical: number; overall: number; reached: string }[];
  delivery?: DeliveryMetrics;
  presence?: PresenceMetrics;
}

interface State {
  inputs: TwinInputs;
  twin: Twin | null;
  github?: GithubSummary;
  gap?: GapReport & { jd: string; source?: string };
  interviews: InterviewRecord[];
  roadmap: Record<string, Record<string, RoadStatus>>;
  setInputs: (p: Partial<TwinInputs>) => void;
  setTwin: (t: Twin) => void;
  setGithub: (g?: GithubSummary) => void;
  setGap: (g: State["gap"]) => void;
  addInterview: (r: InterviewRecord) => void;
  setRoadStatus: (role: string, skill: string, s: RoadStatus | null) => void;
  reset: () => void;
}

const EMPTY: TwinInputs = { resumeText: "", linkedinText: "", projectsText: "", certificationsText: "", skillsText: "", githubUser: "", targetRole: "" };

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      inputs: EMPTY,
      twin: null,
      interviews: [],
      roadmap: {},
      setInputs: (p) => set({ inputs: { ...get().inputs, ...p } }),
      setTwin: (twin) => set({ twin }),
      setGithub: (github) => set({ github }),
      setGap: (gap) => set({ gap }),
      addInterview: (r) => {
        const twin = get().twin;
        if (twin) {
          const technical = twin.technical.map((s) => {
            const topic = r.topics.find((t) => BANK[t.topic]?.skills.includes(s.name));
            if (!topic) return s;
            const delta = Math.round((topic.overall - 5) * 2);
            return { ...s, strength: Math.max(10, Math.min(98, s.strength + delta)) };
          });
          const next = { ...twin, technical };
          next.roleFit = ROLES.map((role) => ({ id: role.id, title: role.title, score: roleFitScore(technical, role) })).sort((a, b) => b.score - a.score);
          next.history = [...twin.history, { at: r.at, readiness: readinessOf(next), note: `Interview: ${r.overall}/10` }].slice(-20);
          set({ twin: next });
        }
        set({ interviews: [r, ...get().interviews].slice(0, 20) });
      },
      setRoadStatus: (role, skill, s) => {
        const cur = { ...(get().roadmap[role] ?? {}) };
        if (s) cur[skill] = s;
        else delete cur[skill];
        set({ roadmap: { ...get().roadmap, [role]: cur } });
      },
      reset: () => set({ inputs: EMPTY, twin: null, github: undefined, gap: undefined, interviews: [], roadmap: {} }),
    }),
    { name: "careertwin-v1" },
  ),
);

const noop = () => () => {};
export const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}
