import { CATEGORIES, IMPLIES, SKILL_BY_NAME, SOFT_SKILLS, detectSkills } from "./skills";
import { ROLES, ROLE_BY_ID, detectCompany, detectRole, guideFor, type RoleDef } from "./roles";
import type {
  Evidence,
  GapItem,
  GapReport,
  GithubSummary,
  PlanWeek,
  SkillStatus,
  Twin,
  TwinExperience,
  TwinInputs,
  TwinProject,
  TwinSkill,
} from "./types";

/* ------------------------------------------------------------------ */
/* Resume parsing                                                      */
/* ------------------------------------------------------------------ */

type Section = "summary" | "education" | "experience" | "projects" | "skills" | "certifications" | "achievements" | "other";

const HEADINGS: [Section, RegExp][] = [
  ["summary", /^(summary|professional summary|objective|career objective|profile|about me|about)$/],
  ["education", /^(education|academic background|academics|academic details|qualifications)$/],
  ["experience", /^(experience|work experience|professional experience|internships?|internship experience|employment|work history)$/],
  ["projects", /^(projects?|personal projects|academic projects|key projects|selected projects)$/],
  ["skills", /^(skills|technical skills|core competencies|tech stack|technologies|skills & tools|skills and tools)$/],
  ["certifications", /^(certifications?|certificates|courses|licenses|certifications & courses)$/],
  ["achievements", /^(achievements|awards|honou?rs|accomplishments|extracurriculars?|extra-curricular activities|positions of responsibility|activities|leadership|volunteering)$/],
];

const BULLET = /^\s*[•▪●◦‣\-*–>]\s*/;

function normalise(text: string): string {
  let t = text.replace(/\r/g, "");
  t = t.replace(/\s*[•▪●◦‣]\s*/g, "\n• ");
  const caps = "EDUCATION|EXPERIENCE|WORK EXPERIENCE|INTERNSHIPS?|PROJECTS|TECHNICAL SKILLS|SKILLS|CERTIFICATIONS?|ACHIEVEMENTS|SUMMARY|OBJECTIVE|POSITIONS OF RESPONSIBILITY|EXTRACURRICULARS?";
  t = t.replace(new RegExp(`\\s(${caps})\\s`, "g"), "\n$1\n");
  return t;
}

function headingOf(line: string): Section | null {
  const clean = line.toLowerCase().replace(/[^a-z& -]/g, "").trim();
  if (!clean || clean.length > 40) return null;
  for (const [sec, re] of HEADINGS) if (re.test(clean)) return sec;
  return null;
}

export function parseSections(text: string): Record<Section, string[]> {
  const out: Record<Section, string[]> = { summary: [], education: [], experience: [], projects: [], skills: [], certifications: [], achievements: [], other: [] };
  let cur: Section = "other";
  for (const raw of normalise(text).split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const h = headingOf(line);
    if (h) {
      cur = h;
      continue;
    }
    out[cur].push(line);
  }
  return out;
}

function groupEntries(lines: string[]): { title: string; bullets: string[] }[] {
  const entries: { title: string; bullets: string[] }[] = [];
  for (const line of lines) {
    const isBullet = BULLET.test(line);
    const text = line.replace(BULLET, "").trim();
    if (!text) continue;
    const cur = entries[entries.length - 1];
    if (isBullet || (cur && text.length > 95)) {
      if (cur) cur.bullets.push(text);
      else entries.push({ title: text.slice(0, 60), bullets: [text] });
    } else if (cur && cur.bullets.length === 0 && entries.length > 0 && /^(\w{3,9}\s\d{4}|\d{4}|present)/i.test(text)) {
      cur.title += ` · ${text}`;
    } else {
      entries.push({ title: text, bullets: [] });
    }
  }
  return entries.filter((e) => e.title.length > 2);
}

function toProjects(lines: string[], source: TwinProject["source"]): TwinProject[] {
  return groupEntries(lines).map((e) => {
    const [title, ...rest] = e.title.split(/\s[|–—]\s|\s-\s|\|/);
    const all = [e.title, ...e.bullets].join(" ");
    return {
      title: title.trim().replace(/[:,]$/, ""),
      tech: [...detectSkills(all).keys()],
      bullets: e.bullets.length ? e.bullets : rest.length ? [rest.join(" ")] : [],
      source,
    };
  });
}

