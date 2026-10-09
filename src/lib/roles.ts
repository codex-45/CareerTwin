export interface RoleDef {
  id: string;
  title: string;
  blurb: string;
  /** weight 3 = core, 2 = important, 1 = nice to have */
  skills: Record<string, 1 | 2 | 3>;
  pillars: { name: string; skills: string[] }[];
  projects: string[];
  match: RegExp;
}

export const ROLES: RoleDef[] = [
  {
    id: "swe",
    title: "Software Engineer",
    blurb: "Builds and maintains production software; strong fundamentals + clean code.",
    skills: { DSA: 3, OOP: 3, Git: 3, "System Design": 2, SQL: 2, "REST APIs": 2, Python: 2, Java: 2, "Operating Systems": 1, "Computer Networks": 1, Docker: 1, Testing: 2, "CI/CD": 1, Linux: 1, AWS: 1 },
    pillars: [
      { name: "Programming", skills: ["Java", "Python", "OOP", "Git"] },
      { name: "CS Core", skills: ["DSA", "DBMS", "Operating Systems", "Computer Networks"] },
      { name: "Engineering", skills: ["REST APIs", "Testing", "System Design", "Docker"] },
    ],
    projects: ["URL shortener with caching + rate limiting", "Collaborative to-do app with REST API, auth and tests"],
    match: /software (engineer|developer)|\bsde\b|developer|programmer/i,
  },
  {
    id: "frontend",
    title: "Frontend Developer",
    blurb: "Crafts fast, accessible user interfaces.",
    skills: { JavaScript: 3, HTML: 3, CSS: 3, React: 3, TypeScript: 2, "Next.js": 2, Git: 2, "REST APIs": 2, Testing: 1, Figma: 1, "Tailwind CSS": 1, Redux: 1 },
    pillars: [
      { name: "Web Basics", skills: ["HTML", "CSS", "JavaScript", "Git"] },
      { name: "Frameworks", skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"] },
      { name: "Quality", skills: ["Testing", "REST APIs", "Figma", "Vercel"] },
    ],
    projects: ["Accessible design-system component library", "Realtime dashboard with Next.js + charts"],
    match: /front[- ]?end|ui developer|react developer|web developer/i,
  },
  {
    id: "backend",
    title: "Backend Developer",
    blurb: "Designs APIs, data models and reliable services.",
    skills: { "REST APIs": 3, SQL: 3, "Node.js": 2, Java: 2, Python: 2, "System Design": 3, Docker: 2, Git: 2, Authentication: 2, Redis: 1, Microservices: 1, AWS: 2, Testing: 2, DSA: 2 },
    pillars: [
      { name: "Languages", skills: ["Java", "Python", "Node.js", "Git"] },
      { name: "Data & APIs", skills: ["SQL", "REST APIs", "Authentication", "Redis"] },
      { name: "Systems", skills: ["System Design", "Docker", "AWS", "Microservices"] },
    ],
    projects: ["E-commerce order service with Postgres, Redis cache and JWT auth", "Job queue / notification microservice in Docker"],
    match: /back[- ]?end|api developer|server[- ]side/i,
  },
  {
    id: "fullstack",
    title: "Full-Stack Developer",
    blurb: "Ships complete features end-to-end, UI to database.",
    skills: { JavaScript: 3, React: 3, "Node.js": 3, SQL: 2, MongoDB: 2, "REST APIs": 3, Git: 2, TypeScript: 2, Docker: 1, Authentication: 2, "Next.js": 1, Vercel: 1, AWS: 1 },
    pillars: [
      { name: "Frontend", skills: ["HTML", "CSS", "React", "TypeScript"] },
      { name: "Backend", skills: ["Node.js", "Express.js", "REST APIs", "Authentication"] },
      { name: "Data & Ship", skills: ["SQL", "MongoDB", "Docker", "Vercel"] },
    ],
    projects: ["SaaS-style app with auth, payments sandbox and admin dashboard", "Realtime chat app with websockets"],
    match: /full[- ]?stack|mern|mean stack/i,
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    blurb: "Turns raw data into decisions with SQL, stats and dashboards.",
    skills: { SQL: 3, Excel: 3, Python: 2, Pandas: 2, Statistics: 3, "Power BI": 2, Tableau: 1, "Data Visualization": 3, Matplotlib: 1 },
    pillars: [
      { name: "Querying", skills: ["SQL", "Excel", "Python", "Pandas"] },
      { name: "Analysis", skills: ["Statistics", "NumPy", "Regression", "Matplotlib"] },
      { name: "Storytelling", skills: ["Data Visualization", "Power BI", "Tableau", "ETL"] },
    ],
    projects: ["Sales KPI dashboard in Power BI from a public dataset", "A/B test analysis notebook with clear business recommendation"],
    match: /data analyst|business analyst|analytics|bi developer/i,
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    blurb: "Models data to predict and explain outcomes.",
    skills: { Python: 3, Statistics: 3, "Machine Learning": 3, Pandas: 2, NumPy: 2, SQL: 2, "Data Visualization": 2, Regression: 2, "Decision Trees": 2, "Deep Learning": 1, Spark: 1 },
    pillars: [
      { name: "Foundations", skills: ["Python", "Statistics", "SQL", "Pandas"] },
      { name: "Modeling", skills: ["Regression", "Decision Trees", "Machine Learning", "Deep Learning"] },
      { name: "Delivery", skills: ["Data Visualization", "Spark", "MLOps", "Git"] },
    ],
    projects: ["Churn prediction with explainability (SHAP) report", "Demand forecasting on time-series data"],
    match: /data scien/i,
  },
  {
    id: "ml-engineer",
    title: "ML Engineer",
    blurb: "Takes models from notebook to production.",
    skills: { Python: 3, "Machine Learning": 3, "Deep Learning": 2, PyTorch: 2, TensorFlow: 1, Docker: 2, MLOps: 3, SQL: 1, AWS: 2, "REST APIs": 2, DSA: 1, Git: 2 },
    pillars: [
      { name: "Programming", skills: ["Python", "NumPy", "Pandas", "Git"] },
      { name: "ML", skills: ["Regression", "Decision Trees", "CNN", "PyTorch"] },
      { name: "Systems", skills: ["REST APIs", "Docker", "MLOps", "AWS"] },
    ],
    projects: ["Serve an image classifier behind FastAPI in Docker with monitoring", "Feature store + retraining pipeline"],
    match: /machine learning|\bml engineer|mlops/i,
  },
  {
    id: "ai-engineer",
    title: "AI Engineer",
    blurb: "Builds LLM-powered products: RAG, agents, evaluation.",
    skills: { Python: 3, LLMs: 3, RAG: 3, "Prompt Engineering": 2, "Vector Databases": 2, "Machine Learning": 2, "REST APIs": 2, FastAPI: 1, Docker: 2, Transformers: 1, NLP: 1, AWS: 1, Git: 2 },
    pillars: [
      { name: "Programming", skills: ["Python", "NumPy", "Pandas", "Git"] },
      { name: "ML", skills: ["Regression", "Decision Trees", "CNN", "Transformers"] },
      { name: "Systems", skills: ["REST APIs", "Docker", "AWS", "Vector Databases"] },
      { name: "GenAI", skills: ["LLMs", "Prompt Engineering", "RAG", "MLOps"] },
    ],
    projects: ["RAG chatbot over college notes with citations + eval set", "AI agent that triages GitHub issues"],
    match: /\bai engineer|gen ?ai|llm|artificial intelligence|prompt engineer/i,
  },
  {
    id: "cloud",
    title: "Cloud / DevOps Engineer",
    blurb: "Automates infrastructure, deployments and reliability.",
    skills: { Linux: 3, Docker: 3, Kubernetes: 2, AWS: 3, "CI/CD": 3, Terraform: 2, Bash: 2, Git: 2, Python: 1, "Computer Networks": 2, Azure: 1 },
    pillars: [
      { name: "Foundations", skills: ["Linux", "Bash", "Computer Networks", "Git"] },
      { name: "Containers", skills: ["Docker", "Kubernetes", "CI/CD", "Testing"] },
      { name: "Cloud", skills: ["AWS", "Terraform", "Azure", "System Design"] },
    ],
    projects: ["IaC: deploy a 3-tier app on AWS with Terraform + GitHub Actions", "Kubernetes cluster with autoscaling + Grafana dashboards"],
    match: /cloud (engineer|architect|developer|ops)|devops|\bsre\b|site reliability|platform engineer|infrastructure engineer/i,
  },
  {
    id: "mobile",
    title: "Mobile Developer",
    blurb: "Builds native or cross-platform mobile apps.",
    skills: { Kotlin: 2, Android: 3, Flutter: 2, "React Native": 2, Swift: 1, "REST APIs": 2, Firebase: 2, Git: 2, OOP: 2, Testing: 1 },
    pillars: [
      { name: "Language", skills: ["Kotlin", "Java", "OOP", "Git"] },
      { name: "Platform", skills: ["Android", "Flutter", "React Native", "Firebase"] },
      { name: "Ship", skills: ["REST APIs", "Testing", "CI/CD", "Figma"] },
    ],
    projects: ["Offline-first expense tracker with sync", "Campus events app with push notifications"],
    match: /android|ios|mobile|flutter|react native/i,
  },
];

export const ROLE_BY_ID = new Map(ROLES.map((r) => [r.id, r]));

export interface CompanyFlavor {
  key: string;
  name: string;
  emphasis: string[];
  values: string;
  pitchAngle: string;
  match: RegExp;
}

export const COMPANIES: CompanyFlavor[] = [
  { key: "google", name: "Google", emphasis: ["DSA", "System Design"], values: "scale, algorithmic thinking, measurable impact", pitchAngle: "Software Engineering", match: /google|alphabet/i },
  { key: "microsoft", name: "Microsoft", emphasis: ["Azure", "DSA"], values: "growth mindset, cloud, collaboration", pitchAngle: "Cloud / Software", match: /microsoft/i },
  { key: "amazon", name: "Amazon", emphasis: ["AWS", "System Design", "DSA"], values: "customer obsession, ownership, bias for action", pitchAngle: "Backend", match: /amazon|aws/i },
  { key: "meta", name: "Meta", emphasis: ["DSA", "React"], values: "move fast, build at scale", pitchAngle: "Product Engineering", match: /\bmeta\b|facebook/i },
  { key: "startup", name: "Startup", emphasis: ["Docker", "REST APIs"], values: "speed, ownership, wearing many hats", pitchAngle: "Full-stack", match: /startup|early[- ]stage|seed|series a/i },
  { key: "services", name: "IT Services (TCS/Infosys/Wipro)", emphasis: ["Java", "SQL"], values: "reliability, client communication, versatility", pitchAngle: "Versatile Engineer", match: /\btcs\b|infosys|wipro|accenture|cognizant|capgemini|hcl/i },
];

export function detectCompany(text: string): CompanyFlavor | undefined {
  return COMPANIES.find((c) => c.match.test(text));
}

export function detectRole(text: string): RoleDef {
  const ordered = [...ROLES].sort((a, b) => (a.id === "swe" ? 1 : b.id === "swe" ? -1 : 0));
  const title = text.trim().split("\n")[0].slice(0, 140);
  return ordered.find((r) => r.match.test(title)) ?? ordered.find((r) => r.match.test(text)) ?? ROLE_BY_ID.get("swe")!;
}

export interface SkillGuide {
  learn: string[];
  apply: (project: string) => string;
  build: string;
  resource: string;
}

export const GUIDES: Record<string, SkillGuide> = {
  Docker: {
    learn: ["Images vs containers, layers, Dockerfile basics", "Volumes, networks and docker-compose", "Multi-stage builds & image size"],
    apply: (p) => `Write a Dockerfile + docker-compose for "${p}" and run it locally`,
    build: "Containerized API + database stack with docker-compose",
    resource: "docs.docker.com/get-started",
  },
  AWS: {
    learn: ["IAM, EC2, S3 and regions", "Deploying with Elastic Beanstalk / ECS", "Cost alarms & free-tier hygiene"],
    apply: (p) => `Deploy "${p}" to AWS (EC2 or ECS) with a public URL`,
    build: "Serverless image-resize pipeline with S3 + Lambda",
    resource: "AWS Skill Builder – Cloud Practitioner Essentials",
  },
  "System Design": {
    learn: ["Load balancers, caching, CDNs", "SQL vs NoSQL, sharding, replication", "Designing URL shortener / rate limiter"],
    apply: (p) => `Write a 1-page design doc for scaling "${p}" to 100K users`,
    build: "URL shortener with Redis cache and rate limiter",
    resource: "System Design Primer (GitHub: donnemartin)",
  },
  Kubernetes: {
    learn: ["Pods, deployments, services", "ConfigMaps, secrets, probes", "Horizontal pod autoscaling"],
    apply: (p) => `Deploy "${p}" to a local kind/minikube cluster`,
    build: "Microservice app on k8s with autoscaling",
    resource: "kubernetes.io/docs/tutorials",
  },
  "CI/CD": {
    learn: ["GitHub Actions workflows", "Automated tests & lint on PR", "Deploy on merge"],
    apply: (p) => `Add a GitHub Actions pipeline (test → build → deploy) to "${p}"`,
    build: "Template repo with full CI/CD pipeline",
    resource: "docs.github.com/actions",
  },
  "REST APIs": {
    learn: ["HTTP methods, status codes, idempotency", "Resource design & pagination", "Validation and error handling"],
    apply: (p) => `Expose "${p}" through a documented REST API (OpenAPI/Swagger)`,
    build: "CRUD API with auth, pagination and Swagger docs",
    resource: "restfulapi.net",
  },
  SQL: {
    learn: ["Joins, GROUP BY, window functions", "Indexes and query plans", "Normalization"],
    apply: (p) => `Model "${p}" data in PostgreSQL and write 10 analytical queries`,
    build: "Analytics queries over a public dataset",
    resource: "SQLBolt, LeetCode SQL 50",
  },
  DSA: {
    learn: ["Arrays, hashing, two pointers", "Trees, graphs, BFS/DFS", "DP patterns"],
    apply: () => "Solve 5 problems/day from the NeetCode 150 list",
    build: "Public DSA log repo with patterns + explanations",
    resource: "NeetCode 150, Striver A2Z sheet",
  },
  Testing: {
    learn: ["Unit vs integration tests", "Mocks & fixtures", "Coverage and TDD basics"],
    apply: (p) => `Reach 60%+ test coverage on "${p}"`,
    build: "Tested library with CI badge",
    resource: "Jest / Pytest official docs",
  },
  TypeScript: {
    learn: ["Types, interfaces, generics", "Narrowing & utility types", "Typing React props"],
    apply: (p) => `Migrate "${p}" (or a module of it) to TypeScript`,
    build: "Typed SDK for a public API",
    resource: "typescriptlang.org/docs/handbook",
  },
  React: {
    learn: ["Components, props, state", "Hooks & effects", "Data fetching & routing"],
    apply: (p) => `Build a React frontend for "${p}"`,
    build: "Dashboard SPA consuming a public API",
    resource: "react.dev/learn",
  },
  "Machine Learning": {
    learn: ["Train/test split, bias-variance", "Regression, trees, evaluation metrics", "Feature engineering"],
    apply: (p) => `Add an ML component to "${p}" with a proper evaluation report`,
    build: "End-to-end ML project with model card",
    resource: "Andrew Ng – ML Specialization",
  },
  LLMs: {
    learn: ["Tokens, context windows, temperature", "Prompt patterns & structured output", "Evaluation & hallucination control"],
    apply: (p) => `Add an LLM-powered feature to "${p}" with JSON outputs`,
    build: "LLM app with prompt eval suite",
    resource: "DeepLearning.AI short courses",
  },
  RAG: {
    learn: ["Chunking & embeddings", "Vector search & re-ranking", "Citations and eval (faithfulness)"],
    apply: (p) => `Add document Q&A with citations to "${p}"`,
    build: "RAG chatbot over your college notes",
    resource: "LangChain / LlamaIndex RAG tutorials",
  },
  "Vector Databases": {
    learn: ["Embeddings & similarity", "FAISS / Chroma basics", "Metadata filtering"],
    apply: (p) => `Add semantic search to "${p}"`,
    build: "Semantic search engine over arXiv abstracts",
    resource: "Pinecone learning center",
  },
  MLOps: {
    learn: ["Experiment tracking (MLflow)", "Model serving APIs", "Monitoring & drift"],
    apply: (p) => `Serve the model from "${p}" via FastAPI + Docker`,
    build: "Model serving with retraining pipeline",
    resource: "Made With ML (madewithml.com)",
  },
  Statistics: {
    learn: ["Distributions & sampling", "Hypothesis tests, p-values", "A/B testing"],
    apply: (p) => `Add statistical analysis of results to "${p}"`,
    build: "A/B test analysis report",
    resource: "Khan Academy Statistics",
  },
  "Power BI": {
    learn: ["Data model & relationships", "DAX measures", "Dashboard design"],
    apply: (p) => `Build a Power BI dashboard on data from "${p}"`,
    build: "KPI dashboard on public sales data",
    resource: "Microsoft Learn – PL-300 path",
  },
  Linux: {
    learn: ["Filesystem, permissions, processes", "Shell scripting", "systemd & logs"],
    apply: (p) => `Host "${p}" on a Linux VM with nginx`,
    build: "Automated server setup script",
    resource: "linuxjourney.com",
  },
  Git: {
    learn: ["Branching & merging", "Rebase, PR workflow", "Conventional commits"],
    apply: (p) => `Clean up "${p}" repo: README, branches, PR history`,
    build: "Open-source contribution (good-first-issue)",
    resource: "learngitbranching.js.org",
  },
};

Object.assign(GUIDES, {
  NumPy: { learn: ["Arrays, broadcasting, vectorisation", "Indexing & reshaping", "Linear algebra basics"], apply: (p: string) => `Replace Python loops in "${p}" with vectorised NumPy`, build: "Image filters implemented in pure NumPy", resource: "numpy.org/learn" },
  Regression: { learn: ["Linear & logistic regression", "Loss functions, gradient descent", "Metrics: RMSE, R², ROC-AUC"], apply: (p: string) => `Add a regression baseline to "${p}" and report metrics`, build: "House-price predictor with error analysis", resource: "Andrew Ng – ML Specialization (Course 1)" },
  "Decision Trees": { learn: ["Splits, entropy, Gini", "Random forests & boosting (XGBoost)", "Feature importance"], apply: (p: string) => `Compare a tree model vs your current approach in "${p}"`, build: "Kaggle tabular competition submission", resource: "Kaggle Learn – Intermediate ML" },
  CNN: { learn: ["Convolutions, pooling, feature maps", "Transfer learning (ResNet)", "Augmentation & overfitting"], apply: (p: string) => `Add an image-classification module to "${p}"`, build: "Plant-disease classifier with transfer learning", resource: "fast.ai Practical Deep Learning" },
  Transformers: { learn: ["Attention & self-attention", "Tokenisation & embeddings", "Fine-tuning with Hugging Face"], apply: (p: string) => `Use a pretrained transformer for text features in "${p}"`, build: "Sentiment / intent classifier fine-tuned on custom data", resource: "Hugging Face NLP Course" },
  "Prompt Engineering": { learn: ["Few-shot & chain-of-thought", "Structured JSON outputs", "Prompt evaluation sets"], apply: (p: string) => `Add an LLM prompt pipeline with evals to "${p}"`, build: "Prompt playground with A/B evaluation", resource: "OpenAI / Anthropic prompt engineering guides" },
} satisfies Record<string, SkillGuide>);

export function guideFor(skill: string): SkillGuide {
  return (
    GUIDES[skill] ?? {
      learn: [`Core concepts of ${skill}`, `Official ${skill} tutorial end-to-end`, `Common interview questions on ${skill}`],
      apply: (p) => `Use ${skill} inside "${p}" in a meaningful way`,
      build: `Small project showcasing ${skill}`,
      resource: `Official ${skill} documentation`,
    }
  );
}
