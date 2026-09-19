import { describe, expect, it } from "vitest";

import {
  deterministicExtraction,
  mentionStrength,
  normalizeExtraction,
  sectionsOf,
  techInResume,
} from "../resume-extract";

const resume = `Asha Menon
Senior Backend Engineer
asha@example.com | github.com/ashamenon | asha.dev

PROFESSIONAL SUMMARY
Backend engineer working on payment and delivery systems with PostgreSQL and Python.

TECHNICAL SKILLS
Python, FastAPI, PostgreSQL, Docker, React, TypeScript

PROJECTS
• LocalShore — delivery marketplace built with FastAPI and PostgreSQL, handling partner onboarding
• Instant Currency — Chrome extension in JavaScript for currency conversion

CERTIFICATIONS
AWS Certified Developer Associate - Amazon Web Services

COURSES
Distributed Systems at NPTEL

ACHIEVEMENTS
• Cut checkout latency for the payments service
`;

describe("deterministic resume reading", () => {
  const extraction = deterministicExtraction(resume);

  it("splits the resume into its sections", () => {
    const sections = sectionsOf(resume);
    expect(sections.projects).toHaveLength(2);
    expect(sections.summary.join(" ")).toContain("Backend engineer");
  });

  it("reads the job title and summary", () => {
    expect(extraction.jobTitle?.toLowerCase()).toContain("engineer");
    expect(extraction.summary).toContain("payment");
  });

  it("records only technologies named in the resume", () => {
    expect(extraction.skills).toContain("FastAPI");
    expect(extraction.skills).toContain("PostgreSQL");
    expect(extraction.skills).not.toContain("Kubernetes");
    expect(techInResume("nothing technical here")).toHaveLength(0);
  });

  it("reads projects, certifications, courses and achievements", () => {
    expect(extraction.projects[0]?.title).toBe("LocalShore");
    expect(extraction.projects[0]?.technologies).toContain("FastAPI");
    expect(extraction.certifications[0]?.name).toContain("AWS Certified Developer");
    expect(extraction.learning.some((row) => row.course.includes("Distributed Systems"))).toBe(true);
    expect(extraction.achievements[0]?.title).toContain("checkout latency");
  });

  it("picks up a portfolio link but never the GitHub profile link", () => {
    expect(extraction.portfolioUrl).toBe("asha.dev");
  });
});

describe("AI payload normalisation", () => {
  it("drops skills that do not appear in the resume text", () => {
    const parsed = normalizeExtraction(
      {
        job_title: "Senior Backend Engineer",
        skills: ["FastAPI", "Kubernetes"],
        projects: [{ title: "LocalShore", description: "Delivery marketplace", technologies: ["FastAPI"] }],
        certifications: [{ name: "AWS Certified Developer Associate", issuer: "AWS" }],
      },
      resume,
    );
    expect(parsed?.skills).toEqual(["FastAPI"]);
    expect(parsed?.projects[0]?.title).toBe("LocalShore");
  });

  it("returns null for unusable payloads", () => {
    expect(normalizeExtraction(null, resume)).toBeNull();
  });
});

describe("mention strength", () => {
  it("stays a suggestion, never full proficiency", () => {
    const strong = mentionStrength(resume, "PostgreSQL");
    expect(strong.count).toBeGreaterThan(1);
    expect(strong.proficiency).toBeLessThanOrEqual(3);
    expect(strong.confidence).toBeLessThanOrEqual(0.7);
  });
});
