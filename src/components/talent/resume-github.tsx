import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Chip, SectionTitle } from "@/components/talent/primitives";
import {
  completeGithubConnection,
  disconnectGithub,
  githubStatus,
  syncGithubEvidence,
} from "@/lib/github.functions";
import { processResume } from "@/lib/resume.functions";
import { githubStats, type GithubEvidenceRow } from "@/lib/evidence";
import { startGithubConnect } from "@/lib/github.functions";

function waitForOAuthCompletion(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
    let poll: number | undefined;
    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (poll !== undefined) window.clearInterval(poll);
    };
    const onMessage = (event: MessageEvent) => {
      const type = (event.data as { type?: string } | null)?.type;
      if (
        event.origin !== window.location.origin ||
        event.source !== popup ||
        (event.data as { connectorId?: string } | null)?.connectorId !== "github" ||
        (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")
      )
        return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") {
        const code = (event.data as { code?: unknown }).code;
        resolve(typeof code === "string" ? code : null);
        return;
      }
      popup.close();
      reject(new Error("GitHub authorization failed."));
    };
    window.addEventListener("message", onMessage);
    poll = window.setInterval(() => {
      if (!popup.closed) return;
      cleanup();
      reject(new Error("The GitHub window was closed before finishing."));
    }, 500);
  });
}

