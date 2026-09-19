import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import {
  appUserReconnectRequired,
  authorizeAppUserOAuth,
  callAsAppUser,
  disconnectAppUser,
  exchangeAppUserOAuthCode,
} from "@/integrations/lovable/appUserConnector";
import {
  deleteConnectionForUser,
  getConnectionForUser,
  saveConnectionKeyForUser,
  setExternalUsername,
} from "@/server/appUserConnections.server";
import {
  FILE_SIGNALS,
  parsePackageJson,
  parsePyProject,
  parseRequirements,
  techFromDependencies,
} from "./github-tech";

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "github";
/** read:user + repo so private work the employee chooses to share can be read. */
export const GITHUB_SCOPES = ["read:user", "repo"];
const MAX_REPOS = 8;

function clientApiKey(): string {
  const key = process.env['GITHUB_APP_USER_CONNECTOR_CLIENT_API_KEY'];
  if (!key) throw new Error("GITHUB_APP_USER_CONNECTOR_CLIENT_API_KEY is not set");
  return key;
}

async function employeeIdFor(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
  if (!data) throw new Error("No employee profile found for this account.");
  return data.id as string;
}

/** Starts GitHub consent for the signed-in employee. Nothing is read until they approve. */
export const startGithubConnect = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const request = getRequest();
    if (!request) throw new Error("OAuth must start from an app request.");
    const url = new URL(request.url);
    const sandboxHost =
      url.hostname === "localhost" ? request.headers.get("x-forwarded-host") : null;
    const returnUrl = new URL(
      "/oauth/github/return",
      sandboxHost ? `https://${sandboxHost}` : url.origin,
    ).toString();

    const existing = await getConnectionForUser(userId, CONNECTOR_ID);

    const { authorizationUrl } = await authorizeAppUserOAuth({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectorId: CONNECTOR_ID,
      appUserId: userId,
      clientAPIKey: clientApiKey(),
      returnUrl,
      connectionAPIKey: existing?.connectionAPIKey,
      credentialsConfiguration: { scopes: GITHUB_SCOPES },
    });
    return { authorizationUrl };
  });

/** Exchanges the one-time consent code and stores the encrypted connection for this employee. */
export const completeGithubConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) => {
    if (!input?.code) throw new Error("Missing authorization code.");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string };
    const { connectionAPIKey, connectorId } = await exchangeAppUserOAuthCode(
      GATEWAY_BASE_URL,
      data.code,
    );
    if (connectorId !== CONNECTOR_ID) throw new Error("OAuth completion returned the wrong service");

    let login: string | null = null;
    const res = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey,
      connectorId: CONNECTOR_ID,
      path: "/user",
      init: { headers: { Accept: "application/vnd.github+json" } },
      requiredScopes: GITHUB_SCOPES,
    });
    if (res.ok) {
      const body = (await res.json()) as { login?: string };
      login = body.login ?? null;
    }

    await saveConnectionKeyForUser(userId, CONNECTOR_ID, connectionAPIKey, login);
    return { connected: true, githubUsername: login };
  });

export const githubStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context as { userId: string };
    const connection = await getConnectionForUser(userId, CONNECTOR_ID);
    if (!connection) return { connected: false as const };
    return {
      connected: true as const,
      githubUsername: connection.externalUsername,
      connectedAt: connection.updatedAt,
    };
  });

export const disconnectGithub = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const connection = await getConnectionForUser(userId, CONNECTOR_ID);
    if (connection) {
      try {
        await disconnectAppUser({
          gatewayBaseUrl: GATEWAY_BASE_URL,
          connectionAPIKey: connection.connectionAPIKey,
          connectorId: CONNECTOR_ID,
        });
      } catch (error) {
        console.error("GitHub disconnect failed at the gateway", error);
      }
      await deleteConnectionForUser(userId, CONNECTOR_ID);
    }
    const employeeId = await employeeIdFor(supabase, userId);
    await supabase.from("github_evidence").delete().eq("employee_id", employeeId);
    await supabase
      .from("employee_skills")
      .delete()
      .eq("employee_id", employeeId)
      .eq("source", "GitHub evidence");
    return { connected: false };
  });

interface RepoRow {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  pushed_at: string | null;
  description: string | null;
  owner?: { login?: string };
}

