// Browser-safe helpers that explain *where* evidence came from.
import type { RoleLike, SkillHolding } from "./talent";

export type EvidenceSource =
  | "GitHub projects"
  | "Interview responses"
  | "Learning history"
  | "Certifications"
  | "Profile & projects";

export function sourceBucket(source: string): EvidenceSource {
  const value = source.toLowerCase();
  if (value.includes("github")) return "GitHub projects";
  if (value.includes("assessment") || value.includes("discovery") || value.includes("interview"))
    return "Interview responses";
  if (value.includes("learning") || value.includes("course")) return "Learning history";
  if (value.includes("cert")) return "Certifications";
  return "Profile & projects";
}

export interface SourceShare {
  source: EvidenceSource;
  count: number;
  share: number;
}

/** Share of the evidence behind a match, by where each signal came from. */
export function evidenceMix(skills: SkillHolding[]): SourceShare[] {
  const tally = new Map<EvidenceSource, number>();
  for (const skill of skills) {
    const bucket = sourceBucket(skill.source);
    tally.set(bucket, (tally.get(bucket) ?? 0) + 1);
  }
  const total = [...tally.values()].reduce((sum, n) => sum + n, 0);
  if (!total) return [];
  return [...tally.entries()]
    .map(([source, count]) => ({ source, count, share: count / total }))
    .sort((a, b) => b.share - a.share);
}

const norm = (value: string) => value.trim().toLowerCase();

export interface MatchBreakdown {
  strong: SkillHolding[];
  transferable: Array<{ skill: string; via: string }>;
  gaps: string[];
}

/**
 * Splits a role's requirements into evidenced strengths, transferable signals
 * (a potential capability points at it, but the skill itself is not recorded)
 * and outright gaps.
 */
export function matchBreakdown(
  role: RoleLike,
  skills: SkillHolding[],
  capabilities: string[],
): MatchBreakdown {
  const byName = new Map(skills.map((s) => [norm(s.name), s]));
  const wanted = [...role.required_skills, ...role.preferred_skills];

  const strong: SkillHolding[] = [];
  const transferable: Array<{ skill: string; via: string }> = [];
  const gaps: string[] = [];

  for (const name of wanted) {
    const held = byName.get(norm(name));
    if (held && held.proficiency >= 3) {
      strong.push(held);
      continue;
    }
    const via = capabilities.find(
      (c) => norm(c).includes(norm(name)) || norm(name).includes(norm(c)),
    );
    if (held || via) {
      transferable.push({ skill: name, via: via ?? `recorded at level ${held?.proficiency}/5` });
      continue;
    }
    gaps.push(name);
  }
  return { strong, transferable, gaps };
}

export interface GithubEvidenceRow {
  id: string;
  repo_name: string;
  repo_url: string;
  is_private: boolean;
  primary_language: string | null;
  languages: string[];
  detected_tech: string[];
  stars: number;
  last_pushed_at: string | null;
  summary: string | null;
}

export interface GithubStats {
  repos: number;
  languages: string[];
  activeProjects: number;
  stars: number;
  signals: Array<{ tech: string; repos: number; strength: number }>;
}

export function githubStats(rows: GithubEvidenceRow[]): GithubStats {
  const languages = new Set<string>();
  const tally = new Map<string, number>();
  let activeProjects = 0;
  let stars = 0;
  const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 182;

  for (const row of rows) {
    for (const language of row.languages) languages.add(language);
    for (const tech of row.detected_tech) tally.set(tech, (tally.get(tech) ?? 0) + 1);
    stars += row.stars ?? 0;
    if (row.last_pushed_at && new Date(row.last_pushed_at).getTime() > sixMonthsAgo) {
      activeProjects += 1;
    }
  }

  const signals = [...tally.entries()]
    .map(([tech, repos]) => ({
      tech,
      repos,
      strength: rows.length ? Math.min(1, repos / rows.length) : 0,
    }))
    .sort((a, b) => b.repos - a.repos || a.tech.localeCompare(b.tech));

  return { repos: rows.length, languages: [...languages], activeProjects, stars, signals };
}
