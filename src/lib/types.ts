import type { SkillCategory } from "./skills";

export type Evidence = "experience" | "project" | "github" | "certification" | "listed" | "implied";
export type SkillStatus = "evidenced" | "listed" | "missing";

export interface TwinSkill {
  name: string;
  category: SkillCategory;
  strength: number;
  evidence: Evidence[];
  mentions: number;
}

export interface TwinProject {
  title: string;
  tech: string[];
  bullets: string[];
  source: "resume" | "github" | "manual";
  url?: string;
}

export interface TwinExperience {
  title: string;
  bullets: string[];
}

export interface GithubSummary {
  username: string;
  name?: string;
  bio?: string;
  publicRepos: number;
  followers: number;
  totalStars: number;
  lastActive?: string;
  topLanguages: { name: string; count: number }[];
  topRepos: { name: string; description: string; stars: number; language: string | null; url: string; topics: string[] }[];
  skills: string[];
}

export interface TwinInputs {
  resumeText: string;
  linkedinText: string;
  projectsText: string;
  certificationsText: string;
  skillsText: string;
  githubUser: string;
  targetRole: string;
}

export interface Twin {
  name: string;
  headline: string;
  summary: string;
  archetype: string;
  level: string;
  contact: { email?: string; phone?: string; linkedin?: string; github?: string };
  technical: TwinSkill[];
  soft: string[];
  projects: TwinProject[];
  experience: TwinExperience[];
  education: string[];
  certifications: string[];
  strengths: string[];
  weakAreas: string[];
  targetRole: string;
  roleFit: { id: string; title: string; score: number }[];
  categoryScores: Record<string, number>;
  metricsRatio: number;
  github?: GithubSummary;
  history: { at: string; readiness: number; note: string }[];
  aiEnhanced: boolean;
  rawText: string;
}

export interface GapItem {
  name: string;
  weight: number;
  status: SkillStatus;
  strength: number;
}

export interface PlanWeek {
  week: number;
  focus: string;
  goal: string;
  tasks: string[];
  deliverable: string;
  resource?: string;
}

export interface GapReport {
  roleId: string;
  roleTitle: string;
  company?: string;
  score: number;
  items: GapItem[];
  plan: PlanWeek[];
  verdict: string;
}

export type Level = "easy" | "medium" | "hard" | "scenario";

export interface InterviewQuestion {
  topic: string;
  level: Level;
  q: string;
  keys: string[][];
  ideal: string;
  kind: "core" | "followup" | "practical";
}

export interface Evaluation {
  conceptual: number;
  practical: number;
  communication: number;
  overall: number;
  feedback: string;
  missed: string[];
  covered: string[];
}

export interface DeliveryMetrics {
  wpm: number;
  fillers: number;
  fillerList: Record<string, number>;
  longPauses: number;
  clarity: number;
  confidence: number;
  hedges: number;
  durationSec: number;
}

export interface PresenceMetrics {
  faceVisiblePct: number;
  lookingAwayPct: number;
  movementScore: number;
  postureShifts: number;
  samples: number;
}

export interface InterviewTurn {
  question: InterviewQuestion;
  answer: string;
  evaluation: Evaluation;
  delivery?: DeliveryMetrics;
  decision: string;
}
