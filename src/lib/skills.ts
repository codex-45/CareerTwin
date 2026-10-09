export type SkillCategory =
  | "Languages"
  | "Frontend"
  | "Backend"
  | "Databases"
  | "Cloud & DevOps"
  | "AI/ML"
  | "Data"
  | "CS Fundamentals"
  | "Mobile"
  | "Tools";

export const CATEGORIES: SkillCategory[] = [
  "Languages",
  "Frontend",
  "Backend",
  "Databases",
  "Cloud & DevOps",
  "AI/ML",
  "Data",
  "CS Fundamentals",
];

interface SkillDef {
  name: string;
  cat: SkillCategory;
  aliases: string[];
  /** Case-sensitive regex for ambiguous single-letter names (C, R, Go). */
  re?: RegExp;
}

const S = (name: string, cat: SkillCategory, aliases: string[] = [], re?: RegExp): SkillDef => ({
  name,
  cat,
  aliases: [name.toLowerCase(), ...aliases],
  re,
});

export const SKILLS: SkillDef[] = [
  // Languages
  S("Python", "Languages", ["python3"]),
  S("Java", "Languages", ["core java"]),
  S("JavaScript", "Languages", ["js", "es6", "ecmascript"]),
  S("TypeScript", "Languages", ["ts"]),
  S("C++", "Languages", ["cpp"]),
  S("C", "Languages", ["c programming", "c language"], /(?:^|[\s,(/|:])C(?=[\s,)/|;]|$)/m),
  S("C#", "Languages", ["csharp", "c sharp"]),
  S("Go", "Languages", ["golang"]),
  S("Rust", "Languages"),
  S("Kotlin", "Languages"),
  S("Swift", "Languages"),
  S("R", "Languages", ["r programming", "rstudio"], /(?:^|[\s,(/|:])R(?=[\s,)/|;]|$)/m),
  S("PHP", "Languages"),
  S("Bash", "Languages", ["shell scripting", "shell script"]),
  // Frontend
  S("HTML", "Frontend", ["html5"]),
  S("CSS", "Frontend", ["css3", "scss", "sass"]),
  S("React", "Frontend", ["react.js", "reactjs"]),
  S("Next.js", "Frontend", ["nextjs", "next js"]),
  S("Angular", "Frontend", ["angularjs"]),
  S("Vue", "Frontend", ["vue.js", "vuejs"]),
  S("Tailwind CSS", "Frontend", ["tailwind", "tailwindcss"]),
  S("Redux", "Frontend"),
  // Backend
  S("Node.js", "Backend", ["nodejs", "node js", "node"]),
  S("Express.js", "Backend", ["express", "expressjs"]),
  S("Django", "Backend"),
  S("Flask", "Backend"),
  S("FastAPI", "Backend", ["fast api"]),
  S("Spring Boot", "Backend", ["springboot", "spring framework", "spring mvc"]),
  S("REST APIs", "Backend", ["rest api", "rest apis", "restful", "apis", "api development"]),
  S("GraphQL", "Backend"),
  S("Microservices", "Backend", ["microservice", "micro-services"]),
  S("Authentication", "Backend", ["jwt", "oauth", "auth"]),
  // Databases
  S("SQL", "Databases", ["structured query language"]),
  S("MySQL", "Databases"),
  S("PostgreSQL", "Databases", ["postgres"]),
  S("MongoDB", "Databases", ["mongo", "mongoose"]),
  S("Redis", "Databases"),
  S("Firebase", "Databases", ["firestore"]),
  S("DBMS", "CS Fundamentals", ["database management", "normalization"]),
  // Cloud & DevOps
  S("AWS", "Cloud & DevOps", ["amazon web services", "ec2", "s3", "lambda"]),
  S("Azure", "Cloud & DevOps", ["microsoft azure"]),
  S("GCP", "Cloud & DevOps", ["google cloud", "google cloud platform"]),
  S("Docker", "Cloud & DevOps", ["containerization", "dockerfile", "containers"]),
  S("Kubernetes", "Cloud & DevOps", ["k8s"]),
  S("CI/CD", "Cloud & DevOps", ["github actions", "jenkins", "ci cd", "continuous integration"]),
  S("Linux", "Cloud & DevOps", ["ubuntu", "unix"]),
  S("Terraform", "Cloud & DevOps"),
  S("Vercel", "Cloud & DevOps", ["netlify"]),
  // AI/ML
  S("Machine Learning", "AI/ML", ["ml", "scikit-learn", "sklearn", "supervised learning"]),
  S("Deep Learning", "AI/ML", ["neural network", "neural networks", "dl"]),
  S("TensorFlow", "AI/ML", ["keras"]),
  S("PyTorch", "AI/ML", ["torch"]),
  S("NLP", "AI/ML", ["natural language processing"]),
  S("Computer Vision", "AI/ML", ["opencv", "image processing", "yolo"]),
  S("Regression", "AI/ML", ["linear regression", "logistic regression"]),
  S("Decision Trees", "AI/ML", ["random forest", "xgboost", "decision tree"]),
  S("CNN", "AI/ML", ["convolutional neural network", "cnns"]),
  S("Transformers", "AI/ML", ["bert", "hugging face", "huggingface"]),
  S("LLMs", "AI/ML", ["llm", "large language model", "gpt", "gemini", "openai", "langchain"]),
  S("RAG", "AI/ML", ["retrieval augmented generation", "retrieval-augmented"]),
  S("Prompt Engineering", "AI/ML", ["prompting"]),
  S("Vector Databases", "AI/ML", ["vector database", "pinecone", "faiss", "chromadb", "embeddings"]),
  S("MLOps", "AI/ML", ["mlflow", "model deployment"]),
  S("Recommendation Systems", "AI/ML", ["recommender", "recommendation system", "recommendation engine", "collaborative filtering"]),
  // Data
  S("Pandas", "Data"),
  S("NumPy", "Data", ["numpy"]),
  S("Matplotlib", "Data", ["seaborn", "plotly"]),
  S("Statistics", "Data", ["statistical", "probability", "hypothesis testing"]),
  S("Excel", "Data", ["ms excel", "spreadsheets"]),
  S("Power BI", "Data", ["powerbi"]),
  S("Tableau", "Data"),
  S("Data Visualization", "Data", ["dashboards", "dashboard"]),
  S("Spark", "Data", ["pyspark", "apache spark"]),
  S("ETL", "Data", ["data pipeline", "data pipelines", "airflow"]),
  // CS Fundamentals
  S("DSA", "CS Fundamentals", ["data structures", "algorithms", "leetcode", "competitive programming", "codeforces", "codechef"]),
  S("OOP", "CS Fundamentals", ["object oriented", "object-oriented", "oops"]),
  S("Operating Systems", "CS Fundamentals", ["operating system", "os concepts"]),
  S("Computer Networks", "CS Fundamentals", ["networking", "tcp/ip"]),
  S("System Design", "CS Fundamentals", ["low level design", "high level design", "distributed systems", "scalability", "lld", "hld"]),
  S("Testing", "CS Fundamentals", ["unit testing", "jest", "pytest", "junit", "test cases"]),
  // Mobile
  S("Android", "Mobile", ["android studio"]),
  S("Flutter", "Mobile", ["dart"]),
  S("React Native", "Mobile"),
  // Tools
  S("Git", "Tools", ["github", "gitlab", "version control"]),
  S("Figma", "Tools"),
  S("Postman", "Tools"),
  S("Jira", "Tools", ["agile", "scrum"]),
];

