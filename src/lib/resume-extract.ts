// Browser-safe helpers that read structure out of resume text. Everything here
// is deterministic: it only reports what is literally written in the resume, so
// it can also serve as the fallback when the AI provider is unavailable.

/** Technologies and practices we can recognise by name in resume text. */
export const RESUME_TECH: Array<{ re: RegExp; name: string }> = [
  { re: /\breact(?:\.js)?\b/i, name: "React" },
  { re: /\bnext(?:\.js)?\b/i, name: "Next.js" },
  { re: /\bvue(?:\.js)?\b/i, name: "Vue" },
  { re: /\bangular\b/i, name: "Angular" },
  { re: /\bsvelte\b/i, name: "Svelte" },
  { re: /\btypescript\b/i, name: "TypeScript" },
  { re: /\bjavascript\b/i, name: "JavaScript" },
  { re: /\btailwind\b/i, name: "Tailwind CSS" },
  { re: /\bnode(?:\.js)?\b/i, name: "Node.js" },
  { re: /\bexpress(?:\.js)?\b/i, name: "Express" },
  { re: /\bnest(?:\.?js)\b/i, name: "NestJS" },
  { re: /\bgraphql\b/i, name: "GraphQL" },
  { re: /\bpython\b/i, name: "Python" },
  { re: /\bfastapi\b/i, name: "FastAPI" },
  { re: /\bdjango\b/i, name: "Django" },
  { re: /\bflask\b/i, name: "Flask" },
  { re: /\bjava\b(?!script)/i, name: "Java" },
  { re: /\bspring boot\b/i, name: "Spring Boot" },
  { re: /\bgolang\b|\bgo\b(?= developer| services| lang)/i, name: "Go" },
  { re: /\bc\+\+\b/i, name: "C++" },
  { re: /\bc#\b|\bdotnet\b|\b\.net\b/i, name: ".NET" },
  { re: /\bpostgres(?:ql)?\b/i, name: "PostgreSQL" },
  { re: /\bmysql\b/i, name: "MySQL" },
  { re: /\bmongo(?:db)?\b/i, name: "MongoDB" },
  { re: /\bredis\b/i, name: "Redis" },
  { re: /\bsupabase\b/i, name: "Supabase" },
  { re: /\bfirebase\b/i, name: "Firebase" },
  { re: /\bsql\b/i, name: "SQL" },
  { re: /\bdocker\b/i, name: "Docker" },
  { re: /\bkubernetes\b|\bk8s\b/i, name: "Kubernetes" },
  { re: /\baws\b|\bamazon web services\b/i, name: "AWS" },
  { re: /\bazure\b/i, name: "Azure" },
  { re: /\bgcp\b|\bgoogle cloud\b/i, name: "Google Cloud" },
  { re: /\bterraform\b/i, name: "Terraform" },
  { re: /\bci\/cd\b|\bgithub actions\b|\bjenkins\b/i, name: "CI/CD" },
  { re: /\bwebsocket/i, name: "Realtime / WebSockets" },
  { re: /\bkafka\b/i, name: "Kafka" },
  { re: /\bspark\b/i, name: "Apache Spark" },
  { re: /\bairflow\b/i, name: "Airflow" },
  { re: /\bpandas\b|\bnumpy\b/i, name: "Data analysis (Python)" },
  { re: /\bscikit-?learn\b|\bxgboost\b/i, name: "Machine learning" },
  { re: /\btensorflow\b|\bpytorch\b|\bdeep learning\b/i, name: "Deep learning" },
  { re: /\bllm\b|\blangchain\b|\bopenai\b|\brag\b/i, name: "LLM / AI engineering" },
  { re: /\bpower ?bi\b|\btableau\b/i, name: "BI & dashboards" },
  { re: /\bfigma\b/i, name: "Figma" },
  { re: /\bagile\b|\bscrum\b/i, name: "Agile delivery" },
  { re: /\bstakeholder/i, name: "Stakeholder communication" },
  { re: /\bmentor(?:ed|ing|ship)?\b/i, name: "Mentoring" },
  { re: /\bled a team\b|\bteam lead\b|\bleadership\b/i, name: "Team leadership" },
];

const SECTION_ALIASES: Array<{ key: ResumeSection; re: RegExp }> = [
  { key: "summary", re: /^(professional\s+)?(summary|profile|objective|about)\b/i },
  { key: "skills", re: /^(technical\s+)?(skills|technologies|tech stack|core competencies)\b/i },
  { key: "experience", re: /^(work\s+)?(experience|employment|professional experience|career)\b/i },
  { key: "projects", re: /^(projects|personal projects|selected projects|key projects)\b/i },
  { key: "achievements", re: /^(achievements|accomplishments|awards|honors|honours)\b/i },
  { key: "certifications", re: /^(certifications?|licenses?|credentials)\b/i },
  { key: "learning", re: /^(courses|training|learning|education|professional development)\b/i },
];

export type ResumeSection =
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "achievements"
  | "certifications"
  | "learning"
  | "other";

export interface ResumeExtraction {
  jobTitle: string | null;
  summary: string | null;
  skills: string[];
  projects: Array<{ title: string; description: string; technologies: string[] }>;
  achievements: Array<{ title: string; impact: string | null }>;
  certifications: Array<{ name: string; issuer: string | null }>;
  learning: Array<{ course: string; provider: string | null }>;
  portfolioUrl: string | null;
}

const TITLE_RE =
  /\b((?:senior|lead|principal|staff|junior|associate)?\s*(?:software|frontend|front-end|backend|back-end|full[- ]stack|data|machine learning|ml|devops|cloud|qa|mobile|android|ios|platform|product|business|security)?\s*(?:engineer|developer|scientist|analyst|designer|manager|architect|consultant|intern))\b/i;

/** Splits resume text into its labelled sections. */
export function sectionsOf(text: string): Record<ResumeSection, string[]> {
  const out: Record<ResumeSection, string[]> = {
    summary: [],
    skills: [],
    experience: [],
    projects: [],
    achievements: [],
    certifications: [],
    learning: [],
    other: [],
  };
  let current: ResumeSection = "other";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, " ").trim();
    if (!line) continue;
    const header = line.replace(/[:•\-–—]+$/g, "").trim();
    const match =
      header.length <= 48 ? SECTION_ALIASES.find((section) => section.re.test(header)) : undefined;
    if (match) {
      current = match.key;
      continue;
    }
    out[current].push(line);
  }
  return out;
}

