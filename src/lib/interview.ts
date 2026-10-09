import type { Evaluation, InterviewQuestion, InterviewTurn, Level } from "./types";

export const LEVELS: Level[] = ["easy", "medium", "hard", "scenario"];

type Q = { q: string; keys: string[][]; ideal: string };
type Bank = Record<string, { skills: string[]; levels: Record<Level, Q> }>;

const k = (...groups: string[]) => groups.map((g) => g.split("|"));

export const BANK: Bank = {
  "Java & OOP": {
    skills: ["Java", "OOP", "Spring Boot"],
    levels: {
      easy: { q: "What is inheritance in Java, and why is it useful?", keys: k("extends|subclass|child class", "parent|superclass|base class", "reuse|reusability", "is-a|is a"), ideal: "Inheritance lets a subclass (extends) acquire fields/methods of a superclass, modelling an IS-A relationship and enabling code reuse and polymorphism." },
      medium: { q: "How would you use inheritance vs composition when designing a payment module that supports UPI, cards and wallets?", keys: k("interface|abstract", "composition|has-a|has a", "polymorphism|override", "open closed|open/closed|extensible|extend without"), ideal: "Define a PaymentMethod interface; each method implements it. Prefer composition for shared behaviour (e.g. a FraudChecker) to avoid deep hierarchies; open/closed lets you add new methods without changing callers." },
      hard: { q: "What problems does deep inheritance cause in a large codebase, and how do SOLID principles help?", keys: k("fragile base|tight coupling|coupling", "liskov|lsp|substitut", "single responsibility|srp", "dependency inversion|dip|inject"), ideal: "Deep hierarchies cause fragile base classes and tight coupling. LSP keeps subclasses substitutable, SRP keeps classes focused, DIP + dependency injection decouple high-level logic from implementations." },
      scenario: { q: "Your team's `Vehicle` base class now has 40 subclasses and every change breaks something. Walk me through how you'd refactor it safely.", keys: k("test|tests|regression", "interface|strategy|composition", "incremental|step by step|gradually", "deprecat|feature flag|backward"), ideal: "Add characterization tests first, extract behaviours into interfaces/strategies (composition), migrate subclasses incrementally, keep backward compatibility via adapters/deprecation." },
    },
  },
  "DSA": {
    skills: ["DSA", "C++", "Java", "Python"],
    levels: {
      easy: { q: "What's the difference between an array and a linked list? When would you choose each?", keys: k("contiguous|index", "o\\(1\\)|constant", "insert|delete", "pointer|node|next"), ideal: "Arrays are contiguous with O(1) random access but costly inserts; linked lists use nodes with pointers giving O(1) insert/delete at known positions but O(n) access." },
      medium: { q: "How would you detect a cycle in a linked list? What's the time and space complexity?", keys: k("floyd|tortoise|slow|fast", "two pointer|pointers", "o\\(n\\)", "o\\(1\\)|constant space|hash ?set"), ideal: "Floyd's tortoise-and-hare: slow moves 1, fast moves 2; if they meet there's a cycle. O(n) time, O(1) space (vs a hash set with O(n) space)." },
      hard: { q: "Design an LRU cache with O(1) get and put. Which data structures do you need?", keys: k("hash ?map|dictionary", "doubly linked|linked list", "evict|least recently", "o\\(1\\)"), ideal: "HashMap from key to node + doubly linked list ordered by recency. Get moves node to head; put inserts at head and evicts tail when full — all O(1)." },
      scenario: { q: "A search-autocomplete feature is slow for 1M product names. How would you make suggestions return in under 50 ms?", keys: k("trie|prefix", "cache|precompute|top ?k", "heap|rank|frequency", "index|memory|shard"), ideal: "Build a trie with top-K suggestions cached at each node (ranked by frequency), keep it in memory, cache hot prefixes, and shard by prefix if needed." },
    },
  },
  "DBMS & SQL": {
    skills: ["SQL", "MySQL", "PostgreSQL", "DBMS", "MongoDB"],
    levels: {
      easy: { q: "What is a primary key versus a foreign key?", keys: k("unique|uniquely", "not null|null", "reference|references|another table", "relationship|integrity"), ideal: "A primary key uniquely identifies each row (unique, not null). A foreign key references a primary key in another table, enforcing referential integrity." },
      medium: { q: "What are indexes? When can an index actually hurt performance?", keys: k("b-?tree|lookup|faster read|search", "write|insert|update", "storage|space", "low cardinality|selectiv"), ideal: "Indexes (usually B-trees) speed up reads, but slow writes (every insert/update maintains them), consume storage, and help little on low-cardinality columns." },
      hard: { q: "Explain transaction isolation levels and the anomalies each one prevents.", keys: k("dirty read", "non-repeatable|repeatable read", "phantom", "serializ"), ideal: "Read uncommitted < read committed (no dirty reads) < repeatable read (no non-repeatable reads) < serializable (no phantoms). Higher isolation = more locking/less concurrency." },
      scenario: { q: "A dashboard query that joins orders and users now takes 12 seconds. How do you debug and fix it?", keys: k("explain|query plan", "index", "n\\+1|join|denormal", "cache|materiali[sz]ed|pagination"), ideal: "Run EXPLAIN/ANALYZE, add indexes on join/filter columns, avoid SELECT *, paginate, and consider materialized views or caching for heavy aggregates." },
    },
  },
  "JavaScript & React": {
    skills: ["JavaScript", "React", "TypeScript", "Next.js", "Node.js"],
    levels: {
      easy: { q: "What is the difference between `let`, `const` and `var`?", keys: k("block scope|block-scoped", "function scope|function-scoped", "hoist", "reassign|re-assign"), ideal: "var is function-scoped and hoisted (undefined); let/const are block-scoped with a temporal dead zone; const can't be reassigned (but objects stay mutable)." },
      medium: { q: "How does `useEffect` work in React, and what is the dependency array for?", keys: k("side effect|side-effect", "dependency|dependencies", "cleanup|return function|unmount", "re-?render|run again"), ideal: "useEffect runs side effects after render; it re-runs when a dependency changes; an empty array runs once; the returned cleanup runs before re-run/unmount." },
      hard: { q: "Explain the JavaScript event loop — microtasks vs macrotasks.", keys: k("call stack|stack", "microtask|promise", "macrotask|settimeout|task queue", "single[- ]thread"), ideal: "JS is single-threaded; the event loop runs the call stack, then drains all microtasks (promises) before taking the next macrotask (setTimeout, I/O)." },
      scenario: { q: "Your React page re-renders 200 list items on every keystroke and feels laggy. How do you fix it?", keys: k("memo|usememo|usecallback|react\\.memo", "debounce|throttle", "virtuali[sz]|windowing|react-window", "profiler|devtools|measure"), ideal: "Measure with React Profiler, memoize rows (React.memo/useCallback), debounce input, lift state down, and virtualize the list (react-window)." },
    },
  },
  "Python": {
    skills: ["Python", "Django", "Flask", "FastAPI", "Pandas"],
    levels: {
      easy: { q: "What is the difference between a list and a tuple in Python?", keys: k("mutable", "immutable", "hashable|dictionary key", "faster|memory"), ideal: "Lists are mutable, tuples immutable; tuples are hashable (usable as dict keys) and slightly lighter/faster." },
      medium: { q: "What are decorators in Python? Give a practical example.", keys: k("function|wrap|wrapper", "@", "logging|timing|auth|cache", "higher[- ]order|returns a function"), ideal: "A decorator is a higher-order function that wraps another function to add behaviour (e.g. @timer, @login_required, @lru_cache) without changing its code." },
      hard: { q: "What is the GIL and how does it affect multithreading vs multiprocessing?", keys: k("global interpreter lock|gil", "cpu[- ]bound", "i/?o[- ]bound", "multiprocessing|process|asyncio"), ideal: "The GIL allows one thread to execute Python bytecode at a time, so threads help I/O-bound work; CPU-bound work needs multiprocessing (or native extensions)." },
      scenario: { q: "A Python script processing a 5 GB CSV crashes with out-of-memory. How would you fix it?", keys: k("chunk|chunksize|stream|iterator|generator", "dtype|category|downcast", "parquet|database|duckdb|dask|polars", "profile|memory"), ideal: "Stream it in chunks (pandas chunksize / generators), set efficient dtypes, select needed columns, or use Dask/Polars/DuckDB or Parquet." },
    },
  },
  "System Design": {
    skills: ["System Design", "Microservices", "Redis", "AWS", "Docker"],
    levels: {
      easy: { q: "What is a load balancer and why do we need one?", keys: k("distribut|spread", "servers|instances", "availability|failover|health check", "round robin|least connections"), ideal: "A load balancer distributes traffic across multiple servers (round robin, least connections), improving availability via health checks and enabling horizontal scaling." },
      medium: { q: "When would you add a cache, and what problems can caching introduce?", keys: k("read[- ]heavy|latency|hot", "redis|memcached|cdn", "invalidat|stale", "ttl|evict"), ideal: "Cache read-heavy hot data (Redis/CDN) to cut latency; challenges are invalidation/staleness, TTL choice, eviction and cache stampede." },
      hard: { q: "Design a URL shortener handling 100M URLs. Walk through the key components.", keys: k("hash|base62|id generat", "database|key[- ]value|nosql", "cache|redis", "redirect|301|302", "collision|unique"), ideal: "Generate unique IDs (counter + base62 / hash with collision check), store in a key-value DB, cache hot links in Redis, serve 301/302 redirects behind a load balancer, add analytics asynchronously." },
      scenario: { q: "Your college fest ticketing site crashes every time registrations open. How would you redesign it?", keys: k("queue|waiting room|rate limit", "autoscal|horizontal|more instances", "cache|cdn|static", "database|lock|inventory|oversell"), ideal: "Put static pages on a CDN, add a virtual queue/rate limiter, autoscale stateless app servers, handle seat inventory with atomic DB operations or Redis to avoid overselling." },
    },
  },
  "Machine Learning": {
    skills: ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP", "Regression"],
    levels: {
      easy: { q: "What is overfitting, and how can you detect it?", keys: k("training|train", "validation|test", "generali[sz]", "gap|high variance"), ideal: "Overfitting is when a model memorises training data and fails to generalise — detected by low training error but high validation/test error." },
      medium: { q: "How would you handle an imbalanced dataset, e.g. fraud detection with 1% positives?", keys: k("smote|oversampl|undersampl|resampl", "class weight|weighted", "precision|recall|f1|auc", "threshold"), ideal: "Use resampling (SMOTE/undersampling) or class weights, evaluate with precision/recall/F1/PR-AUC instead of accuracy, and tune the decision threshold." },
      hard: { q: "Explain the bias–variance trade-off and how regularisation helps.", keys: k("bias", "variance", "l1|l2|lasso|ridge|dropout", "complex|underfit|overfit"), ideal: "Bias = error from overly simple models (underfit); variance = sensitivity to data (overfit). Regularisation (L1/L2, dropout) penalises complexity to reduce variance." },
      scenario: { q: "Your recommendation model had 92% offline accuracy but users aren't clicking. What would you investigate?", keys: k("offline|online|a/?b test", "metric|ctr|engagement", "data drift|distribution|leakage", "cold start|feedback|bias"), ideal: "Offline metric ≠ business metric: check leakage, data drift, cold start, popularity bias; define CTR/engagement metrics and run A/B tests." },
    },
  },
  "Docker & Cloud": {
    skills: ["Docker", "AWS", "Kubernetes", "CI/CD", "Linux", "Azure", "GCP"],
    levels: {
      easy: { q: "What is the difference between a Docker image and a container?", keys: k("template|blueprint|read-only", "running|instance", "layer", "dockerfile"), ideal: "An image is a read-only layered template built from a Dockerfile; a container is a running instance of that image with its own writable layer." },
      medium: { q: "How would you deploy a web app with a database using Docker?", keys: k("docker-?compose|compose", "volume|persist", "network|service name", "environment|env|secrets"), ideal: "Use docker-compose with app + db services on a shared network, a named volume for DB persistence, and env vars/secrets for config." },
      hard: { q: "What is CI/CD, and what would a good pipeline for a team project include?", keys: k("continuous integration|ci", "test|lint", "build|artifact|image", "deploy|staging|production|rollback"), ideal: "CI runs lint + tests on every push/PR; CD builds artifacts/images and deploys to staging then production automatically, with rollback." },
      scenario: { q: "Your app works on your laptop but crashes in production on AWS. How do you debug it?", keys: k("logs|cloudwatch", "environment|env var|config", "port|security group|network", "reproduce|container|same image"), ideal: "Check logs (CloudWatch), compare env vars/config, verify ports/security groups/IAM, and reproduce with the same container image locally." },
    },
  },
  "Operating Systems": {
    skills: ["Operating Systems", "Linux", "C", "C++"],
    levels: {
      easy: { q: "What is the difference between a process and a thread?", keys: k("memory|address space", "share|shared", "lightweight|overhead", "independent|isolat"), ideal: "A process has its own address space; threads live inside a process and share its memory, making them lighter but needing synchronisation." },
      medium: { q: "What is a deadlock and what are the four conditions for it?", keys: k("mutual exclusion", "hold and wait", "no preemption", "circular wait"), ideal: "Deadlock is when processes wait on each other forever; it requires mutual exclusion, hold-and-wait, no preemption and circular wait." },
      hard: { q: "Explain virtual memory and paging. What happens on a page fault?", keys: k("page table", "physical|frame", "disk|swap", "tlb|translation"), ideal: "Virtual memory maps virtual pages to physical frames via page tables (cached in the TLB); on a page fault the OS loads the page from disk/swap, possibly evicting another." },
      scenario: { q: "A server becomes unresponsive under load with CPU at only 20%. What could be happening?", keys: k("i/?o|disk|network", "lock|contention|deadlock", "thread pool|blocking", "memory|swap|gc"), ideal: "Likely I/O wait, lock contention/deadlock, exhausted thread pool with blocking calls, or memory pressure/swapping — check with top/iostat/thread dumps." },
    },
  },
  "Behavioral": {
    skills: [],
    levels: {
      easy: { q: "Tell me about yourself in under a minute.", keys: k("study|student|degree|graduat", "project|built", "skill|experience", "goal|looking|interested|role"), ideal: "Present → past → future: who you are, 1–2 proof points (projects/impact), and why this role." },
      medium: { q: "Tell me about a time you faced a conflict in a team project. What did you do?", keys: k("situation|team|project", "task|responsib", "action|i decided|i talked|discussed", "result|outcome|learned"), ideal: "Use STAR: Situation, Task, the Actions YOU took (communication, compromise), and a measurable Result + learning." },
      hard: { q: "Describe a project that failed or a mistake you made. What did you learn?", keys: k("mistake|fail|wrong", "own|responsib|my fault", "fix|recover|changed", "learn|now i|since then"), ideal: "Own the mistake honestly, explain how you fixed or mitigated it, and show a concrete change in your behaviour since." },
      scenario: { q: "You're two days from a hackathon deadline and a teammate's core feature is broken. What do you do?", keys: k("prioriti|scope|mvp", "communicat|talk|team", "help|pair|support", "fallback|backup|plan b|demo"), ideal: "Re-prioritise scope to a demoable MVP, communicate openly, pair with the teammate, and prepare a fallback demo path." },
    },
  },
};

