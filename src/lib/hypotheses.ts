// Evidence -> capability hypotheses -> targeted interview questions.
// Nothing here concludes a person HAS a capability: each hypothesis is a
// possibility that still needs validation in the interview.

export interface EvidenceItem {
  source:
    | "GitHub"
    | "Projects"
    | "Achievements"
    | "Certifications"
    | "Learning"
    | "Resume"
    | "Portfolio";
  ref: string;
  detail: string;
}

export interface CapabilityHypothesis {
  capability: string;
  /** What is still unknown and therefore worth asking about. */
  needs: string;
  evidence: EvidenceItem[];
}

export interface GithubRepoEvidence {
  repo_name: string;
  repo_url?: string;
  detected_tech?: string[] | null;
  languages?: string[] | null;
  primary_language?: string | null;
  summary?: string | null;
  last_pushed_at?: string | null;
  is_private?: boolean | null;
}

export interface HypothesisInput {
  github: GithubRepoEvidence[];
  projects: Array<{ title: string; role?: string | null; technologies?: string[] | null; description?: string | null }>;
  achievements: Array<{ title: string; impact?: string | null }>;
  certifications: Array<{ name: string; issuer?: string | null }>;
  learning: Array<{ course: string; skills_gained?: string[] | null }>;
  resumeText?: string | null;
  /** Claims read from a verified portfolio, with how strong their evidence is. */
  portfolioClaims?: Array<{
    claim: string;
    strength: string;
    repo_name?: string | null;
    technologies?: string[] | null;
  }>;
}

const SYSTEM_TECH = [
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Supabase",
  "Firebase",
  "Redis",
  "Docker",
  "Kubernetes",
  "AWS",
  "GraphQL",
  "FastAPI",
  "Express",
  "Django",
  "Spring",
  "Node.js",
];

const AI_TECH = ["OpenAI", "LangChain", "TensorFlow", "PyTorch", "Transformers", "scikit-learn", "Pandas"];

function techOf(repo: GithubRepoEvidence): string[] {
  return [...(repo.detected_tech ?? []), ...(repo.languages ?? [])];
}

export function deriveHypotheses(input: HypothesisInput): CapabilityHypothesis[] {
  const out: CapabilityHypothesis[] = [];

  const richRepos = input.github.filter((r) => {
    const tech = techOf(r);
    return tech.length >= 3 && tech.some((t) => SYSTEM_TECH.includes(t));
  });

  if (richRepos.length) {
    out.push({
      capability: "System Thinking",
      needs:
        "Whether the person designed how these parts fit together, or worked inside a design someone else set.",
      evidence: richRepos.slice(0, 3).map((r) => ({
        source: "GitHub" as const,
        ref: r.repo_name,
        detail: `Combines ${techOf(r).slice(0, 6).join(", ")}`,
      })),
    });
    out.push({
      capability: "Technical Implementation",
      needs: "Which parts they personally implemented, and the reasoning behind their technical choices.",
      evidence: richRepos.slice(0, 3).map((r) => ({
        source: "GitHub" as const,
        ref: r.repo_name,
        detail: r.summary?.slice(0, 160) ?? `Primary language ${r.primary_language ?? "unknown"}`,
      })),
    });
  }

  if (input.github.length >= 3) {
    out.push({
      capability: "Ownership",
      needs: "Whether these repositories were carried through to something used, or stopped at exploration.",
      evidence: input.github.slice(0, 4).map((r) => ({
        source: "GitHub" as const,
        ref: r.repo_name,
        detail: r.last_pushed_at ? `Last activity ${r.last_pushed_at.slice(0, 10)}` : "Repository analysed",
      })),
    });
  }

  const aiRepos = input.github.filter((r) => techOf(r).some((t) => AI_TECH.includes(t)));
  if (aiRepos.length) {
    out.push({
      capability: "Applied AI Engineering",
      needs: "Which layer they built — model/API integration, prompting, retrieval, or the surrounding app.",
      evidence: aiRepos.slice(0, 3).map((r) => ({
        source: "GitHub" as const,
        ref: r.repo_name,
        detail: `AI-related stack: ${techOf(r).filter((t) => AI_TECH.includes(t)).join(", ")}`,
      })),
    });
  }

  const leadProjects = input.projects.filter((p) =>
    /lead|owner|manager|architect|principal/i.test(p.role ?? ""),
  );
  if (leadProjects.length) {
    out.push({
      capability: "Leadership",
      needs: "Whether the role involved directing people and decisions, or was a senior individual contribution.",
      evidence: leadProjects.slice(0, 3).map((p) => ({
        source: "Projects" as const,
        ref: p.title,
        detail: `Recorded role: ${p.role}`,
      })),
    });
  }

  if (input.projects.length >= 2) {
    out.push({
      capability: "Problem Solving",
      needs: "How they isolate a problem when several moving parts could be the cause.",
      evidence: input.projects.slice(0, 3).map((p) => ({
        source: "Projects" as const,
        ref: p.title,
        detail: (p.description ?? (p.technologies ?? []).join(", ")).slice(0, 160),
      })),
    });
  }

  if (input.achievements.length) {
    out.push({
      capability: "Impact Orientation",
      needs: "Their personal contribution to the recorded outcome versus the team's.",
      evidence: input.achievements.slice(0, 3).map((a) => ({
        source: "Achievements" as const,
        ref: a.title,
        detail: a.impact ?? "Recorded achievement",
      })),
    });
  }

  if (input.learning.length + input.certifications.length >= 2) {
    out.push({
      capability: "Continuous Learning",
      needs: "Whether what was learned has been applied to real work yet.",
      evidence: [
        ...input.learning.slice(0, 2).map((l) => ({
          source: "Learning" as const,
          ref: l.course,
          detail: (l.skills_gained ?? []).join(", ") || "Completed course",
        })),
        ...input.certifications.slice(0, 2).map((c) => ({
          source: "Certifications" as const,
          ref: c.name,
          detail: c.issuer ?? "Certification",
        })),
      ],
    });
  }

  const claims = input.portfolioClaims ?? [];
  const supported = claims.filter((c) => c.strength === "strong");
  const unproven = claims.filter((c) => c.strength !== "strong");

  if (supported.length) {
    out.push({
      capability: "Demonstrated Delivery",
      needs: "Which decisions in that delivery were theirs, since the code evidence only shows the result.",
      evidence: supported.slice(0, 3).map((c) => ({
        source: "Portfolio" as const,
        ref: c.repo_name ?? c.claim.slice(0, 60),
        detail: `Portfolio claim supported by repository evidence: ${c.claim.slice(0, 140)}`,
      })),
    });
  }

  if (unproven.length) {
    out.push({
      capability: "Claimed Capability (needs demonstration)",
      needs:
        "Whether they personally built what the portfolio claims — the connected project evidence does not establish it yet.",
      evidence: unproven.slice(0, 3).map((c) => ({
        source: "Portfolio" as const,
        ref: c.repo_name ?? c.claim.slice(0, 60),
        detail: `Portfolio claim awaiting supporting evidence: ${c.claim.slice(0, 140)}${
          (c.technologies ?? []).length ? ` (mentions ${(c.technologies ?? []).join(", ")})` : ""
        }`,
      })),
    });
  }

  return out;
}

