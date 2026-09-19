// Browser-safe evidence validation.
// It never scores the person — it scores how well the *evidence* currently
// supports what the profile claims, and always says why it is good and what is
// missing. Bands only; no single "talent number".

import type { SkillHolding } from "./talent";
import type { EvidenceStrength } from "./portfolio";

export type ScoreBand = "strong" | "developing" | "thin";

export const BAND_LABEL: Record<ScoreBand, string> = {
  strong: "Strong evidence",
  developing: "Partial evidence",
  thin: "Needs more evidence",
};

export const BAND_TONE: Record<ScoreBand, "success" | "warning" | "outline"> = {
  strong: "success",
  developing: "warning",
  thin: "outline",
};

export interface DimensionScore {
  label: string;
  band: ScoreBand;
  summary: string;
  /** Why this part is good. */
  good: string[];
  /** Why this part is not good yet. */
  bad: string[];
}

export interface EvidenceScore {
  band: ScoreBand;
  headline: string;
  dimensions: DimensionScore[];
  /** Strongest parts of the profile, ordered best first. */
  strengths: string[];
  /** Weakest parts, with what would fix each one. */
  weaknesses: string[];
  /** How many of the evidence sources are validated. */
  validated: number;
  total: number;
}

export interface ProfileEvidenceInput {
  resumes: number;
  skills: SkillHolding[];
  insights: Array<{ confidence: number; evidence: string[]; source: string }>;
  projects: number;
  achievements: number;
  certifications: number;
  learning: number;
  githubRepos: number;
  githubLanguages: number;
  activeRepos: number;
  portfolioChecked: boolean;
  portfolioClaims: Array<{ strength: EvidenceStrength }>;
}

const band = (strong: boolean, developing: boolean): ScoreBand =>
  strong ? "strong" : developing ? "developing" : "thin";

function resumeDimension(input: ProfileEvidenceInput): DimensionScore {
  const rich = input.projects + input.achievements + input.certifications + input.learning;
  const value = band(input.resumes > 0 && rich >= 4, input.resumes > 0);
  return {
    label: "Résumé & recorded history",
    band: value,
    summary: input.resumes
      ? `${input.resumes} résumé${input.resumes === 1 ? "" : "s"} read · ${rich} records extracted`
      : "No résumé uploaded",
    good: [
      ...(input.resumes ? ["A résumé has been read, so your written history is on record."] : []),
      ...(input.projects ? [`${input.projects} project${input.projects === 1 ? "" : "s"} recorded as delivery evidence.`] : []),
      ...(input.achievements ? [`${input.achievements} achievement${input.achievements === 1 ? "" : "s"} give impact evidence.`] : []),
    ],
    bad: [
      ...(input.resumes ? [] : ["Nothing has been read yet — upload a résumé so everything else can be built from it."]),
      ...(input.projects === 0 ? ["No projects recorded, so delivery cannot be checked."] : []),
      ...(input.achievements === 0 ? ["No achievements recorded, so impact is unproven."] : []),
    ],
  };
}

function githubDimension(input: ProfileEvidenceInput): DimensionScore {
  const value = band(
    input.githubRepos >= 4 && input.activeRepos >= 1,
    input.githubRepos >= 1,
  );
  return {
    label: "Code evidence (GitHub)",
    band: value,
    summary: input.githubRepos
      ? `${input.githubRepos} repositories analysed · ${input.githubLanguages} languages · ${input.activeRepos} active`
      : "GitHub not connected",
    good: [
      ...(input.githubRepos ? [`${input.githubRepos} authorized repositor${input.githubRepos === 1 ? "y" : "ies"} were analysed, so technology claims can be cross-checked.`] : []),
      ...(input.activeRepos ? [`${input.activeRepos} project${input.activeRepos === 1 ? " has" : "s have"} recent activity.`] : []),
      ...(input.githubLanguages >= 3 ? [`Breadth across ${input.githubLanguages} languages.`] : []),
    ],
    bad: [
      ...(input.githubRepos ? [] : ["GitHub is not connected, so nothing you built can be independently checked."]),
      ...(input.githubRepos > 0 && input.githubRepos < 4 ? ["Only a few repositories are visible — a wider sample would make the signals steadier."] : []),
      ...(input.githubRepos > 0 && input.activeRepos === 0 ? ["No repository has been updated in the last six months, so the evidence is dated."] : []),
    ],
  };
}

function portfolioDimension(input: ProfileEvidenceInput): DimensionScore {
  const strong = input.portfolioClaims.filter((c) => c.strength === "strong").length;
  const moderate = input.portfolioClaims.filter((c) => c.strength === "moderate").length;
  const unproven = input.portfolioClaims.filter((c) => c.strength === "needs_evidence").length;
  const total = input.portfolioClaims.length;
  const value = band(
    total > 0 && strong >= Math.ceil(total / 2),
    input.portfolioChecked && total > 0,
  );
  return {
    label: "Portfolio claims",
    band: value,
    summary: input.portfolioChecked
      ? `${total} claim${total === 1 ? "" : "s"} checked · ${strong} supported · ${unproven} unproven`
      : "No portfolio checked",
    good: [
      ...(strong ? [`${strong} claim${strong === 1 ? " is" : "s are"} backed by a matching repository and the technologies really appear in the code.`] : []),
      ...(moderate ? [`${moderate} claim${moderate === 1 ? " has" : "s have"} partial support.`] : []),
    ],
    bad: [
      ...(input.portfolioChecked ? [] : ["No portfolio submitted, so written claims have not been validated at all."]),
      ...(unproven ? [`${unproven} claim${unproven === 1 ? "" : "s"} could not be supported by your connected evidence — these read as inflated until you demonstrate them.`] : []),
      ...(input.portfolioChecked && total === 0 ? ["No checkable claims were found on the page."] : []),
    ],
  };
}

