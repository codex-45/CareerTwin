import { detectSkills } from "@/lib/skills";
import type { GithubSummary } from "@/lib/types";

const LANG_SKILL: Record<string, string> = {
  "Jupyter Notebook": "Python",
  Dockerfile: "Docker",
  Shell: "Bash",
  Dart: "Flutter",
  Vue: "Vue",
  HCL: "Terraform",
};

interface Repo {
  name: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  topics?: string[];
  pushed_at: string;
}

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("user") ?? "";
  const user = raw.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/.*$/, "").trim();
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(user)) return Response.json({ error: "Invalid GitHub username" }, { status: 400 });

  const headers: HeadersInit = { Accept: "application/vnd.github+json", "User-Agent": "CareerTwin" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const [uRes, rRes] = await Promise.all([
    fetch(`https://api.github.com/users/${user}`, { headers }),
    fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, { headers }),
  ]);
  if (uRes.status === 404) return Response.json({ error: "GitHub user not found" }, { status: 404 });
  if (!uRes.ok || !rRes.ok) return Response.json({ error: `GitHub API error (${uRes.status}). Rate limit may be exceeded — add GITHUB_TOKEN.` }, { status: 502 });

  const u = await uRes.json();
  const repos: Repo[] = (await rRes.json()).filter((r: Repo) => !r.fork);

  const langs = new Map<string, number>();
  for (const r of repos) if (r.language) langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
  const topLanguages = [...langs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));

  const corpus = repos
    .map((r) => `${r.name.replace(/[-_]/g, " ")} ${r.description ?? ""} ${(r.topics ?? []).join(" ")}`)
    .concat(topLanguages.map((l) => LANG_SKILL[l.name] ?? l.name))
    .join("\n");
  const skills = [...detectSkills(corpus).keys()];

  const topRepos = [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || +new Date(b.pushed_at) - +new Date(a.pushed_at))
    .slice(0, 6)
    .map((r) => ({ name: r.name, description: r.description ?? "", stars: r.stargazers_count, language: r.language, url: r.html_url, topics: r.topics ?? [] }));

  const summary: GithubSummary = {
    username: u.login,
    name: u.name ?? undefined,
    bio: u.bio ?? undefined,
    publicRepos: u.public_repos,
    followers: u.followers,
    totalStars: repos.reduce((a, r) => a + r.stargazers_count, 0),
    lastActive: repos[0]?.pushed_at,
    topLanguages,
    topRepos,
    skills,
  };
  return Response.json(summary);
}