export function hypothesesToText(hypotheses: CapabilityHypothesis[]): string {
  if (!hypotheses.length) return "none — no evidence connected yet";
  return hypotheses
    .map(
      (h) =>
        `- Potential capability: ${h.capability}\n  Still needs validation: ${h.needs}\n  Evidence: ${h.evidence
          .map((e) => `${e.source}:${e.ref} (${e.detail})`)
          .join(" | ")}`,
    )
    .join("\n");
}

export const QUESTION_TYPES = [
  "evidence_validation",
  "behavioural",
  "technical_deep_dive",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export function typeForStep(step: number, hasEvidence: boolean): QuestionType {
  if (!hasEvidence) return "behavioural";
  const cycle: QuestionType[] = ["evidence_validation", "behavioural", "technical_deep_dive"];
  return cycle[(step - 1) % cycle.length]!;
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  evidence_validation: "Evidence validation",
  behavioural: "Behavioural",
  technical_deep_dive: "Technical deep dive",
};

/**
 * Deterministic grounded question used when the AI provider is unavailable but
 * we do have real evidence to point at. Never invents evidence.
 */
export function groundedFallbackQuestion(
  hypotheses: CapabilityHypothesis[],
  askedQuestions: string[],
  step: number,
): {
  question: string;
  category: string;
  options: Array<{ label: string; signals: string[] }>;
  rationale: string;
  evidenceConsidered: string[];
  type: QuestionType;
} | null {
  const candidates = hypotheses.filter((h) => h.evidence.length > 0);
  if (!candidates.length) return null;

  for (let i = 0; i < candidates.length; i += 1) {
    const h = candidates[(step - 1 + i) % candidates.length]!;
    const refs = h.evidence.map((e) => e.ref);
    const question = `Your ${h.evidence[0]!.source.toLowerCase()} evidence includes ${refs
      .slice(0, 2)
      .join(" and ")}. Thinking about that work, which best describes what you personally did?`;
    if (askedQuestions.includes(question)) continue;
    return {
      question,
      category: h.capability,
      type: "evidence_validation",
      rationale: `This helps us check whether the ${h.capability.toLowerCase()} signal we spotted is really yours. ${h.needs}`,
      evidenceConsidered: h.evidence.map((e) => `${e.ref} — ${e.detail}`),
      options: [
        {
          label: "I designed how the pieces fit together before building them",
          signals: ["Strategic Thinking", "Planning", "Problem Solving"],
        },
        {
          label: "I implemented the core of it myself, decisions included",
          signals: ["Ownership", "Problem Solving"],
        },
        {
          label: "I built one part within a design someone else set",
          signals: ["Problem Solving"],
        },
        {
          label: "I coordinated the work and kept the parts aligned",
          signals: ["Team Coordination", "Ownership", "Leadership"],
        },
        {
          label: "I mainly explored and learned from it rather than shipping it",
          signals: ["Research", "Creativity"],
        },
      ],
    };
  }
  return null;
}
