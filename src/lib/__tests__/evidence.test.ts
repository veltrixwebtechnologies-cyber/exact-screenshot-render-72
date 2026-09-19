import { describe, expect, it } from "vitest";

import { evidenceMix, githubStats, matchBreakdown, sourceBucket } from "../evidence";
import type { RoleLike, SkillHolding } from "../talent";

const skill = (name: string, source: string, proficiency = 4): SkillHolding => ({
  name,
  proficiency,
  confidence: 0.7,
  source,
  evidence: null,
});

describe("sourceBucket", () => {
  it("groups raw source strings into evidence buckets", () => {
    expect(sourceBucket("GitHub evidence")).toBe("GitHub projects");
    expect(sourceBucket("Assessment + profile")).toBe("Interview responses");
    expect(sourceBucket("Learning record")).toBe("Learning history");
    expect(sourceBucket("Certification")).toBe("Certifications");
    expect(sourceBucket("self-reported")).toBe("Profile & projects");
  });
});

describe("evidenceMix", () => {
  it("returns shares that add up to 1", () => {
    const mix = evidenceMix([
      skill("React", "GitHub evidence"),
      skill("SQL", "GitHub evidence"),
      skill("Leadership", "Assessment"),
    ]);
    expect(mix[0]?.source).toBe("GitHub projects");
    expect(mix[0]?.share).toBeCloseTo(2 / 3, 5);
    expect(mix.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1, 5);
  });

  it("is empty with no skills", () => {
    expect(evidenceMix([])).toEqual([]);
  });
});

describe("matchBreakdown", () => {
  const role: RoleLike = {
    id: "r",
    title: "Technical Lead",
    department: null,
    description: null,
    required_skills: ["React", "System Design", "Mentoring"],
    preferred_skills: [],
    experience_required: null,
  };

  it("splits strong evidence, transferable signals and gaps", () => {
    const result = matchBreakdown(role, [skill("React", "GitHub evidence", 4), skill("System Design", "Profile", 2)], [
      "Mentoring",
    ]);
    expect(result.strong.map((s) => s.skill)).toContain("React");
    expect([...result.transferable.map((s) => s.skill), ...result.gaps]).toContain("Mentoring");
    expect(result.strong.length + result.transferable.length + result.gaps.length).toBe(3);
  });
});

describe("githubStats", () => {
  it("counts repositories, languages and recent activity", () => {
    const recent = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
    const stale = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
    const stats = githubStats([
      {
        repo_name: "a",
        repo_url: "https://github.com/u/a",
        languages: ["TypeScript"],
        detected_tech: ["React"],
        last_pushed_at: recent,
        stars: 3,
      } as never,
      {
        repo_name: "b",
        repo_url: "https://github.com/u/b",
        languages: ["Python"],
        detected_tech: ["FastAPI"],
        last_pushed_at: stale,
        stars: 1,
      } as never,
    ]);
    expect(stats.repos).toBe(2);
    expect(stats.languages).toEqual(["TypeScript", "Python"]);
    expect(stats.activeProjects).toBe(1);
    expect(stats.stars).toBe(4);
    expect(stats.signals.every((s) => s.strength <= 1)).toBe(true);
  });
});