export const SKILL_BY_NAME = new Map(SKILLS.map((s) => [s.name, s]));

/** Holding a child skill implies working knowledge of the parent. */
export const IMPLIES: Record<string, string[]> = {
  MySQL: ["SQL"],
  PostgreSQL: ["SQL"],
  "Next.js": ["React"],
  React: ["JavaScript"],
  TypeScript: ["JavaScript"],
  "Express.js": ["Node.js", "REST APIs"],
  Django: ["Python"],
  Flask: ["Python", "REST APIs"],
  FastAPI: ["Python", "REST APIs"],
  "Spring Boot": ["Java", "REST APIs"],
  TensorFlow: ["Deep Learning"],
  PyTorch: ["Deep Learning"],
  CNN: ["Deep Learning"],
  "Deep Learning": ["Machine Learning"],
  Kubernetes: ["Docker"],
  Pandas: ["Python", "NumPy"],
  RAG: ["LLMs"],
  "React Native": ["React"],
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const COMPILED = SKILLS.map((s) => ({
  def: s,
  res: s.aliases
    .filter((a) => !(s.re && a.length === 1))
    .map((a) => new RegExp(`(?<![a-z0-9+#.])${escapeRe(a)}(?![a-z0-9+#])`, "g")),
}));

/** Returns skill name -> number of mentions. */
export function detectSkills(text: string): Map<string, number> {
  const lower = text.toLowerCase();
  const out = new Map<string, number>();
  for (const { def, res } of COMPILED) {
    let count = 0;
    for (const re of res) count += (lower.match(re) || []).length;
    if (def.re) count += (text.match(new RegExp(def.re.source, "gm")) || []).length;
    if (count > 0) out.set(def.name, count);
  }
  // "Node" alone is noisy; require JS context for it.
  if (out.has("Node.js") && !/node\.?js|express|npm/i.test(text) && !out.has("JavaScript")) out.delete("Node.js");
  return out;
}

export const SOFT_SKILLS: { name: string; cues: RegExp }[] = [
  { name: "Leadership", cues: /\b(led|lead|leader|captain|head of|president|spearheaded)\b/i },
  { name: "Teamwork", cues: /\b(team of|teamwork|collaborat\w*|cross-functional|worked with)\b/i },
  { name: "Communication", cues: /\b(present\w*|communicat\w*|public speaking|speaker|wrote|blog|documentation)\b/i },
  { name: "Problem Solving", cues: /\b(problem[- ]solving|solved|leetcode|codechef|codeforces|hackathon|debugg\w*)\b/i },
  { name: "Mentoring", cues: /\b(mentor\w*|taught|teaching assistant|tutor\w*)\b/i },
  { name: "Ownership", cues: /\b(owned|end-to-end|independently|from scratch|built and deployed|founded)\b/i },
  { name: "Event Management", cues: /\b(organi[sz]ed|coordinat\w*|volunteer\w*|club|fest|committee)\b/i },
  { name: "Adaptability", cues: /\b(adapt\w*|quick learner|self-taught|learned)\b/i },
];
