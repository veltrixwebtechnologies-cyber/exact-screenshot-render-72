// Browser-safe portfolio verification helpers.
// The point is never "does a portfolio exist" — it is whether each claim on the
// page has supporting evidence in the employee's authorized GitHub data.

export type EvidenceStrength = "strong" | "moderate" | "needs_evidence";

export interface ClaimCheck {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface PortfolioClaim {
  claim: string;
  technologies: string[];
  repo_name: string | null;
  repo_url: string | null;
  demo_url: string | null;
  strength: EvidenceStrength;
  checks: ClaimCheck[];
  note: string;
}

export interface PortfolioVerificationRow {
  id: string;
  employee_id: string;
  portfolio_url: string;
  page_title: string | null;
  overall_strength: EvidenceStrength;
  claims: PortfolioClaim[];
  detected_repo_links: string[];
  detected_demo_links: string[];
  notes: string | null;
  checked_at: string;
}

export const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  strong: "Strong evidence",
  moderate: "Partial evidence",
  needs_evidence: "Needs more evidence",
};

export const STRENGTH_TONE: Record<EvidenceStrength, "success" | "warning" | "outline"> = {
  strong: "success",
  moderate: "warning",
  needs_evidence: "outline",
};

/** Technologies we can meaningfully cross-check against repository evidence. */
export const CLAIM_TECH = [
  "React", "Next.js", "Vue", "Angular", "Svelte", "TypeScript", "JavaScript", "Node.js",
  "Express", "NestJS", "Python", "Django", "Flask", "FastAPI", "Java", "Spring", "Go", "Rust",
  "C++", "C#", ".NET", "PHP", "Laravel", "Ruby", "Rails", "Kotlin", "Swift", "Flutter", "Dart",
  "React Native", "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Supabase", "Firebase",
  "GraphQL", "REST API", "WebSockets", "Socket.IO", "Docker", "Kubernetes", "AWS", "GCP",
  "Azure", "Terraform", "Tailwind CSS", "Prisma", "pgvector", "LangChain", "OpenAI", "RAG",
  "TensorFlow", "PyTorch", "scikit-learn", "Pandas", "NumPy", "Kafka", "RabbitMQ", "Elasticsearch",
  "Machine Learning", "Computer Vision", "NLP",
];

const BUILD_VERBS = [
  "built", "build", "developed", "created", "designed", "implemented", "engineered",
  "architected", "shipped", "led", "deployed", "optimized", "optimised", "integrated",
];

/** Strips tags/scripts out of fetched HTML and returns readable text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

export function pageTitle(html: string): string | null {
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  const value = match?.[1]?.replace(/\s+/g, " ").trim();
  return value ? value.slice(0, 200) : null;
}

export function extractLinks(html: string, baseUrl: string): string[] {
  const links = new Set<string>();
  const re = /href\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const raw = match[1];
    if (!raw) continue;
    try {
      const resolved = new URL(raw, baseUrl);
      if (resolved.protocol === "http:" || resolved.protocol === "https:") {
        links.add(resolved.toString());
      }
    } catch {
      /* ignore unparseable hrefs */
    }
  }
  return [...links].slice(0, 200);
}

/** github.com/owner/repo links only (not profile or gist links). */
export function githubRepoLinks(links: string[]): Array<{ url: string; owner: string; repo: string }> {
  const out: Array<{ url: string; owner: string; repo: string }> = [];
  const seen = new Set<string>();
  for (const link of links) {
    const match = /^https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+)\/?$/.exec(
      link,
    );
    const owner = match?.[1];
    const repo = match?.[2];
    if (!owner || !repo) continue;
    const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url: `https://github.com/${owner}/${repo}`, owner, repo });
  }
  return out;
}

export function demoLinks(links: string[], portfolioUrl: string): string[] {
  let host = "";
  try {
    host = new URL(portfolioUrl).hostname;
  } catch {
    /* ignore */
  }
  const skip = ["github.com", "linkedin.com", "twitter.com", "x.com", "facebook.com", "instagram.com", "medium.com", "mailto"];
  return links
    .filter((link) => {
      try {
        const url = new URL(link);
        if (url.hostname === host) return false;
        return !skip.some((domain) => url.hostname.includes(domain));
      } catch {
        return false;
      }
    })
    .slice(0, 12);
}

export function technologiesIn(text: string): string[] {
  const lower = text.toLowerCase();
  return CLAIM_TECH.filter((tech) => lower.includes(tech.toLowerCase()));
}

/**
 * Deterministic claim extraction used when the AI provider is unavailable:
 * sentences that describe building something with a recognisable technology.
 */
export function candidateClaims(text: string, limit = 8): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length >= 25 && sentence.length <= 260);

  const claims: string[] = [];
  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const hasVerb = BUILD_VERBS.some((verb) => lower.includes(verb));
    const hasTech = technologiesIn(sentence).length > 0;
    if (!hasVerb && !hasTech) continue;
    if (claims.some((existing) => existing.toLowerCase() === lower)) continue;
    claims.push(sentence);
    if (claims.length >= limit) break;
  }
  return claims;
}

export function strengthFromChecks(checks: ClaimCheck[]): EvidenceStrength {
  const passed = (prefix: string) =>
    checks.some((check) => check.label.startsWith(prefix) && check.passed);
  const repoFound = passed("Matching repository");
  const owned = passed("Repository belongs");
  const techBacked = passed("Technology evidence");
  if (repoFound && owned && techBacked) return "strong";
  if (repoFound && owned) return "moderate";
  if (repoFound || techBacked) return "moderate";
  return "needs_evidence";
}

export function overallStrength(claims: PortfolioClaim[]): EvidenceStrength {
  if (!claims.length) return "needs_evidence";
  const strong = claims.filter((claim) => claim.strength === "strong").length;
  const moderate = claims.filter((claim) => claim.strength === "moderate").length;
  if (strong >= Math.ceil(claims.length / 2)) return "strong";
  if (strong + moderate > 0) return "moderate";
  return "needs_evidence";
}

/** Rejects non-public and non-http targets before any fetch happens. */
export function safePortfolioUrl(input: string): URL {
  const trimmed = input.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("That does not look like a valid web address.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http and https links can be checked.");
  }
  const host = url.hostname.toLowerCase();
  const blocked =
    host === "localhost" ||
    host.endsWith(".local") ||
    host === "::1" ||
    host === "0.0.0.0" ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (blocked) throw new Error("Private or local addresses cannot be checked.");
  return url;
}