function interviewDimension(input: ProfileEvidenceInput): DimensionScore {
  const interviewBacked = input.insights.filter((i) => i.evidence.length >= 2).length;
  const confident = input.insights.filter((i) => i.confidence >= 0.7).length;
  const value = band(
    input.insights.length >= 3 && interviewBacked >= 2,
    input.insights.length >= 1,
  );
  return {
    label: "Discovery interview",
    band: value,
    summary: input.insights.length
      ? `${input.insights.length} potential capabilit${input.insights.length === 1 ? "y" : "ies"} · ${interviewBacked} with multiple evidence lines`
      : "Interview not completed",
    good: [
      ...(input.insights.length ? [`${input.insights.length} potential capabilit${input.insights.length === 1 ? "y was" : "ies were"} identified from your own records.`] : []),
      ...(interviewBacked ? [`${interviewBacked} of them rest on more than one piece of evidence.`] : []),
      ...(confident ? [`${confident} reached higher confidence.`] : []),
    ],
    bad: [
      ...(input.insights.length ? [] : ["The interview has not been completed, so nothing has been validated in your own words."]),
      ...(input.insights.length > 0 && interviewBacked < 2 ? ["Most capabilities rest on a single piece of evidence — one answer is not proof."] : []),
      ...(input.insights.length > 0 && confident === 0 ? ["Confidence stays low across the board; more sources would raise it."] : []),
    ],
  };
}

function skillDimension(input: ProfileEvidenceInput): DimensionScore {
  const evidenced = input.skills.filter((s) => Boolean(s.evidence)).length;
  const deep = input.skills.filter((s) => s.proficiency >= 4).length;
  const sources = new Set(input.skills.map((s) => s.source)).size;
  const value = band(
    input.skills.length >= 8 && sources >= 2 && deep >= 2,
    input.skills.length >= 3,
  );
  return {
    label: "Skill profile depth",
    band: value,
    summary: `${input.skills.length} skills · ${sources} source${sources === 1 ? "" : "s"} · ${evidenced} with written evidence`,
    good: [
      ...(input.skills.length >= 3 ? [`${input.skills.length} skills recorded.`] : []),
      ...(sources >= 2 ? [`They come from ${sources} independent sources, which is stronger than any single one.`] : []),
      ...(deep ? [`${deep} skill${deep === 1 ? " is" : "s are"} recorded at a deep level.`] : []),
    ],
    bad: [
      ...(input.skills.length < 3 ? ["Too few skills recorded to match roles reliably."] : []),
      ...(sources < 2 ? ["All skills come from one source — add code, learning or interview evidence to corroborate them."] : []),
      ...(deep === 0 ? ["Nothing is recorded at a deep level yet, so senior matches stay out of reach."] : []),
      ...(evidenced < input.skills.length ? [`${input.skills.length - evidenced} skill${input.skills.length - evidenced === 1 ? " has" : "s have"} no written evidence attached.`] : []),
    ],
  };
}

function learningDimension(input: ProfileEvidenceInput): DimensionScore {
  const total = input.learning + input.certifications;
  const value = band(total >= 4, total >= 1);
  return {
    label: "Learning & certifications",
    band: value,
    summary: `${input.learning} course${input.learning === 1 ? "" : "s"} · ${input.certifications} certification${input.certifications === 1 ? "" : "s"}`,
    good: [
      ...(input.certifications ? [`${input.certifications} certification${input.certifications === 1 ? "" : "s"} give externally issued evidence.`] : []),
      ...(input.learning ? [`${input.learning} completed course${input.learning === 1 ? "" : "s"} show continuous learning.`] : []),
    ],
    bad: [
      ...(total === 0 ? ["No learning or certifications recorded, so growth over time cannot be seen."] : []),
      ...(input.certifications === 0 && input.learning > 0 ? ["No certifications yet — these are the easiest evidence to verify externally."] : []),
    ],
  };
}

const ORDER: Record<ScoreBand, number> = { strong: 2, developing: 1, thin: 0 };

export function profileEvidenceScore(input: ProfileEvidenceInput): EvidenceScore {
  const dimensions = [
    resumeDimension(input),
    githubDimension(input),
    portfolioDimension(input),
    interviewDimension(input),
    skillDimension(input),
    learningDimension(input),
  ];

  const strongCount = dimensions.filter((d) => d.band === "strong").length;
  const thinCount = dimensions.filter((d) => d.band === "thin").length;

  const overall: ScoreBand =
    strongCount >= 4 && thinCount <= 1
      ? "strong"
      : strongCount + dimensions.filter((d) => d.band === "developing").length >= 3
        ? "developing"
        : "thin";

  const headline =
    overall === "strong"
      ? "Your evidence supports what your profile claims across most sources."
      : overall === "developing"
        ? "There is real evidence here, but several claims still rest on a single source."
        : "There is not enough evidence yet to support the capabilities on this profile.";

  const ranked = [...dimensions].sort((a, b) => ORDER[b.band] - ORDER[a.band]);

  return {
    band: overall,
    headline,
    dimensions,
    strengths: ranked
      .filter((d) => d.band !== "thin")
      .flatMap((d) => d.good.slice(0, 1).map((line) => `${d.label}: ${line}`)),
    weaknesses: [...dimensions]
      .sort((a, b) => ORDER[a.band] - ORDER[b.band])
      .flatMap((d) => d.bad.slice(0, 1).map((line) => `${d.label}: ${line}`)),
    validated: strongCount,
    total: dimensions.length,
  };
}