/** Technologies literally named anywhere in the resume. */
export function techInResume(text: string): string[] {
  return RESUME_TECH.filter((entry) => entry.re.test(text)).map((entry) => entry.name);
}

function cleanBullet(line: string): string {
  return line.replace(/^[•·\-–—*▪]+\s*/, "").trim();
}

function firstLink(text: string, exclude: RegExp): string | null {
  const links = text.match(/https?:\/\/[^\s)<>",]+/gi) ?? [];
  // Bare domains, but never the host of an email address.
  const bare = [...text.matchAll(/(?<![@\w.])[a-z0-9-]+\.(?:dev|me|io|com|net|app|site|page|xyz)\/?[^\s,;)]*/gi)].map(
    (match) => match[0],
  );
  for (const link of [...links, ...bare]) {
    if (exclude.test(link)) continue;
    if (/@/.test(link)) continue;
    return link.replace(/[.,;]$/, "");
  }
  return null;
}

/**
 * Reads a resume with no AI involved. Only returns things written in the text;
 * it never guesses employers, numbers or capabilities.
 */
export function deterministicExtraction(text: string): ResumeExtraction {
  const sections = sectionsOf(text);
  const skills = techInResume(text);

  const projects = sections.projects
    .map(cleanBullet)
    .filter((line) => line.length > 8)
    .slice(0, 8)
    .map((line) => {
      const [head, ...rest] = line.split(/[–—:|]\s*/);
      const title = (head ?? line).slice(0, 120).trim();
      const description = rest.join(" — ").trim() || line;
      return { title, description: description.slice(0, 600), technologies: techInResume(line) };
    })
    .filter((project) => project.title.length > 2);

  const achievements = sections.achievements
    .map(cleanBullet)
    .filter((line) => line.length > 8)
    .slice(0, 8)
    .map((line) => ({ title: line.slice(0, 160), impact: null }));

  const certLines = [
    ...sections.certifications.map(cleanBullet),
    ...sections.other.filter((line) => /\bcertif/i.test(line)).map(cleanBullet),
  ];
  const certifications = [...new Set(certLines)]
    .filter((line) => line.length > 4)
    .slice(0, 10)
    .map((line) => {
      const issuer = /\b(?:by|from|-|–)\s*([A-Z][\w .&]{2,40})$/.exec(line)?.[1] ?? null;
      return { name: line.replace(/\s*[-–]\s*[^-–]+$/, "").slice(0, 160), issuer };
    });

  const learning = sections.learning
    .map(cleanBullet)
    .filter((line) => line.length > 6 && !/^\d/.test(line))
    .slice(0, 10)
    .map((line) => {
      const provider = /\b(?:at|by|from|,|–|-)\s*([A-Z][\w .&]{2,40})$/.exec(line)?.[1] ?? null;
      return { course: line.slice(0, 160), provider };
    });

  const summaryText = sections.summary.join(" ").trim();
  const headSlice = text.slice(0, 600);

  return {
    jobTitle: TITLE_RE.exec(headSlice)?.[1]?.replace(/\s+/g, " ").trim() ?? null,
    summary: summaryText ? summaryText.slice(0, 900) : null,
    skills,
    projects,
    achievements,
    certifications,
    learning,
    portfolioUrl: firstLink(text, /github\.com|linkedin\.com|mailto:|twitter\.com|x\.com/i),
  };
}

