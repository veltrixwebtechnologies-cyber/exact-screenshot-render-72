/** Dependency / manifest signals mapped to technology names shown as evidence. */
export const TECH_SIGNALS: Array<{ match: RegExp; tech: string }> = [
  { match: /^react$|^react-dom$/, tech: "React" },
  { match: /^next$/, tech: "Next.js" },
  { match: /^vue$/, tech: "Vue" },
  { match: /^@angular\/core$/, tech: "Angular" },
  { match: /^svelte$/, tech: "Svelte" },
  { match: /^typescript$/, tech: "TypeScript" },
  { match: /^tailwindcss$/, tech: "Tailwind CSS" },
  { match: /^vite$/, tech: "Vite" },
  { match: /^express$/, tech: "Express" },
  { match: /^@nestjs\/core$/, tech: "NestJS" },
  { match: /^graphql$|^@apollo\//, tech: "GraphQL" },
  { match: /^prisma$|^@prisma\/client$/, tech: "Prisma" },
  { match: /^pg$|^postgres$|^psycopg2|^asyncpg$|^sqlalchemy$/i, tech: "PostgreSQL" },
  { match: /^mongoose$|^pymongo$/, tech: "MongoDB" },
  { match: /^redis$/, tech: "Redis" },
  { match: /^jest$|^vitest$|^pytest$/, tech: "Automated testing" },
  { match: /^playwright$|^@playwright\/test$|^cypress$|^selenium$/, tech: "End-to-end testing" },
  { match: /^fastapi$/, tech: "FastAPI" },
  { match: /^django$/, tech: "Django" },
  { match: /^flask$/, tech: "Flask" },
  { match: /^celery$/, tech: "Celery" },
  { match: /^pandas$|^numpy$|^polars$/, tech: "Data analysis (Python)" },
  { match: /^scikit-learn$|^sklearn$|^xgboost$|^lightgbm$/, tech: "Machine learning" },
  { match: /^torch$|^tensorflow$|^keras$/, tech: "Deep learning" },
  { match: /^transformers$|^langchain|^llama-index$|^openai$/, tech: "LLM / AI engineering" },
  { match: /^boto3$/, tech: "AWS" },
  { match: /^kubernetes$/, tech: "Kubernetes" },
  { match: /^supabase$|^@supabase\/supabase-js$/, tech: "Supabase" },
  { match: /^socket\.io$/, tech: "Realtime / WebSockets" },
  { match: /^stripe$/, tech: "Payments (Stripe)" },
];

/** Repository files and other signals that imply a technology. */
export const FILE_SIGNALS: Array<{ file: string; tech: string }> = [
  { file: "Dockerfile", tech: "Docker" },
  { file: "docker-compose.yml", tech: "Docker" },
  { file: "go.mod", tech: "Go" },
  { file: "pom.xml", tech: "Java / Maven" },
  { file: "build.gradle", tech: "Java / Gradle" },
  { file: "Cargo.toml", tech: "Rust" },
  { file: "terraform.tf", tech: "Terraform" },
  { file: "requirements.txt", tech: "Python" },
  { file: "pyproject.toml", tech: "Python" },
];

export function techFromDependencies(names: string[]): string[] {
  const found = new Set<string>();
  for (const raw of names) {
    const name = raw.trim().toLowerCase();
    if (!name) continue;
    for (const signal of TECH_SIGNALS) {
      if (signal.match.test(name)) found.add(signal.tech);
    }
  }
  return [...found];
}

export function parsePackageJson(content: string): string[] {
  try {
    const parsed = JSON.parse(content) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    return [
      ...Object.keys(parsed.dependencies ?? {}),
      ...Object.keys(parsed.devDependencies ?? {}),
    ];
  } catch {
    return [];
  }
}

export function parseRequirements(content: string): string[] {
  return content
    .split(/\r?\n/)
    .map((line) => line.split("#")[0] ?? "")
    .map((line) => line.split(/[<>=!\[;]/)[0] ?? "")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function parsePyProject(content: string): string[] {
  const names: string[] = [];
  const re = /^\s*["']?([A-Za-z0-9._-]+)["']?\s*(=|>=|<=|~=|,|\])/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    if (m[1]) names.push(m[1]);
  }
  return names;
}