const METRIC = /(\d[\d,.]*\s?(%|\+|k\b|k\+|x\b|ms\b|sec|seconds|users|students|songs|records|rows|images|requests|downloads|stars|lakh|million|hours|days|members|participants|teams|customers|accuracy|precision|cgpa|gpa)|\b(top|rank(ed)?)\s?#?\d+|\$\d+|₹\s?\d+)/i;
export const hasMetric = (s: string) => METRIC.test(s);

export function extractContact(text: string) {
  return {
    email: text.match(/[\w.+-]+@[\w-]+\.[\w.]+/)?.[0],
    phone: text.match(/(\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}|\+?\d[\d\s-]{9,14}\d/)?.[0],
    linkedin: text.match(/linkedin\.com\/in\/[\w-]+/i)?.[0],
    github: text.match(/github\.com\/[\w-]+/i)?.[0],
  };
}

function guessName(text: string): string {
  for (const raw of text.split("\n").slice(0, 6)) {
    const l = raw.trim();
    if (l && l.length < 40 && !/[@\d|/:]/.test(l) && /^[A-Za-z][A-Za-z .'-]+$/.test(l) && !headingOf(l)) return l.replace(/\s+/g, " ");
  }
  return "Candidate";
}

/* ------------------------------------------------------------------ */
/* Twin construction                                                   */
/* ------------------------------------------------------------------ */

const LEVELS = [
  { min: 0, label: "Foundation-stage" },
  { min: 40, label: "Project-ready" },
  { min: 58, label: "Internship-ready" },
  { min: 75, label: "Interview-ready" },
];

const PERSONA: Record<string, string> = {
  Languages: "Polyglot Programmer",
  Frontend: "Product-minded UI Builder",
  Backend: "Backend Systems Builder",
  Databases: "Data-layer Engineer",
  "Cloud & DevOps": "Automation-first DevOps Learner",
  "AI/ML": "AI/ML Explorer",
  Data: "Data Storyteller",
  "CS Fundamentals": "Algorithmic Problem Solver",
};

export function roleFitScore(skills: TwinSkill[], role: RoleDef, extra: Record<string, number> = {}): number {
  const by = new Map(skills.map((s) => [s.name, s]));
  let num = 0;
  let den = 0;
  for (const [name, w0] of Object.entries({ ...role.skills, ...extra })) {
    const w = w0 as number;
    den += w;
    const s = by.get(name);
    if (s) num += w * Math.min(1, s.strength / 70);
  }
  return den ? Math.round((100 * num) / den) : 0;
}

export function statusOf(s?: TwinSkill): SkillStatus {
  if (!s) return "missing";
  return s.evidence.some((e) => e !== "listed" && e !== "implied") ? "evidenced" : "listed";
}

export function buildTwin(inp: TwinInputs, github?: GithubSummary, prev?: Twin | null): Twin {
  const resume = inp.resumeText || "";
  const sec = parseSections(resume);
  const join = (a: string[]) => a.join("\n");

  const sources: [Evidence, string][] = [
    ["experience", join(sec.experience)],
    ["project", join(sec.projects) + "\n" + inp.projectsText],
    ["certification", join(sec.certifications) + "\n" + inp.certificationsText],
    ["listed", [join(sec.skills), join(sec.summary), join(sec.achievements), join(sec.other), join(sec.education), inp.skillsText, inp.linkedinText].join("\n")],
  ];
  if (github) sources.push(["github", github.skills.join(", ")]);

  const map = new Map<string, TwinSkill>();
  for (const [ev, text] of sources) {
    for (const [name, count] of detectSkills(text)) {
      const def = SKILL_BY_NAME.get(name)!;
      const s = map.get(name) ?? { name, category: def.cat, strength: 0, evidence: [], mentions: 0 };
      if (!s.evidence.includes(ev)) s.evidence.push(ev);
      s.mentions += count;
      map.set(name, s);
    }
  }
  const projectMentions = (name: string) => [...sec.projects, inp.projectsText].join("\n").toLowerCase().split(name.toLowerCase()).length - 1;
  for (const s of map.values()) {
    const e = s.evidence;
    s.strength = Math.min(
      95,
      30 +
        (e.includes("project") ? 25 : 0) +
        (projectMentions(s.name) > 1 ? 8 : 0) +
        (e.includes("experience") ? 22 : 0) +
        (e.includes("github") ? 14 : 0) +
        (e.includes("certification") ? 10 : 0) +
        Math.min(10, s.mentions * 2),
    );
  }
  for (const s of [...map.values()]) {
    for (const parent of IMPLIES[s.name] ?? []) {
      const p = map.get(parent);
      if (p) {
        const gained = s.evidence.filter((e) => e !== "listed" && e !== "implied" && !p.evidence.includes(e));
        p.evidence.push(...gained);
        p.strength = Math.min(95, p.strength + (gained.length ? 12 : 4));
      } else {
        const def = SKILL_BY_NAME.get(parent);
        if (def) map.set(parent, { name: parent, category: def.cat, strength: Math.round(s.strength * 0.75), evidence: [...new Set<Evidence>([...s.evidence, "implied"])], mentions: 0 });
      }
    }
  }
  // Interview performance carried over from the previous twin keeps the profile evolving.
  if (prev) {
    for (const old of prev.technical) {
      const cur = map.get(old.name);
      if (cur && old.evidence.includes("listed") && old.strength > cur.strength && prev.history.some((h) => h.note.startsWith("Interview"))) {
        cur.strength = old.strength;
      }
    }
  }
  const technical = [...map.values()].filter((s) => s.category !== "Tools" || s.name === "Git").sort((a, b) => b.strength - a.strength);

  const allText = [resume, inp.linkedinText, inp.projectsText].join("\n");
  const soft = SOFT_SKILLS.filter((s) => s.cues.test(allText)).map((s) => s.name);

  const projects = toProjects([...sec.projects, ...inp.projectsText.split("\n")], "resume");
  if (github) {
    for (const r of github.topRepos.slice(0, 4)) {
      if (projects.some((p) => p.title.toLowerCase().replace(/\W/g, "").includes(r.name.toLowerCase().replace(/\W/g, "").slice(0, 8)))) continue;
      projects.push({
        title: r.name,
        tech: [...new Set([...(r.language ? [r.language] : []), ...detectSkills(`${r.description} ${r.topics.join(" ")}`).keys()])],
        bullets: r.description ? [`${r.description}${r.stars ? ` (★ ${r.stars})` : ""}`] : [],
        source: "github",
        url: r.url,
      });
    }
  }
  const experience: TwinExperience[] = groupEntries(sec.experience);
  const education = groupEntries(sec.education).map((e) => [e.title, ...e.bullets].join(" · ")).slice(0, 3);
  const certifications = [...groupEntries(sec.certifications).map((e) => e.title), ...inp.certificationsText.split(/\n|,/).map((s) => s.trim()).filter(Boolean)].slice(0, 8);

  const bullets = [...projects.filter((p) => p.source !== "github").flatMap((p) => p.bullets), ...experience.flatMap((e) => e.bullets)];
  const metricsRatio = bullets.length ? bullets.filter(hasMetric).length / bullets.length : 0;

  const roleFit = ROLES.map((r) => ({ id: r.id, title: r.title, score: roleFitScore(technical, r) })).sort((a, b) => b.score - a.score);
  const targetRole = inp.targetRole || roleFit[0].id;
  const target = ROLE_BY_ID.get(targetRole) ?? ROLES[0];
  const readiness = roleFitScore(technical, target);

  const categoryScores: Record<string, number> = {};
  for (const c of CATEGORIES) {
    const top = technical.filter((s) => s.category === c).slice(0, 3);
    categoryScores[c] = top.length ? Math.round((top.reduce((a, s) => a + s.strength, 0) / top.length) * (0.55 + 0.15 * top.length)) : 0;
  }
  const rankedCats = Object.entries(categoryScores).sort((a, b) => b[1] - a[1]);
  const level = [...LEVELS].reverse().find((l) => readiness + (experience.length ? 6 : 0) >= l.min)!.label;
  const archetype = `${level} ${PERSONA[rankedCats[0][0]] ?? "Generalist"}`;

  const evidenced = technical.filter((s) => statusOf(s) === "evidenced");
  const strengths: string[] = [];
  if (evidenced.length) strengths.push(`Proven hands-on skills: ${evidenced.slice(0, 4).map((s) => s.name).join(", ")}`);
  if (projects.length >= 2) strengths.push(`Builder mindset — ${projects.length} projects in your portfolio`);
  if (metricsRatio >= 0.4) strengths.push("Quantifies impact with real numbers");
  if (experience.length) strengths.push(`Real-world experience (${experience.length} role${experience.length > 1 ? "s" : ""})`);
  if (github && github.publicRepos >= 5) strengths.push(`Active GitHub: ${github.publicRepos} repos across ${github.topLanguages.length} languages`);
  if (soft.length >= 2) strengths.push(`Soft skills evidenced: ${soft.slice(0, 3).join(", ")}`);

  const by = new Map(technical.map((s) => [s.name, s]));
  const missingCore = Object.entries(target.skills).filter(([n, w]) => w >= 2 && statusOf(by.get(n)) === "missing").map(([n]) => n);
  const listedCore = Object.entries(target.skills).filter(([n, w]) => w >= 2 && statusOf(by.get(n)) === "listed").map(([n]) => n);
  const weakAreas: string[] = [];
  if (missingCore.length) weakAreas.push(`Missing for ${target.title}: ${missingCore.slice(0, 4).join(", ")}`);
  if (listedCore.length) weakAreas.push(`Claimed but not proven in projects: ${listedCore.slice(0, 3).join(", ")}`);
  if (metricsRatio < 0.3) weakAreas.push("Few quantified achievements — bullets lack numbers");
  if (!technical.some((s) => s.category === "Cloud & DevOps")) weakAreas.push("No deployment / cloud exposure yet");
  if (!experience.length) weakAreas.push("No internship or work experience listed");
  if (!by.has("DSA")) weakAreas.push("No visible DSA / problem-solving evidence");

  const name = guessName(resume) !== "Candidate" ? guessName(resume) : github?.name || "Candidate";
  const headline = `${evidenced.slice(0, 3).map((s) => s.name).join(" · ") || "Aspiring engineer"} | Target: ${target.title}`;
  const summary = `${name.split(" ")[0]} is a ${archetype.toLowerCase()} whose strongest area is ${rankedCats[0][0]}${rankedCats[1][1] ? ` with supporting depth in ${rankedCats[1][0]}` : ""}. Current best-fit role is ${roleFit[0].title} (${roleFit[0].score}% fit); readiness for ${target.title} is ${readiness}%.`;

  const history = [...(prev?.history ?? [])];
  history.push({ at: new Date().toISOString(), readiness, note: prev ? "Profile updated" : "Twin created" });

  return {
    name,
    headline,
    summary,
    archetype,
    level,
    contact: extractContact(resume + "\n" + inp.linkedinText),
    technical,
    soft,
    projects,
    experience,
    education,
    certifications,
    strengths,
    weakAreas,
    targetRole,
    roleFit,
    categoryScores,
    metricsRatio,
    github,
    history: history.slice(-20),
    aiEnhanced: false,
    rawText: resume,
  };
}

export const readinessOf = (twin: Twin) => roleFitScore(twin.technical, ROLE_BY_ID.get(twin.targetRole) ?? ROLES[0]);

/* ------------------------------------------------------------------ */
/* JD Gap detector + 30-day plan                                       */
/* ------------------------------------------------------------------ */

export function analyzeJD(jd: string) {
  const role = detectRole(jd);
  const company = detectCompany(jd);
  const weights = new Map<string, number>();
  if (jd.trim().length < 250) {
    for (const [n, w] of Object.entries(role.skills)) weights.set(n, w);
  } else {
    const split = jd.search(/preferred|nice to have|good to have|bonus|plus points|desirable/i);
    const must = split > 0 ? jd.slice(0, split) : jd;
    const nice = split > 0 ? jd.slice(split) : "";
    for (const [n, c] of detectSkills(must)) weights.set(n, Math.max(role.skills[n] ?? 2, c > 1 ? 3 : 2));
    for (const [n] of detectSkills(nice)) if (!weights.has(n)) weights.set(n, 1);
  }
  for (const e of company?.emphasis ?? []) weights.set(e, 3);
  // "Python, Java or C++" — any one of the listed alternatives satisfies the requirement.
  const alternatives: string[][] = [];
  for (const line of jd.split(/\n|\.\s/)) {
    if (!/\bor\b|one or more|any of|such as|e\.g\./i.test(line)) continue;
    const langs = [...detectSkills(line).keys()].filter((n) => SKILL_BY_NAME.get(n)?.cat === "Languages");
    if (langs.length >= 2) alternatives.push(langs);
  }
  return { role, company, weights, alternatives };
}

export function gapReport(twin: Twin, jd: string): GapReport {
  const { role, company, weights, alternatives } = analyzeJD(jd);
  const by = new Map(twin.technical.map((s) => [s.name, s]));
  for (const group of alternatives) {
    if (group.some((n) => statusOf(by.get(n)) !== "missing")) for (const n of group) if (!by.has(n)) weights.delete(n);
  }
  const items: GapItem[] = [...weights.entries()]
    .map(([name, weight]) => {
      const s = by.get(name);
      return { name, weight, status: statusOf(s), strength: s?.strength ?? 0 };
    })
    .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
  let num = 0;
  let den = 0;
  for (const i of items) {
    den += i.weight;
    num += i.weight * Math.min(1, i.strength / 70);
  }
  const score = den ? Math.round((100 * num) / den) : 0;
  const plan = buildPlan(twin, items);
  const verdict =
    score >= 75 ? "Strong match — focus on interview prep and polishing proof." : score >= 55 ? "Competitive with focused effort — close the core gaps below." : "Stretch role — follow the plan, then re-check in 30 days.";
  return { roleId: role.id, roleTitle: role.title, company: company?.name, score, items, plan, verdict };
}

export function buildPlan(twin: Twin, items: GapItem[]): PlanWeek[] {
  const missing = items.filter((i) => i.status === "missing").sort((a, b) => b.weight - a.weight).map((i) => i.name);
  const listed = items.filter((i) => i.status === "listed").sort((a, b) => b.weight - a.weight).map((i) => i.name);
  const focus = [...missing, ...listed];
  const best = twin.projects.find((p) => p.source !== "github")?.title ?? twin.projects[0]?.title ?? "your best project";
  const [a, b, c] = [focus[0] ?? "System Design", focus[1] ?? focus[0] ?? "Testing", focus[2] ?? focus[1] ?? "CI/CD"];
  const ga = guideFor(a);
  const gb = guideFor(b);
  const gc = guideFor(c);
  return [
    {
      week: 1,
      focus: `${a} fundamentals`,
      goal: `Understand ${a} well enough to explain it in an interview.`,
      tasks: [...ga.learn, `Write a 5-line "explain like I'm new" note on ${a}`],
      deliverable: `Notes + a tiny hello-world using ${a}`,
      resource: ga.resource,
    },
    {
      week: 2,
      focus: `Apply ${a} to "${best}"`,
      goal: "Turn learning into evidence on a project you already own.",
      tasks: [ga.apply(best), ...gb.learn.slice(0, 2).map((t) => `${b}: ${t}`), "Document what you changed and why in the README"],
      deliverable: `"${best}" upgraded with ${a}`,
      resource: gb.resource,
    },
    {
      week: 3,
      focus: `Build: ${b}${c !== b ? ` + ${c}` : ""} project`,
      goal: "Create a fresh, interview-worthy project combining the remaining gaps.",
      tasks: [gb.build, gc.apply(best), "Measure something real (latency, users, dataset size, accuracy)"],
      deliverable: "Deployed project with a public link and metrics",
      resource: gc.resource,
    },
    {
      week: 4,
      focus: "Add to resume & prove it",
      goal: "Convert the new work into credible resume bullets and interview stories.",
      tasks: [
        "Write 2 bullets per project: action + tech + measurable result",
        "Run the Truth Checker on the new bullets",
        `Do an adaptive mock interview on ${a} and ${b}`,
        "Re-run this gap analysis to measure your improvement",
      ],
      deliverable: "Updated resume + interview-ready STAR stories",
    },
  ];
}

/* ------------------------------------------------------------------ */
/* ATS simulator                                                       */
/* ------------------------------------------------------------------ */

export function atsSimulate(twin: Twin) {
  const by = new Map(twin.technical.map((s) => [s.name, s]));
  const rows = ROLES.map((r) => {
    const entries = Object.entries(r.skills).map(([name, w]) => ({ name, w, status: statusOf(by.get(name)) }));
    return {
      id: r.id,
      title: r.title,
      score: roleFitScore(twin.technical, r),
      evidenced: entries.filter((e) => e.status === "evidenced").map((e) => e.name),
      listedOnly: entries.filter((e) => e.status === "listed").map((e) => e.name),
      missing: entries.filter((e) => e.status === "missing").sort((a, b) => b.w - a.w).map((e) => e.name),
    };
  }).sort((a, b) => b.score - a.score);

  const text = twin.rawText;
  const words = text.split(/\s+/).filter(Boolean).length;
  const bullets = [...twin.projects.filter((p) => p.source !== "github").flatMap((p) => p.bullets), ...twin.experience.flatMap((e) => e.bullets)];
  const actionVerb = /^(built|developed|designed|implemented|led|created|engineered|optimi[sz]ed|reduced|increased|launched|deployed|automated|architected|analy[sz]ed|improved|integrated|trained|migrated|delivered|mentored|organi[sz]ed)/i;
  const sec = parseSections(text);
  const checks = [
    { label: "Email detected", ok: !!twin.contact.email, tip: "ATS needs a parseable email in plain text." },
    { label: "Phone detected", ok: !!twin.contact.phone, tip: "Add a phone number in plain text (no icons only)." },
    { label: "LinkedIn / GitHub links", ok: !!(twin.contact.linkedin || twin.contact.github || twin.github), tip: "Add linkedin.com/in/... and github.com/... as text." },
    { label: "Standard section headings", ok: ["education", "projects", "skills"].every((s) => sec[s as keyof typeof sec].length > 0), tip: "Use standard headings: Education, Experience, Projects, Skills." },
    { label: "Length 300–900 words", ok: words >= 300 && words <= 900, tip: `Currently ${words} words. One page ≈ 400–700 words for students.` },
    { label: "Bullets start with action verbs", ok: bullets.length > 0 && bullets.filter((b) => actionVerb.test(b)).length / bullets.length >= 0.6, tip: "Start bullets with Built / Designed / Reduced / Led…" },
    { label: "≥40% bullets quantified", ok: twin.metricsRatio >= 0.4, tip: `Only ${Math.round(twin.metricsRatio * 100)}% of bullets contain numbers.` },
    { label: "No first-person pronouns", ok: !/\b(I|my|me)\b/.test(sec.projects.join(" ") + sec.experience.join(" ")), tip: "Drop “I / my” from bullets — keep them crisp." },
  ];
  const formatScore = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  return { rows, checks, formatScore, words };
}

/* ------------------------------------------------------------------ */
/* Truth checker                                                       */
/* ------------------------------------------------------------------ */

const HYPE: { re: RegExp; label: string; questions: string[] }[] = [
  { re: /\b(highly )?scalable|large[- ]scale|at scale\b/i, label: "Scalability claim", questions: ["How many users / requests / records does it handle?", "Which architecture choice makes it scale (caching, queues, sharding, load balancing)?"] },
  { re: /\b(advanced|sophisticated|cutting[- ]edge|state[- ]of[- ]the[- ]art|innovative|revolutionary|novel|next[- ]gen)\b/i, label: "Sophistication claim", questions: ["What specifically is advanced — which algorithm or model?", "Compared to what baseline?"] },
  { re: /\b(efficient|optimi[sz]ed|fast|high[- ]performance|blazing|real[- ]time|lightning)\b/i, label: "Performance claim", questions: ["What was the before → after metric (latency, runtime, memory)?"] },
  { re: /\b(robust|reliable|secure|production[- ]grade|enterprise|industry[- ]level|fault[- ]tolerant)\b/i, label: "Reliability claim", questions: ["How was it tested? Test coverage, error handling, uptime?"] },
  { re: /\b(seamless|user[- ]friendly|intuitive|beautiful|modern)\b/i, label: "UX claim", questions: ["How many people used it? Any feedback or rating?"] },
  { re: /\b(significantly|drastically|greatly|massively|substantially)\b/i, label: "Vague impact", questions: ["By how much exactly? Give a number or percentage."] },
  { re: /\b(expert|mastery|proficient|extensive|deep expertise|guru|ninja)\b/i, label: "Expertise claim", questions: ["What evidence shows this level — years, projects, certifications?"] },
  { re: /\b(ai[- ]powered|ai[- ]based|ml[- ]based|intelligent|smart)\b/i, label: "AI claim", questions: ["Which model / technique, and what dataset size?", "What accuracy or evaluation metric did you get?"] },
];

export interface ClaimCheck {
  text: string;
  context: string;
  flags: string[];
  questions: string[];
  hasMetric: boolean;
  tech: string[];
  credibility: number;
}

export function analyzeClaims(twin: Twin): ClaimCheck[] {
  const pool: { text: string; context: string }[] = [
    ...twin.projects.filter((p) => p.source !== "github").flatMap((p) => p.bullets.map((b) => ({ text: b, context: p.title }))),
    ...twin.experience.flatMap((e) => e.bullets.map((b) => ({ text: b, context: e.title }))),
  ];
  if (!pool.length) {
    for (const l of twin.rawText.split("\n")) if (l.trim().length > 50) pool.push({ text: l.trim().replace(BULLET, ""), context: "Resume" });
  }
  return pool
    .map(({ text, context }) => {
      const hits = HYPE.filter((h) => h.re.test(text));
      const metric = hasMetric(text);
      const tech = [...detectSkills(text).keys()];
      const questions = hits.flatMap((h) => h.questions);
      if (!metric) questions.push("What measurable result came out of this?");
      if (!tech.length) questions.push("Which technologies / tools did you use?");
      const credibility = Math.max(5, Math.min(100, 70 - hits.length * 18 + (metric ? 25 : -10) + Math.min(15, tech.length * 5)));
      return { text, context, flags: hits.map((h) => h.label), questions: [...new Set(questions)].slice(0, 4), hasMetric: metric, tech, credibility };
    })
    .sort((a, b) => a.credibility - b.credibility);
}

const HYPE_WORDS = /\b(highly|very|extremely|advanced|sophisticated|cutting[- ]edge|state[- ]of[- ]the[- ]art|innovative|revolutionary|robust|seamless|seamlessly|blazing[- ]fast|significantly|drastically|greatly|massively|world[- ]class|next[- ]gen)\s*/gi;

export interface EvidenceInput {
  dataset?: string;
  users?: string;
  architecture?: string;
  performance?: string;
  technologies?: string;
}

export function rewriteClaim(text: string, ev: EvidenceInput): string {
  let core = text.replace(HYPE_WORDS, "");
  if (!ev.users && !ev.architecture) core = core.replace(/\b(scalable|large[- ]scale)\s*/gi, "");
  if (!ev.performance) core = core.replace(/\b(efficient|high[- ]performance|optimi[sz]ed)\s*/gi, "");
  core = core.replace(/\s{2,}/g, " ").replace(/\b(a|an) (?=[aeiou])/gi, "an ").replace(/\ban (?=[^aeiou\s])/gi, "a ").replace(/[.\s]+$/, "").trim();
  core = core.charAt(0).toUpperCase() + core.slice(1);
  const parts: string[] = [core];
  if (ev.technologies) parts.push(`using ${ev.technologies}`);
  if (ev.dataset) parts.push(`on a ${ev.dataset} dataset`);
  let out = parts.join(" ");
  if (ev.architecture) out += `; ${ev.architecture.replace(/^\w/, (c) => c.toLowerCase())}`;
  if (ev.users) out += `, serving ${ev.users}`;
  if (ev.performance) out += ` — ${ev.performance}`;
  return out + ".";
}

/* ------------------------------------------------------------------ */
/* Pitch generator (template fallback)                                 */
/* ------------------------------------------------------------------ */

export interface PitchInput {
  company: string;
  role: string;
  jd?: string;
  interviewStrengths?: string[];
}

export function templatePitch(twin: Twin, p: PitchInput): string {
  const company = detectCompany(p.company) ?? detectCompany(p.jd ?? "");
  const role = detectRole(`${p.role} ${p.jd ?? ""}`);
  const by = new Map(twin.technical.map((s) => [s.name, s]));
  const relevant = Object.keys(role.skills).filter((n) => statusOf(by.get(n)) === "evidenced").slice(0, 3);
  const skills = relevant.length ? relevant : twin.technical.slice(0, 3).map((s) => s.name);
  const hype = (b: string) => HYPE.filter((h) => h.re.test(b)).length;
  const candidates = [
    ...twin.projects.flatMap((pr) => pr.bullets.map((b) => ({ title: pr.title, b, work: false }))),
    ...twin.experience.flatMap((e) => e.bullets.map((b) => ({ title: e.title.split(/[,·]/)[0].trim(), b, work: true }))),
  ].sort((x, y) => Number(hasMetric(y.b)) - Number(hasMetric(x.b)) || hype(x.b) - hype(y.b));
  const best = candidates[0];
  const lead = best ? (best.work ? `As a ${best.title}, I` : `While building ${best.title}, I`) : "";
  const projLine = best ? best.b.replace(HYPE_WORDS, "") : "";
  const edu = twin.education[0]?.match(/b\.?\s?tech|b\.?e\.?|bsc|bca|mca|m\.?tech|computer science|cse|it\b/i) ? "a computer science student" : "an engineer in the making";
  const angle: Record<string, string> = {
    google: "I'd love to bring that problem-solving mindset to products used at Google's scale.",
    microsoft: "I'm excited by Microsoft's growth-mindset culture and want to keep learning while building reliable cloud software.",
    amazon: "I take ownership end-to-end and obsess over the user — which is why Amazon's backend work excites me.",
    meta: "I like moving fast and shipping, and I want to build product experiences at Meta's scale.",
    startup: "I'm comfortable owning features end-to-end, from UI to deployment — exactly what a fast-moving startup needs.",
    services: "I adapt quickly across stacks and communicate clearly with stakeholders, which fits client-focused delivery.",
  };
  const close = company ? angle[company.key] : `I'm excited to contribute to ${p.company || "your team"} as a ${p.role || role.title} and keep growing fast.`;
  const interview = p.interviewStrengths?.length ? ` In mock technical rounds, my strongest area was ${p.interviewStrengths.slice(0, 2).join(" and ")}.` : "";
  const lower = projLine.replace(/^\w/, (c) => c.toLowerCase()).replace(/\.$/, "");
  return `I'm ${twin.name.split(" ")[0]}, ${edu} focused on ${role.title.toLowerCase()} work, with hands-on experience in ${skills.join(", ")}. ${best ? `${lead} ${lower}.` : ""}${interview} My strength is turning ideas into working, measurable software rather than just prototypes. ${close}`.replace(/\s+/g, " ").trim();
}

/* ------------------------------------------------------------------ */
/* Ask-your-twin (offline intent answers)                              */
/* ------------------------------------------------------------------ */

export function offlineAnswer(twin: Twin, q: string): string {
  const lower = q.toLowerCase();
  const roleAsked = ROLES.find((r) => r.match.test(q) || lower.includes(r.title.toLowerCase()));
  if (roleAsked && /(missing|lack|need|gap|learn|become|ready)/.test(lower)) {
    const by = new Map(twin.technical.map((s) => [s.name, s]));
    const entries = Object.entries(roleAsked.skills).sort((a, b) => b[1] - a[1]);
    const missing = entries.filter(([n]) => statusOf(by.get(n)) === "missing").map(([n]) => n);
    const listed = entries.filter(([n]) => statusOf(by.get(n)) === "listed").map(([n]) => n);
    const fit = roleFitScore(twin.technical, roleAsked);
    return `For **${roleAsked.title}** you're currently at **${fit}% fit**.\n\n**Missing:** ${missing.join(", ") || "nothing critical 🎉"}\n\n**Claimed but unproven:** ${listed.join(", ") || "none"}\n\nStart with **${missing[0] ?? listed[0] ?? "a capstone project"}** — the Gap Detector can turn this into a 30-day plan.`;
  }
  if (/(role|job|suit|fit|position)/.test(lower)) {
    return `Your best-fit roles right now:\n\n${twin.roleFit.slice(0, 3).map((r, i) => `${i + 1}. **${r.title}** — ${r.score}% fit`).join("\n")}\n\nThis is based on skills you've *proven* in projects/experience (weighted higher) vs. skills only listed.`;
  }
  if (/(strength|good at|best at)/.test(lower)) return `**Your strengths:**\n\n${twin.strengths.map((s) => `- ${s}`).join("\n")}`;
  if (/(weak|improve|lacking|bad at)/.test(lower)) return `**Areas to improve:**\n\n${twin.weakAreas.map((s) => `- ${s}`).join("\n")}`;
  if (/(project)/.test(lower)) return `**Your projects:**\n\n${twin.projects.map((p) => `- **${p.title}** (${p.tech.slice(0, 4).join(", ") || "tech not stated"})`).join("\n")}`;
  return `**You are currently a ${twin.archetype}.**\n\n${twin.summary}\n\nTop proven skills: ${twin.technical.filter((s) => statusOf(s) === "evidenced").slice(0, 5).map((s) => s.name).join(", ") || "none yet"}.`;
}

/* ------------------------------------------------------------------ */
/* Roadmap                                                             */
/* ------------------------------------------------------------------ */

export type RoadStatus = "learned" | "learning" | "missing";

export function roadmapFor(twin: Twin, roleId: string, overrides: Record<string, RoadStatus> = {}) {
  const role = ROLE_BY_ID.get(roleId) ?? ROLES[0];
  const by = new Map(twin.technical.map((s) => [s.name, s]));
  const pillars = role.pillars.map((p) => ({
    name: p.name,
    skills: p.skills.map((name) => {
      const s = by.get(name);
      const auto: RoadStatus = !s ? "missing" : statusOf(s) === "evidenced" && s.strength >= 55 ? "learned" : "learning";
      return { name, status: overrides[name] ?? auto, auto };
    }),
  }));
  const all = pillars.flatMap((p) => p.skills);
  const progress = Math.round(((all.filter((s) => s.status === "learned").length + 0.5 * all.filter((s) => s.status === "learning").length) / all.length) * 100);
  return { role, pillars, progress, next: all.filter((s) => s.status === "missing").slice(0, 3).map((s) => s.name) };
}
