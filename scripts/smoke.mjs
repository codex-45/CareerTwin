// End-to-end smoke test against a running server: `node scripts/smoke.mjs [baseUrl]`
const BASE = process.argv[2] ?? "http://localhost:3000";
const { readFileSync } = await import("node:fs");
const SAMPLE = readFileSync(new URL("../src/lib/sample.ts", import.meta.url), "utf8").match(/SAMPLE_RESUME = `([\s\S]*?)`;/)[1];

const post = async (path, body) => {
  const r = await fetch(BASE + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(`${path} ${r.status} ${JSON.stringify(j)}`);
  return j;
};

console.log("status", await (await fetch(BASE + "/api/status")).json());

const inputs = { resumeText: SAMPLE, linkedinText: "Skills: Public Speaking, Leadership", projectsText: "", certificationsText: "", skillsText: "", githubUser: "", targetRole: "ai-engineer" };
const twin = await post("/api/twin", { inputs, prev: null });
console.log("\nTWIN", twin.name, "|", twin.archetype, "| level:", twin.level);
console.log("skills:", twin.technical.map((s) => `${s.name}:${s.strength}[${s.evidence.join("/")}]`).join(", "));
console.log("soft:", twin.soft.join(", "));
console.log("projects:", twin.projects.map((p) => `${p.title} (${p.bullets.length} bullets)`).join(" | "));
console.log("experience:", twin.experience.map((e) => `${e.title} (${e.bullets.length})`).join(" | "));
console.log("education:", twin.education);
console.log("certs:", twin.certifications);
console.log("roleFit:", twin.roleFit.map((r) => `${r.title}:${r.score}`).join(", "));
console.log("strengths:", twin.strengths);
console.log("weak:", twin.weakAreas);

const ask = await post("/api/ask", { twin, question: "What skills am I missing for an AI Engineer role?" });
console.log("\nASK", ask.source, ask.answer);

const gap = await post("/api/gap", { twin, jd: "Software Engineer – Google" });
console.log("\nGAP", gap.roleTitle, gap.company, gap.score, gap.items.map((i) => `${i.status === "evidenced" ? "✓" : i.status === "listed" ? "~" : "✗"}${i.name}`).join(" "));
console.log(gap.plan.map((w) => `W${w.week}: ${w.focus}`).join("\n"));

const q = (await post("/api/interview", { action: "question", topic: "Java & OOP", level: "easy", kind: "core", asked: [] })).question;
console.log("\nQ (ai question):", q?.q ?? "(none — engine bank used client-side)");
const bankQ = { topic: "Java & OOP", level: "easy", kind: "core", q: "What is inheritance in Java?", keys: [["extends", "subclass"], ["parent", "superclass"], ["reuse", "reusability"], ["is-a", "is a"]], ideal: "" };
const ev = await post("/api/interview", { action: "evaluate", question: bankQ, answer: "Inheritance is when a subclass extends a parent superclass so it can reuse code. It models an is-a relationship, for example a Car is a Vehicle." });
console.log("EVAL", ev.source, ev.evaluation);

const pitch = await post("/api/pitch", { twin, input: { company: "Amazon", role: "Backend Engineer" } });
console.log("\nPITCH", pitch.source, pitch.pitch);

const rw = await post("/api/rewrite", { text: "Developed a highly scalable AI recommendation engine", evidence: { dataset: "170K+ song", technologies: "Python, Scikit-learn", performance: "recommendations in under 200 ms" } });
console.log("\nREWRITE", rw.source, rw.rewrite);
