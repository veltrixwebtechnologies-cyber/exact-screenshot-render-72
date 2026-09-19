import { describe, expect, it } from "vitest";

import { matchBand, matchRole, skillGaps, confidenceLabel, type RoleLike, type SkillHolding } from "../talent";

const role: RoleLike = {
  id: "r1",
  title: "Senior Software Developer",
  department: "Engineering",
  description: null,
  required_skills: ["React", "TypeScript", "PostgreSQL", "Node.js"],
  preferred_skills: ["Docker", "GraphQL"],
  experience_required: 4,
};

const skill = (name: string, proficiency = 4): SkillHolding => ({
  name,
  proficiency,
  confidence: 0.8,
  source: "GitHub evidence",
  evidence: null,
});

describe("matchBand", () => {
  it("maps scores to coarse bands", () => {
    expect(matchBand(0.9)).toBe("Strong match");
    expect(matchBand(0.6)).toBe("Good match");
    expect(matchBand(0.4)).toBe("Partial match");
    expect(matchBand(0.1)).toBe("Early match");
  });
});

describe("matchRole", () => {
  it("scores required skills at 70% weight and is case-insensitive", () => {
    const match = matchRole(role, [skill("react"), skill("typescript"), skill("postgresql"), skill("node.js")]);
    expect(match.matched).toHaveLength(4);
    expect(match.missing).toHaveLength(0);
    expect(match.score).toBeCloseTo(0.7, 5);
    expect(match.band).toBe("Good match");
  });

  it("credits preferred skills and capability support separately", () => {
    const match = matchRole(role, [skill("React"), skill("TypeScript"), skill("Docker")], ["PostgreSQL"]);
    expect(match.preferredMatched).toEqual(["Docker"]);
    expect(match.capabilitySupport).toEqual(["PostgreSQL"]);
    expect(match.score).toBeCloseTo(0.5 * 0.7 + 0.5 * 0.2 + 0.25 * 0.1, 5);
  });

  it("never exceeds 1 and handles an empty profile", () => {
    const match = matchRole(role, []);
    expect(match.score).toBe(0);
    expect(match.missing).toHaveLength(4);
    expect(matchRole(role, role.required_skills.concat(role.preferred_skills).map((s) => skill(s))).score)
      .toBeLessThanOrEqual(1);
  });
});

describe("skillGaps", () => {
  it("flags missing required skills as high priority and sorts by gap", () => {
    const rows = skillGaps(role, [skill("React", 4)]);
    expect(rows[0]?.gap).toBe(4);
    expect(rows[0]?.priority).toBe("High");
    const react = rows.find((r) => r.skill === "React");
    expect(react?.gap).toBe(0);
    expect(react?.priority).toBe("Low");
  });
});

describe("confidenceLabel", () => {
  it("never overstates low confidence", () => {
    expect(confidenceLabel(0.8)).toBe("High");
    expect(confidenceLabel(0.62)).toBe("Moderate");
    expect(confidenceLabel(0.41)).toBe("Emerging");
  });
});
