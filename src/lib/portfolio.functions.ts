import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { callAI, parseJSON } from "./ai.server";
import { enforceRateLimit } from "./rate-limit.server";
import { parseInput, portfolioUrlSchema, portfolioIdSchema } from "./validation";
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
  type ClaimCheck,
  type PortfolioClaim,
} from "./portfolio";
import { getConnectionForUser } from "@/server/appUserConnections.server";

const MAX_CLAIMS = 8;
const ACTIVE_WINDOW_DAYS = 365;

interface RepoEvidence {
  repo_name: string;
  repo_url: string;
  github_username: string | null;
  detected_tech: string[];
  languages: string[];
  last_pushed_at: string | null;
  summary: string | null;
}

async function employeeIdFor(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("No employee profile found for this account.");
  return data.id as string;
}

async function fetchPage(url: URL): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "TalentMapAI-PortfolioCheck/1.0", Accept: "text/html,*/*" },
    });
    if (!res.ok) throw new Error(`The portfolio page could not be opened (status ${res.status}).`);
    const html = await res.text();
    return html.slice(0, 400_000);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The portfolio page took too long to respond.");
    }
    throw error instanceof Error ? error : new Error("The portfolio page could not be reached.");
  } finally {
    clearTimeout(timer);
  }
}

async function linkReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6_000);
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const norm = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Finds the repository a claim most likely refers to, by linked URL or by name mention. */
function matchRepo(
  claim: string,
  linkedRepos: Array<{ url: string; repo: string }>,
  repos: RepoEvidence[],
): RepoEvidence | null {
  const claimNorm = norm(claim);
  for (const linked of linkedRepos) {
    if (!claimNorm.includes(norm(linked.repo))) continue;
    const found = repos.find((repo) => norm(repo.repo_name) === norm(linked.repo));
    if (found) return found;
  }
  const byName = repos
    .filter((repo) => repo.repo_name.length >= 4 && claimNorm.includes(norm(repo.repo_name)))
    .sort((a, b) => b.repo_name.length - a.repo_name.length);
  if (byName[0]) return byName[0];

  // Fall back to the repository whose technologies best overlap the claim.
  const claimTech = technologiesIn(claim).map(norm);
  if (!claimTech.length) return null;
  let best: { repo: RepoEvidence; overlap: number } | null = null;
  for (const repo of repos) {
    const repoTech = new Set([...repo.detected_tech, ...repo.languages].map(norm));
    const overlap = claimTech.filter((tech) => repoTech.has(tech)).length;
    if (overlap >= 2 && (!best || overlap > best.overlap)) best = { repo, overlap };
  }
  return best?.repo ?? null;
}

async function buildClaim(
  claimText: string,
  claimTech: string[],
  linkedRepos: Array<{ url: string; repo: string; owner: string }>,
  repos: RepoEvidence[],
  connectedLogin: string | null,
  demoCandidates: string[],
): Promise<PortfolioClaim> {
  const repo = matchRepo(claimText, linkedRepos, repos);
  const checks: ClaimCheck[] = [
    { label: "Claim found on the portfolio page", passed: true, detail: "Read from the page you submitted." },
  ];

  checks.push(
    repo
      ? {
          label: "Matching repository in your connected GitHub",
          passed: true,
          detail: repo.repo_name,
        }
      : {
          label: "Matching repository in your connected GitHub",
          passed: false,
          detail: "No authorized repository could be linked to this claim.",
        },
  );

  const owned =
    !!repo &&
    !!connectedLogin &&
    (repo.github_username ?? "").toLowerCase() === connectedLogin.toLowerCase();
  checks.push({
    label: "Repository belongs to the connected account",
    passed: owned,
    detail: repo
      ? owned
        ? `Owned by the connected account (${connectedLogin}).`
        : "The repository is visible to you, but ownership by the connected account is not established."
      : "Not applicable until a repository is linked.",
  });

  const repoTech = repo ? new Set([...repo.detected_tech, ...repo.languages].map(norm)) : new Set<string>();
  const supported = claimTech.filter((tech) => repoTech.has(norm(tech)));
  const unsupported = claimTech.filter((tech) => !repoTech.has(norm(tech)));
  checks.push({
    label: "Technology evidence in the repository",
    passed: supported.length > 0 && unsupported.length === 0,
    detail: claimTech.length
      ? supported.length
        ? `Found: ${supported.join(", ")}${unsupported.length ? ` · not found in the code: ${unsupported.join(", ")}` : ""}`
        : `Not found in the connected project files: ${claimTech.join(", ")}`
      : "The claim does not name a technology that can be cross-checked.",
  });

  const recent =
    !!repo?.last_pushed_at &&
    Date.now() - new Date(repo.last_pushed_at).getTime() < ACTIVE_WINDOW_DAYS * 86_400_000;
  checks.push({
    label: "Project activity detected",
    passed: recent,
    detail: repo?.last_pushed_at
      ? `Last activity ${new Date(repo.last_pushed_at).toLocaleDateString()}.`
      : "No recent activity found for a linked repository.",
  });

  let demo: string | null = null;
  for (const candidate of demoCandidates.slice(0, 4)) {
    if (!norm(claimText).includes(norm(new URL(candidate).hostname.split(".")[0] ?? ""))) continue;
    demo = candidate;
    break;
  }
  if (!demo && demoCandidates.length === 1) demo = demoCandidates[0] ?? null;
  const demoLive = demo ? await linkReachable(demo) : false;
  checks.push({
    label: "Live demo reachable",
    passed: demoLive,
    detail: demo
      ? demoLive
        ? demo
        : `${demo} did not respond.`
      : "No demo link on the page could be tied to this claim.",
  });

  const strength = strengthFromChecks(checks);
  const note =
    strength === "strong"
      ? "The connected project evidence supports this claim."
      : unsupported.length && repo
        ? `This claim describes ${unsupported.join(", ")}, but the connected project evidence does not currently establish that contribution.`
        : repo
          ? "Partly supported — some checks could not be established from the connected evidence."
          : "This claim needs additional evidence: no authorized repository could be linked to it.";

  return {
    claim: claimText,
    technologies: claimTech,
    repo_name: repo?.repo_name ?? null,
    repo_url: repo?.repo_url ?? null,
    demo_url: demo,
    strength,
    checks,
    note,
  };
}