export function ResumeAndGithubSection({
  employeeId,
  compact = false,
}: {
  employeeId: string | undefined;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const runProcessResume = useServerFn(processResume);
  const runStartConnect = useServerFn(startGithubConnect);
  const runComplete = useServerFn(completeGithubConnection);
  const runSync = useServerFn(syncGithubEvidence);
  const runDisconnect = useServerFn(disconnectGithub);
  const runStatus = useServerFn(githubStatus);

  const status = useQuery({
    queryKey: ["github-status"],
    queryFn: () => runStatus(),
  });

  const resumes = useQuery({
    queryKey: ["resumes", employeeId],
    enabled: Boolean(employeeId),
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("employee_resumes")
        .select("id, file_name, detected_github_username, created_at")
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const evidence = useQuery({
    queryKey: ["github-evidence", employeeId],
    enabled: Boolean(employeeId),
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("github_evidence")
        .select("*")
        .eq("employee_id", employeeId)
        .order("last_pushed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sync = useMutation({
    mutationFn: () => runSync(),
    onSuccess: (result) => {
      if (!result.connected && result.reconnectRequired) {
        toast.error("Your GitHub access needs to be renewed. Please reconnect.");
      } else if (!result.connected) {
        toast.error("Connect GitHub first.");
      } else {
        toast.success(
          `Analyzed ${result.repos} permitted ${result.repos === 1 ? "repository" : "repositories"} · ${result.skillsRecorded} technology signals added as evidence.`,
        );
      }
      queryClient.invalidateQueries({ queryKey: ["github-evidence", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employee-bundle", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["github-status"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const connect = useMutation({
    mutationFn: async () => {
      const popup = window.open("", "talentiq-github-oauth", "width=600,height=760");
      if (!popup) throw new Error("Allow pop-ups for this site, then try again.");
      let code: string | null;
      try {
        const { authorizationUrl } = await runStartConnect();
        const completion = waitForOAuthCompletion(popup);
        popup.location.href = authorizationUrl;
        code = await completion;
      } catch (error) {
        popup.close();
        throw error;
      }
      if (code) await runComplete({ data: { code } });
      return true;
    },
    onSuccess: async () => {
      toast.success("GitHub connected");
      await queryClient.invalidateQueries({ queryKey: ["github-status"] });
      sync.mutate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const disconnect = useMutation({
    mutationFn: () => runDisconnect(),
    onSuccess: () => {
      toast.success("GitHub disconnected and its evidence removed");
      queryClient.invalidateQueries({ queryKey: ["github-status"] });
      queryClient.invalidateQueries({ queryKey: ["github-evidence", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employee-bundle", employeeId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function onUpload(file: File) {
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Please sign in again.");
      const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, "_");
      const path = `${uid}/${Date.now()}-${safeName}`;
      const upload = await supabase.storage.from("resumes").upload(path, file, {
        contentType: file.type || "application/octet-stream",
      });
      if (upload.error) throw new Error(upload.error.message);

      const result = await runProcessResume({ data: { filePath: path, fileName: file.name } });
      if (!result.readable) {
        toast.warning("Resume saved, but little readable text was found in the file.");
      } else {
        const added = result.applied;
        const parts = [
          added.skills ? `${added.skills} skills` : null,
          added.projects ? `${added.projects} projects` : null,
          added.certifications ? `${added.certifications} certifications` : null,
          added.learning ? `${added.learning} courses` : null,
          added.achievements ? `${added.achievements} achievements` : null,
        ].filter(Boolean);
        toast.success(
          parts.length
            ? `Resume read — added ${parts.join(", ")} to your profile.`
            : "Resume saved and read.",
        );
        if (result.githubUsername) {
          toast.info(`A GitHub profile was mentioned: ${result.githubUsername}. Connect it to add repository evidence.`);
        }
      }
      // Everything downstream (skills, roles, gaps, roadmap, learning, assistant)
      // reads from the profile, so refresh all of it after an upload.
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const latestResume = resumes.data?.[0];
  const detected = latestResume?.detected_github_username ?? null;
  const connected = status.data?.connected === true;
  const rows = (evidence.data ?? []) as unknown as GithubEvidenceRow[];
  const stats = githubStats(rows);

  if (compact) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
          <p className="text-sm font-semibold">Resume</p>
          <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">
            {latestResume ? `Uploaded: ${latestResume.file_name}` : "Upload a PDF or text resume for private analysis."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3"
            disabled={uploading || !employeeId}
            onClick={() => fileInput.current?.click()}
          >
            {uploading ? "Reading resume…" : latestResume ? "Replace resume" : "Upload resume"}
          </Button>
        </div>

        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-semibold">GitHub</p>
          <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">
            {connected
              ? `${status.data?.githubUsername ? `Connected as ${status.data.githubUsername}. ` : "Connected. "}${stats.repos} permitted repositories analyzed.`
              : "Authorize access before TalentMap AI reads any repository data."}
          </p>
          {connected ? (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={sync.isPending || !employeeId}
              onClick={() => sync.mutate()}
            >
              {sync.isPending ? "Analyzing repositories…" : "Refresh GitHub evidence"}
            </Button>
          ) : (
            <Button
              type="button"
              className="mt-3"
              disabled={connect.isPending || !employeeId}
              onClick={() => connect.mutate()}
            >
              {connect.isPending ? "Waiting for GitHub…" : "Connect GitHub"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div>
        <SectionTitle
          title="Resume"
          description="Upload a resume so TalentMap AI can read your experience. Files are private to you and HR."
        />
        <div className="panel space-y-4 p-6">
          <input
            ref={fileInput}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(file);
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {uploading ? "Reading resume…" : "Upload resume (PDF or text)"}
            </Button>
            {latestResume ? (
              <p className="text-xs text-muted-foreground">
                Latest: {latestResume.file_name} · uploaded{" "}
                {new Date(latestResume.created_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No resume uploaded yet.</p>
            )}
          </div>

          {detected ? (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <p className="text-sm font-semibold">
                Your resume mentions github.com/{detected}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                TalentMap AI has not opened it. Nothing is read from GitHub unless you authorize the
                connection yourself — including anything private.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <SectionTitle
          title="GitHub evidence"
          description="You authorize the connection, and only the repositories GitHub permits are analyzed."
        />
        <div className="panel space-y-5 p-6">
          <div className="flex flex-wrap items-center gap-3">
            {connected ? (
              <>
                <Chip tone="success">
                  Connected{status.data?.githubUsername ? ` · ${status.data.githubUsername}` : ""}
                </Chip>
                <Button
                  type="button"
                  variant="outline"
                  disabled={sync.isPending}
                  onClick={() => sync.mutate()}
                >
                  {sync.isPending ? "Analyzing repositories…" : "Refresh GitHub evidence"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={disconnect.isPending}
                  onClick={() => disconnect.mutate()}
                >
                  Disconnect
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  disabled={connect.isPending}
                  onClick={() => connect.mutate()}
                >
                  {connect.isPending ? "Waiting for GitHub…" : "Connect GitHub"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Optional. You can revoke access at any time.
                </p>
              </>
            )}
          </div>

          {connected && rows.length ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Repositories analyzed" value={stats.repos} />
                <Metric label="Languages detected" value={stats.languages.length} />
                <Metric label="Active projects" value={stats.activeProjects} />
                <Metric label="Stars on your work" value={stats.stars} />
              </div>

              <div>
                <p className="eyebrow">Technical signals</p>
                <div className="mt-3 space-y-2.5">
                  {stats.signals.slice(0, 6).map((signal) => (
                    <div key={signal.tech} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{signal.tech}</span>
                        <span className="font-mono tabular-nums text-muted-foreground">
                          {signal.repos} of {stats.repos} repositories
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.round(signal.strength * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Bars show how widely each technology appears across your authorized repositories —
                  evidence contributing to the assessment, not proof of proficiency on its own.
                </p>
              </div>
            </>
          ) : null}

          {connected && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No repository evidence yet — run “Refresh GitHub evidence”.
            </p>
          ) : null}

          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((repo) => (
              <div key={repo.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <a
                    href={repo.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold hover:underline"
                  >
                    {repo.repo_name}
                  </a>
                  <Chip tone={repo.is_private ? "warning" : "outline"}>
                    {repo.is_private ? "Private" : "Public"}
                  </Chip>
                </div>
                {repo.summary ? (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {repo.summary}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {repo.detected_tech.slice(0, 10).map((tech: string) => (
                    <Chip key={tech} tone="primary">
                      {tech}
                    </Chip>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Detected from languages and project manifests
                  {repo.last_pushed_at
                    ? ` · last activity ${new Date(repo.last_pushed_at).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            ))}
          </div>

          {rows.length ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              These technologies are evidence-based signals read from your authorized repositories,
              not a judgement of proficiency. They appear on your skill profile marked “GitHub
              evidence”.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="font-mono text-2xl font-semibold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
