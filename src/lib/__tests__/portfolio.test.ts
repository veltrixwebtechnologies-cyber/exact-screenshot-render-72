import { describe, expect, it } from "vitest";

import {
  candidateClaims,
  demoLinks,
  extractLinks,
  githubRepoLinks,
  htmlToText,
  overallStrength,
  pageTitle,
  safePortfolioUrl,
  strengthFromChecks,
  technologiesIn,
  type PortfolioClaim,
} from "../portfolio";

const html = `<html><head><title>Jane Doe — Portfolio</title></head><body>
<h1>Projects</h1>
<p>Built a real-time chat application using WebSockets and Node.js for 400 users.</p>
<p>Designed an advanced RAG pipeline with LangChain and pgvector.</p>
<a href="https://github.com/janedoe/localshore">LocalShore repo</a>
<a href="https://localshore-demo.vercel.app">Live demo</a>
<a href="https://linkedin.com/in/janedoe">LinkedIn</a>
<script>var a = 1;</script>
</body></html>`;

describe("portfolio parsing", () => {
  it("reads the page title and text without markup or scripts", () => {
    expect(pageTitle(html)).toBe("Jane Doe — Portfolio");
    const text = htmlToText(html);
    expect(text).toContain("real-time chat application");
    expect(text).not.toContain("var a = 1");
  });

  it("finds repository links but not profile or social links", () => {
    const links = extractLinks(html, "https://jane.dev");
    const repos = githubRepoLinks(links);
    expect(repos).toHaveLength(1);
    expect(repos[0]?.repo).toBe("localshore");
    expect(demoLinks(links, "https://jane.dev")).toContain("https://localshore-demo.vercel.app/");
  });

  it("extracts claims that name checkable technologies", () => {
    const claims = candidateClaims(htmlToText(html));
    expect(claims.some((claim) => claim.includes("WebSockets"))).toBe(true);
    expect(technologiesIn(claims.join(" "))).toContain("LangChain");
  });
});

describe("evidence strength", () => {
  const base = [{ label: "Claim found on the portfolio page", passed: true }];

  it("is strong only when the repository, ownership and technology all check out", () => {
    expect(
      strengthFromChecks([
        ...base,
        { label: "Matching repository in your connected GitHub", passed: true },
        { label: "Repository belongs to the connected account", passed: true },
        { label: "Technology evidence in the repository", passed: true },
      ]),
    ).toBe("strong");
  });

  it("is partial when the technology claim is not supported by the code", () => {
    expect(
      strengthFromChecks([
        ...base,
        { label: "Matching repository in your connected GitHub", passed: true },
        { label: "Repository belongs to the connected account", passed: true },
        { label: "Technology evidence in the repository", passed: false },
      ]),
    ).toBe("moderate");
  });

  it("needs more evidence when nothing could be linked", () => {
    expect(
      strengthFromChecks([
        ...base,
        { label: "Matching repository in your connected GitHub", passed: false },
        { label: "Repository belongs to the connected account", passed: false },
        { label: "Technology evidence in the repository", passed: false },
      ]),
    ).toBe("needs_evidence");
  });

  it("summarises the page from its claims", () => {
    const claim = (strength: PortfolioClaim["strength"]): PortfolioClaim => ({
      claim: "c",
      technologies: [],
      repo_name: null,
      repo_url: null,
      demo_url: null,
      strength,
      checks: [],
      note: "",
    });
    expect(overallStrength([claim("strong"), claim("strong"), claim("needs_evidence")])).toBe("strong");
    expect(overallStrength([claim("moderate"), claim("needs_evidence")])).toBe("moderate");
    expect(overallStrength([])).toBe("needs_evidence");
  });
});

describe("url safety", () => {
  it("adds https and accepts public hosts", () => {
    expect(safePortfolioUrl("myportfolio.com").toString()).toBe("https://myportfolio.com/");
  });

  it("rejects local and private addresses", () => {
    expect(() => safePortfolioUrl("http://localhost:8080")).toThrow();
    expect(() => safePortfolioUrl("http://192.168.1.4")).toThrow();
    expect(() => safePortfolioUrl("file:///etc/passwd")).toThrow();
  });
});
