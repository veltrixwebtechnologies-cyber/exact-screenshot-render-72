// Shared, browser-safe talent logic: role matching, gap analysis, labels.

export type MatchBand = "Strong match" | "Good match" | "Partial match" | "Early match";

export interface RoleLike {
  id: string;
  title: string;
  department: string | null;
  description: string | null;
  required_skills: string[];
  preferred_skills: string[];
  experience_required: number | null;
}

export interface SkillHolding {
  name: string;
  proficiency: number;
  confidence: number;
  source: string;
  evidence: string | null;
}

export interface RoleMatch {
  role: RoleLike;
  score: number;
  band: MatchBand;
  matched: string[];
  missing: string[];
  preferredMatched: string[];
  preferredMissing: string[];
  capabilitySupport: string[];
}

const norm = (value: string) => value.trim().toLowerCase();

export function matchBand(score: number): MatchBand {
  if (score >= 0.78) return "Strong match";
  if (score >= 0.58) return "Good match";
  if (score >= 0.35) return "Partial match";
  return "Early match";
}

export function bandTone(band: MatchBand): "success" | "primary" | "warning" | "muted" {
  if (band === "Strong match") return "success";
  if (band === "Good match") return "primary";
  if (band === "Partial match") return "warning";
  return "muted";
}

/**
 * Explainable match: 70% weight on required skills held, 20% on preferred
 * skills, 10% on potential capabilities that relate to the role's requirements.
 * Deliberately coarse — surfaced as a band, not a precise science.
 */
export function matchRole(
  role: RoleLike,
  skills: SkillHolding[],
  capabilities: string[] = [],
): RoleMatch {
  const held = new Set(skills.map((s) => norm(s.name)));
  const capabilitySet = capabilities.map(norm);

  const matched = role.required_skills.filter((s) => held.has(norm(s)));
  const missing = role.required_skills.filter((s) => !held.has(norm(s)));
  const preferredMatched = role.preferred_skills.filter((s) => held.has(norm(s)));
  const preferredMissing = role.preferred_skills.filter((s) => !held.has(norm(s)));

  const capabilitySupport = missing.filter((s) =>
    capabilitySet.some((c) => c.includes(norm(s)) || norm(s).includes(c)),
  );

  const requiredRatio = role.required_skills.length
    ? matched.length / role.required_skills.length
    : 0;
  const preferredRatio = role.preferred_skills.length
    ? preferredMatched.length / role.preferred_skills.length
    : 0;
  const capabilityRatio = role.required_skills.length
    ? capabilitySupport.length / role.required_skills.length
    : 0;

  const score = Math.min(
    1,
    requiredRatio * 0.7 + preferredRatio * 0.2 + capabilityRatio * 0.1,
  );

  return {
    role,
    score,
    band: matchBand(score),
    matched,
    missing,
    preferredMatched,
    preferredMissing,
    capabilitySupport,
  };
}

export interface SkillGap {
  skill: string;
  currentLevel: number;
  requiredLevel: number;
  gap: number;
  priority: "High" | "Medium" | "Low";
}

export function skillGaps(role: RoleLike, skills: SkillHolding[]): SkillGap[] {
  const byName = new Map(skills.map((s) => [norm(s.name), s]));
  const rows: SkillGap[] = [];

  for (const name of role.required_skills) {
    const current = byName.get(norm(name))?.proficiency ?? 0;
    const required = 4;
    rows.push({
      skill: name,
      currentLevel: current,
      requiredLevel: required,
      gap: Math.max(0, required - current),
      priority: current === 0 ? "High" : required - current >= 2 ? "Medium" : "Low",
    });
  }
  for (const name of role.preferred_skills) {
    const current = byName.get(norm(name))?.proficiency ?? 0;
    const required = 3;
    rows.push({
      skill: name,
      currentLevel: current,
      requiredLevel: required,
      gap: Math.max(0, required - current),
      priority: current === 0 ? "Medium" : "Low",
    });
  }
  return rows.sort((a, b) => b.gap - a.gap);
}

export function confidenceLabel(confidence: number): "High" | "Moderate" | "Emerging" {
  if (confidence >= 0.75) return "High";
  if (confidence >= 0.6) return "Moderate";
  return "Emerging";
}

export function yearsSince(date: string | null | undefined): number | null {
  if (!date) return null;
  const then = new Date(date).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.round(((Date.now() - then) / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10);
}

export const CAPABILITY_SIGNALS = [
  "Leadership",
  "Communication",
  "Mentoring",
  "Decision Making",
  "Problem Solving",
  "Creativity",
  "Planning",
  "Research",
  "Team Coordination",
  "Customer Understanding",
  "Ownership",
  "Strategic Thinking",
] as const;