async function readFile(
  connectionAPIKey: string,
  fullName: string,
  path: string,
): Promise<string | null> {
  const res = await callAsAppUser({
    gatewayBaseUrl: GATEWAY_BASE_URL,
    connectionAPIKey,
    connectorId: CONNECTOR_ID,
    path: `/repos/${fullName}/contents/${path}`,
    init: { headers: { Accept: "application/vnd.github+json" } },
    requiredScopes: GITHUB_SCOPES,
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { content?: string; encoding?: string };
  if (!body.content) return null;
  try {
    return Buffer.from(body.content, (body.encoding as BufferEncoding) ?? "base64").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Reads only the repositories GitHub permits for this employee's grant, derives
 * technology evidence, and records it on their profile.
 */
export const syncGithubEvidence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: any; userId: string };
    const connection = await getConnectionForUser(userId, CONNECTOR_ID);
    if (!connection) return { connected: false as const, reconnectRequired: false, repos: 0 };

    const employeeId = await employeeIdFor(supabase, userId);
    const key = connection.connectionAPIKey;

    const listed = await callAsAppUser({
      gatewayBaseUrl: GATEWAY_BASE_URL,
      connectionAPIKey: key,
      connectorId: CONNECTOR_ID,
      path: "/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator",
      init: { headers: { Accept: "application/vnd.github+json" } },
      requiredScopes: GITHUB_SCOPES,
    });

    if (await appUserReconnectRequired(listed)) {
      return { connected: false as const, reconnectRequired: true, repos: 0 };
    }
    if (!listed.ok) {
      const body = await listed.text();
      console.error(`GitHub repo list failed [${listed.status}]: ${body}`);
      throw new Error(`GitHub request failed [${listed.status}]: ${body.slice(0, 300)}`);
    }

    const repos = ((await listed.json()) as RepoRow[])
      .filter((repo) => !repo.fork)
      .slice(0, MAX_REPOS);

    const login = repos[0]?.owner?.login ?? connection.externalUsername ?? "unknown";
    if (login !== connection.externalUsername && login !== "unknown") {
      await setExternalUsername(userId, CONNECTOR_ID, login);
    }

    const techTally = new Map<string, { count: number; repos: string[] }>();
    const rows: Array<Record<string, unknown>> = [];

    for (const repo of repos) {
      const languagesRes = await callAsAppUser({
        gatewayBaseUrl: GATEWAY_BASE_URL,
        connectionAPIKey: key,
        connectorId: CONNECTOR_ID,
        path: `/repos/${repo.full_name}/languages`,
        init: { headers: { Accept: "application/vnd.github+json" } },
        requiredScopes: GITHUB_SCOPES,
      });
      const languages = languagesRes.ok
        ? Object.keys((await languagesRes.json()) as Record<string, number>)
        : repo.language
          ? [repo.language]
          : [];

      const deps: string[] = [];
      const tech = new Set<string>(languages);

      const pkg = await readFile(key, repo.full_name, "package.json");
      if (pkg) deps.push(...parsePackageJson(pkg));
      const reqs = await readFile(key, repo.full_name, "requirements.txt");
      if (reqs) {
        deps.push(...parseRequirements(reqs));
        tech.add("Python");
      }
      const pyproject = await readFile(key, repo.full_name, "pyproject.toml");
      if (pyproject) {
        deps.push(...parsePyProject(pyproject));
        tech.add("Python");
      }
      for (const signal of FILE_SIGNALS) {
        if (signal.file === "requirements.txt" || signal.file === "pyproject.toml") continue;
        const found = await readFile(key, repo.full_name, signal.file);
        if (found) tech.add(signal.tech);
      }
      for (const item of techFromDependencies(deps)) tech.add(item);

      const readme = await readFile(key, repo.full_name, "README.md");
      const summary =
        repo.description?.trim() ||
        readme?.replace(/[#>*`_\-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 240) ||
        null;

      const detected = [...tech];
      for (const item of detected) {
        const entry = techTally.get(item) ?? { count: 0, repos: [] };
        entry.count += 1;
        if (entry.repos.length < 3) entry.repos.push(repo.name);
        techTally.set(item, entry);
      }

      rows.push({
        employee_id: employeeId,
        github_username: repo.owner?.login ?? login,
        repo_name: repo.name,
        repo_url: repo.html_url,
        is_private: repo.private,
        primary_language: repo.language,
        languages,
        detected_tech: detected,
        stars: repo.stargazers_count ?? 0,
        last_pushed_at: repo.pushed_at,
        summary,
      });
    }

    if (rows.length) {
      const upsert = await supabase
        .from("github_evidence")
        .upsert(rows, { onConflict: "employee_id,repo_url" });
      if (upsert.error) throw new Error(upsert.error.message);
    }

    // Record the technology signals as skills sourced from authorized GitHub data.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let skillsRecorded = 0;
    for (const [name, entry] of techTally) {
      const existing = await (supabaseAdmin as any)
        .from("skills")
        .select("id")
        .ilike("name", name)
        .maybeSingle();
      let skillId = existing.data?.id as string | undefined;
      if (!skillId) {
        const created = await (supabaseAdmin as any)
          .from("skills")
          .insert({ name, category: "Technical" })
          .select("id")
          .maybeSingle();
        skillId = created.data?.id as string | undefined;
      }
      if (!skillId) continue;

      const proficiency = entry.count >= 4 ? 4 : entry.count >= 2 ? 3 : 2;
      const confidence = Math.min(0.9, 0.5 + entry.count * 0.1);
      const evidence = `Used in ${entry.count} authorized GitHub ${
        entry.count === 1 ? "repository" : "repositories"
      } (${entry.repos.join(", ")}).`;

      const current = await (supabaseAdmin as any)
        .from("employee_skills")
        .select("id, source, proficiency")
        .eq("employee_id", employeeId)
        .eq("skill_id", skillId)
        .maybeSingle();

      if (current.data) {
        if (current.data.source === "GitHub evidence") {
          await (supabaseAdmin as any)
            .from("employee_skills")
            .update({
              proficiency,
              confidence,
              evidence,
              last_updated: new Date().toISOString(),
            })
            .eq("id", current.data.id);
        }
      } else {
        await (supabaseAdmin as any).from("employee_skills").insert({
          employee_id: employeeId,
          skill_id: skillId,
          proficiency,
          confidence,
          source: "GitHub evidence",
          evidence,
        });
      }
      skillsRecorded += 1;
    }

    return {
      connected: true as const,
      reconnectRequired: false,
      githubUsername: login,
      repos: rows.length,
      skillsRecorded,
    };
  });