/**
 * Verifies the claims on an employee's portfolio page against the GitHub evidence
 * they authorized. Never asserts a claim is "100% verified" — only how strong the
 * available evidence is.
 */
export const verifyPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => parseInput(portfolioUrlSchema, data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    enforceRateLimit(`portfolio:${userId}`, { limit: 8, windowMs: 10 * 60_000 });

    const url = safePortfolioUrl(data.portfolioUrl);
    const employeeId = await employeeIdFor(supabase, userId);

    const html = await fetchPage(url);
    const text = htmlToText(html);
    if (text.length < 80) {
      throw new Error("Very little readable text was found on that page.");
    }
    const links = extractLinks(html, url.toString());
    const linkedRepos = githubRepoLinks(links);
    const demos = demoLinks(links, url.toString());

    const { data: evidenceRows } = await supabase
      .from("github_evidence")
      .select("repo_name, repo_url, github_username, detected_tech, languages, last_pushed_at, summary")
      .eq("employee_id", employeeId);
    const repos = (evidenceRows ?? []) as RepoEvidence[];

    const connection = await getConnectionForUser(userId, "github");
    const connectedLogin = connection?.externalUsername ?? null;

    // Claim extraction: AI first (grounded strictly in the page text), deterministic fallback.
    let claimTexts: Array<{ claim: string; technologies: string[] }> = [];
    const raw = await callAI([
      {
        role: "system",
        content:
          "You extract verifiable capability claims from a portfolio page. Only use text that appears in the page. Never invent projects, employers, numbers or technologies. Return JSON only.",
      },
      {
        role: "user",
        content: `Portfolio page text (truncated):\n"""${text.slice(0, 6000)}"""\n\nReturn JSON: {"claims":[{"claim":"<verbatim or lightly trimmed claim from the page, max 200 chars>","technologies":["<technology named in that claim>"]}]} with at most ${MAX_CLAIMS} claims about things the person says they built, designed or led.`,
      },
    ]);
    const parsed = parseJSON<{ claims?: Array<{ claim?: string; technologies?: string[] }> }>(raw);
    if (parsed?.claims?.length) {
      claimTexts = parsed.claims
        .map((item) => ({
          claim: String(item.claim ?? "").trim().slice(0, 240),
          technologies: technologiesIn(
            `${item.claim ?? ""} ${(item.technologies ?? []).join(" ")}`,
          ),
        }))
        .filter((item) => item.claim.length >= 15)
        .slice(0, MAX_CLAIMS);
    }
    if (!claimTexts.length) {
      claimTexts = candidateClaims(text, MAX_CLAIMS).map((claim) => ({
        claim,
        technologies: technologiesIn(claim),
      }));
    }
    if (!claimTexts.length) {
      throw new Error("No project or capability claims could be read from that page.");
    }

    const claims: PortfolioClaim[] = [];
    for (const item of claimTexts) {
      claims.push(
        await buildClaim(
          item.claim,
          item.technologies,
          linkedRepos,
          repos,
          connectedLogin,
          demos,
        ),
      );
    }

    const notes = repos.length
      ? connectedLogin
        ? null
        : "GitHub is connected, but the account name is unknown, so ownership could not be established."
      : "Connect GitHub so portfolio claims can be checked against real repository evidence.";

    const row = {
      employee_id: employeeId,
      portfolio_url: url.toString(),
      page_title: pageTitle(html),
      overall_strength: overallStrength(claims),
      claims: claims as unknown as Record<string, unknown>[],
      detected_repo_links: linkedRepos.map((repo) => repo.url),
      detected_demo_links: demos,
      notes,
      checked_at: new Date().toISOString(),
    };

    const saved = await supabase
      .from("portfolio_verifications")
      .upsert(row, { onConflict: "employee_id,portfolio_url" })
      .select("id")
      .maybeSingle();
    if (saved.error) throw new Error(saved.error.message);

    return {
      id: saved.data?.id as string | undefined,
      portfolioUrl: row.portfolio_url,
      overallStrength: row.overall_strength,
      claims: claims.length,
      aiUsed: Boolean(parsed?.claims?.length),
      reposConsidered: repos.length,
    };
  });

export const deletePortfolioVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => parseInput(portfolioIdSchema, data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const employeeId = await employeeIdFor(supabase, userId);
    const result = await supabase
      .from("portfolio_verifications")
      .delete()
      .eq("id", data.id)
      .eq("employee_id", employeeId);
    if (result.error) throw new Error(result.error.message);
    return { deleted: true };
  });