/** Coerces an AI extraction payload into the shape above, dropping anything unusable. */
export function normalizeExtraction(input: unknown, text: string): ResumeExtraction | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as any;
  const strings = (value: unknown, limit: number) =>
    Array.isArray(value)
      ? [...new Set(value.map((v) => String(v ?? "").trim()).filter(Boolean))].slice(0, limit)
      : [];
  const lower = text.toLowerCase();
  // Only keep skills that actually appear in the resume text.
  const skills = strings(raw.skills, 30).filter((skill) => lower.includes(skill.toLowerCase()));

  const list = <T>(value: unknown, map: (row: any) => T | null, limit: number): T[] =>
    Array.isArray(value)
      ? (value
          .map((row) => (row && typeof row === "object" ? map(row as any) : null))
          .filter(Boolean) as T[]).slice(0, limit)
      : [];

  const str = (value: unknown, limit: number) => {
    const out = String(value ?? "").trim();
    return out ? out.slice(0, limit) : "";
  };

  return {
    jobTitle: str(raw.job_title ?? raw.jobTitle, 120) || null,
    summary: str(raw.summary, 900) || null,
    skills,
    projects: list(
      raw.projects,
      (row) => {
        const title = str(row.title, 120);
        return title
          ? {
              title,
              description: str(row.description, 600),
              technologies: strings(row.technologies, 12),
            }
          : null;
      },
      8,
    ),
    achievements: list(
      raw.achievements,
      (row) => {
        const title = str(row.title, 160);
        return title ? { title, impact: str(row.impact, 300) || null } : null;
      },
      8,
    ),
    certifications: list(
      raw.certifications,
      (row) => {
        const name = str(row.name, 160);
        return name ? { name, issuer: str(row.issuer, 120) || null } : null;
      },
      10,
    ),
    learning: list(
      raw.learning ?? raw.courses,
      (row) => {
        const course = str(row.course ?? row.title, 160);
        return course ? { course, provider: str(row.provider, 120) || null } : null;
      },
      10,
    ),
    portfolioUrl: str(raw.portfolio_url ?? raw.portfolioUrl, 300) || null,
  };
}

/** Rough proficiency from how often a technology is mentioned. */
export function mentionStrength(text: string, skill: string): { proficiency: number; confidence: number; count: number } {
  const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const count = (text.match(new RegExp(escaped, "gi")) ?? []).length;
  const proficiency = count >= 4 ? 3 : 2;
  const confidence = Math.min(0.7, 0.4 + count * 0.05);
  return { proficiency, confidence, count };
}