export const TOPICS = Object.keys(BANK);

export function topicsForSkills(skills: string[], max = 3): string[] {
  const scored = TOPICS.filter((t) => t !== "Behavioral").map((t) => ({ t, n: BANK[t].skills.filter((s) => skills.includes(s)).length }));
  return scored.sort((a, b) => b.n - a.n).filter((x) => x.n > 0).slice(0, max).map((x) => x.t);
}

export function bankQuestion(topic: string, level: Level, kind: InterviewQuestion["kind"] = "core"): InterviewQuestion {
  const b = BANK[topic] ?? BANK["DSA"];
  const q = b.levels[level];
  return { topic, level, q: q.q, keys: q.keys, ideal: q.ideal, kind };
}

/* ------------------------------------------------------------------ */
/* Heuristic evaluator                                                 */
/* ------------------------------------------------------------------ */

const FILLERS = ["um", "uh", "uhm", "erm", "like", "you know", "basically", "actually", "literally", "i mean", "kind of", "sort of", "so yeah"];
const PRACTICAL = /\b(for example|e\.g\.|for instance|such as|in my project|i built|i used|we used|i implemented|in production|suppose|let's say|real[- ]world|trade-?off|because|which means|so that|step|first|then|finally|measure|benchmark)\b/gi;

export function countFillers(text: string): Record<string, number> {
  const lower = ` ${text.toLowerCase().replace(/[^a-z' ]/g, " ")} `;
  const out: Record<string, number> = {};
  for (const f of FILLERS) {
    const n = lower.split(` ${f} `).length - 1;
    if (n) out[f] = n;
  }
  return out;
}

export function heuristicEvaluate(q: InterviewQuestion, answer: string): Evaluation {
  const text = answer.toLowerCase();
  const words = answer.split(/\s+/).filter(Boolean).length;
  const covered: string[] = [];
  const missed: string[] = [];
  for (const group of q.keys) {
    const hit = group.some((g) => new RegExp(g, "i").test(text));
    (hit ? covered : missed).push(group[0].replace(/\\/g, ""));
  }
  const coverage = q.keys.length ? covered.length / q.keys.length : 0;
  const practicalHits = (answer.match(PRACTICAL) || []).length + (/\d/.test(answer) ? 1 : 0);
  const fillerCount = Object.values(countFillers(answer)).reduce((a, b) => a + b, 0);

  const cap = words < 6 ? 0.2 : words < 15 ? 0.6 : 1;
  const conceptual = Math.round(Math.min(10, coverage * 10 + (words > 40 ? 1 : 0)) * cap * 10) / 10;
  const relevance = 0.25 + 0.75 * Math.min(1, coverage * 1.5);
  const practical = Math.round(Math.min(10, practicalHits * 2 + coverage * 4) * cap * relevance * 10) / 10;
  const lenScore = words < 15 ? 3 : words < 35 ? 6 : words <= 220 ? 9 : 7;
  const communication = Math.round(Math.max(1, Math.min(10, lenScore - fillerCount * 0.5)) * (words < 6 ? 0.3 : 1) * 10) / 10;

  const w = { easy: [0.65, 0.15, 0.2], medium: [0.5, 0.3, 0.2], hard: [0.45, 0.35, 0.2], scenario: [0.3, 0.5, 0.2] }[q.level];
  const overall = Math.round((conceptual * w[0] + practical * w[1] + communication * w[2]) * 10) / 10;

  let feedback: string;
  if (words < 6) feedback = "Answer is too short to evaluate — explain your thinking out loud.";
  else if (coverage === 0) feedback = `This answer doesn't address the question's core concepts. A strong answer covers: ${missed.join(", ")}.`;
  else if (overall >= 7) feedback = `Strong answer. You covered ${covered.join(", ")}.${missed.length ? ` To make it complete, mention ${missed.join(", ")}.` : ""}`;
  else if (conceptual >= 6 && practical < 5) feedback = "Good concept knowledge, but add a concrete example, trade-off or step-by-step application.";
  else feedback = `Partially correct. Key points missing: ${missed.join(", ") || "depth and examples"}.`;

  return { conceptual, practical, communication, overall, feedback, missed, covered };
}

/* ------------------------------------------------------------------ */
/* Adaptive controller                                                 */
/* ------------------------------------------------------------------ */

export interface AdaptiveState {
  topics: string[];
  topicIdx: number;
  levelIdx: number;
  followupsAtLevel: number;
}

export function initialState(topics: string[]): AdaptiveState {
  return { topics: topics.length ? topics : ["DSA"], topicIdx: 0, levelIdx: 0, followupsAtLevel: 0 };
}

export interface Decision {
  state: AdaptiveState;
  next: { topic: string; level: Level; kind: InterviewQuestion["kind"]; focus?: string };
  reason: string;
  diagnosis: string;
}

export function decideNext(s: AdaptiveState, ev: Evaluation, q: InterviewQuestion): Decision {
  const st = { ...s };
  const topic = q.topic;
  const nextTopic = () => {
    st.topicIdx = (st.topicIdx + 1) % st.topics.length;
    st.levelIdx = Math.min(1, st.levelIdx);
    st.followupsAtLevel = 0;
  };
  let reason: string;
  let kind: InterviewQuestion["kind"] = "core";
  let focus: string | undefined;

  const diag = [
    `Conceptual knowledge → ${ev.conceptual >= 7 ? "Strong" : ev.conceptual >= 4.5 ? "Developing" : "Weak"}`,
    `Practical application → ${ev.practical >= 7 ? "Strong" : ev.practical >= 4.5 ? "Developing" : "Weak"}`,
  ].join("  ·  ");

  if (ev.overall >= 7) {
    if (st.levelIdx < LEVELS.length - 1) {
      st.levelIdx++;
      st.followupsAtLevel = 0;
      reason = `Strong answer → raising difficulty to ${LEVELS[st.levelIdx].toUpperCase()}.`;
    } else {
      reason = `Mastered ${topic} up to scenario level → switching topic.`;
      nextTopic();
    }
  } else if (ev.conceptual >= 6 && ev.practical < 5 && st.followupsAtLevel < 1) {
    st.followupsAtLevel++;
    kind = "practical";
    focus = "practical";
    reason = "Concepts are solid but application is weak → asking a practical, hands-on follow-up.";
  } else if (ev.overall >= 4 && st.followupsAtLevel < 1) {
    st.followupsAtLevel++;
    kind = "followup";
    focus = ev.missed[0];
    reason = `Partially correct → probing deeper on "${ev.missed[0] ?? "the missing piece"}" at the same level.`;
  } else if (ev.overall < 4 && st.levelIdx > 0) {
    st.levelIdx--;
    st.followupsAtLevel = 0;
    reason = `Struggled → stepping down to ${LEVELS[st.levelIdx].toUpperCase()} to rebuild from fundamentals.`;
  } else {
    reason = `Moving on from ${topic} — flagged for practice in your report.`;
    nextTopic();
  }
  if (kind !== "core" && q.kind !== "core") {
    kind = "core";
    reason += " (one follow-up max — continuing with core questions)";
  }
  return { state: st, next: { topic: st.topics[st.topicIdx], level: LEVELS[st.levelIdx], kind, focus }, reason, diagnosis: diag };
}

export function followupQuestion(prev: InterviewQuestion, kind: "followup" | "practical", focus?: string): InterviewQuestion {
  const scen = BANK[prev.topic]?.levels.scenario;
  if (kind === "practical") {
    return {
      ...prev,
      kind,
      q: `Good theory. Now make it practical: in one of your own projects, where would you apply this — and what trade-off would you face? (Context: "${prev.q}")`,
      keys: [...prev.keys.slice(0, 2), ["project|built|i used|we used|example"], ["trade-?off|downside|cost|but"]],
      ideal: scen?.ideal ?? prev.ideal,
    };
  }
  return {
    ...prev,
    kind,
    q: `Follow-up: you didn't mention ${focus ?? "a key point"}. How does ${focus ?? "it"} fit into your answer to "${prev.q}"?`,
    keys: prev.keys.filter((g) => g[0].replace(/\\/g, "") === focus).concat([["because|so that|which means|example"]]),
  };
}

export function summarise(turns: InterviewTurn[]) {
  const byTopic: Record<string, { n: number; c: number; p: number; o: number; maxLevel: number }> = {};
  for (const t of turns) {
    const b = (byTopic[t.question.topic] ??= { n: 0, c: 0, p: 0, o: 0, maxLevel: 0 });
    b.n++;
    b.c += t.evaluation.conceptual;
    b.p += t.evaluation.practical;
    b.o += t.evaluation.overall;
    if (t.evaluation.overall >= 6) b.maxLevel = Math.max(b.maxLevel, LEVELS.indexOf(t.question.level) + 1);
  }
  const topics = Object.entries(byTopic).map(([topic, b]) => ({
    topic,
    conceptual: +(b.c / b.n).toFixed(1),
    practical: +(b.p / b.n).toFixed(1),
    overall: +(b.o / b.n).toFixed(1),
    reached: b.maxLevel ? LEVELS[b.maxLevel - 1] : "none",
  }));
  const overall = turns.length ? +(turns.reduce((a, t) => a + t.evaluation.overall, 0) / turns.length).toFixed(1) : 0;
  return { topics, overall };
}
