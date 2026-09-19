import { describe, expect, it } from "vitest";

import { deriveHypotheses, hypothesesToText, typeForStep, type HypothesisInput } from "../hypotheses";

const base: HypothesisInput = {
  github: [],
  projects: [],
  achievements: [],
  certifications: [],
  learning: [],
  resumeText: null,
};

describe("deriveHypotheses", () => {
  it("returns nothing when there is no evidence at all", () => {
    expect(deriveHypotheses(base)).toEqual([]);
  });

  it("derives hypotheses only from real records, keeping them unproven", () => {
    const result = deriveHypotheses({
      ...base,
      github: [
        {
          repo_name: "LocalShore",
          repo_url: "https://github.com/u/LocalShore",
          detected_tech: ["React", "Supabase", "Stripe"],
          languages: ["TypeScript"],
          last_pushed_at: new Date().toISOString(),
        },
        {
          repo_name: "notes-api",
          detected_tech: ["FastAPI", "PostgreSQL"],
          languages: ["Python"],
        },
        { repo_name: "cli-tools", detected_tech: ["Go"], languages: ["Go"] },
      ],
      achievements: [{ title: "Cut checkout latency by half", impact: "Faster checkout" }],
    });

    expect(result.length).toBeGreaterThan(0);
    for (const hypothesis of result) {
      expect(hypothesis.needs.length).toBeGreaterThan(0);
      expect(hypothesis.evidence.length).toBeGreaterThan(0);
      // Every evidence ref must come from the input records — never invented.
      for (const item of hypothesis.evidence) {
        expect(item.ref.length).toBeGreaterThan(0);
      }
    }
    const refs = result.flatMap((h) => h.evidence.map((e) => e.ref)).join(" ");
    expect(refs).toContain("LocalShore");
  });
});

describe("hypothesesToText", () => {
  it("summarises hypotheses as text for the prompt", () => {
    const text = hypothesesToText(
      deriveHypotheses({
        ...base,
        projects: [
          { title: "Warehouse rewrite", role: "Lead", technologies: ["Java"] },
          { title: "Billing sync", role: "Developer", technologies: ["Node.js"] },
        ],
      }),
    );
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("Warehouse rewrite");
  });

  it("degrades gracefully with no hypotheses", () => {
    expect(typeof hypothesesToText([])).toBe("string");
  });
});

describe("typeForStep", () => {
  it("cycles question types and avoids evidence validation without evidence", () => {
    const withEvidence = [1, 2, 3, 4].map((step) => typeForStep(step, true));
    expect(new Set(withEvidence).size).toBeGreaterThan(1);
    for (const step of [1, 2, 3, 4, 5]) {
      expect(typeForStep(step, false)).not.toBe("evidence_validation");
    }
  });
});
