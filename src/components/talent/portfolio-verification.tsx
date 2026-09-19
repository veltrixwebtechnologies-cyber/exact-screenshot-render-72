import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Chip, SectionTitle } from "@/components/talent/primitives";
import { deletePortfolioVerification, verifyPortfolio } from "@/lib/portfolio.functions";
import {
  STRENGTH_LABEL,
  STRENGTH_TONE,
  type PortfolioVerificationRow,
} from "@/lib/portfolio";

export function PortfolioVerificationSection({
  employeeId,
  compact = false,
}: {
  employeeId: string | undefined;
  compact?: boolean;
}) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const runVerify = useServerFn(verifyPortfolio);
  const runDelete = useServerFn(deletePortfolioVerification);

  const checks = useQuery({
    queryKey: ["portfolio-verifications", employeeId],
    enabled: Boolean(employeeId),
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("portfolio_verifications")
        .select("*")
        .eq("employee_id", employeeId)
        .order("checked_at", { ascending: false });
      if (error) throw error;
      return data as unknown as PortfolioVerificationRow[];
    },
  });

  const verify = useMutation({
    mutationFn: (portfolioUrl: string) => runVerify({ data: { portfolioUrl } }),
    onSuccess: (result) => {
      toast.success(
        `Checked ${result.claims} ${result.claims === 1 ? "claim" : "claims"} against ${result.reposConsidered} authorized ${result.reposConsidered === 1 ? "repository" : "repositories"}.`,
      );
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["portfolio-verifications", employeeId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => runDelete({ data: { id } }),
    onSuccess: () => {
      toast.success("Portfolio check removed");
      queryClient.invalidateQueries({ queryKey: ["portfolio-verifications", employeeId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = checks.data ?? [];
  const latest = rows[0];

  const form = (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (url.trim()) verify.mutate(url.trim());
      }}
    >
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="myportfolio.com"
        className="max-w-xs"
        disabled={verify.isPending || !employeeId}
      />
      <Button type="submit" disabled={verify.isPending || !employeeId || !url.trim()}>
        {verify.isPending ? "Checking claims…" : "Verify portfolio"}
      </Button>
    </form>
  );

  if (compact) {
    return (
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-semibold">Portfolio</p>
        <p className="mt-1 min-h-10 text-xs leading-relaxed text-muted-foreground">
          {latest
            ? `${new URL(latest.portfolio_url).hostname} · ${latest.claims.length} claims checked · ${STRENGTH_LABEL[latest.overall_strength]}`
            : "Add your portfolio link so its claims can be checked against your evidence."}
        </p>
        <div className="mt-3">{form}</div>
      </div>
    );
  }

  return (
    <div>
      <SectionTitle
        title="Portfolio verification"
        description="We don't just check that your portfolio exists — each claim on it is compared with the repository evidence you authorized."
      />
      <div className="panel space-y-5 p-6">
        {form}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Claims are read from the page you submit. Nothing is called “100% verified” — each claim
          shows how strong the supporting evidence currently is, and where it is missing.
        </p>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No portfolio checked yet.</p>
        ) : null}

        {rows.map((row) => (
          <div key={row.id} className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <a
                  href={row.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold hover:underline"
                >
                  {row.page_title ?? row.portfolio_url}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.claims.length} {row.claims.length === 1 ? "claim" : "claims"} ·{" "}
                  {row.detected_repo_links.length} repository{" "}
                  {row.detected_repo_links.length === 1 ? "link" : "links"} found · checked{" "}
                  {new Date(row.checked_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Chip tone={STRENGTH_TONE[row.overall_strength]}>
                  {STRENGTH_LABEL[row.overall_strength]}
                </Chip>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(row.id)}
                >
                  Remove
                </Button>
              </div>
            </div>

            {row.notes ? (
              <p className="rounded-md border border-border bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                {row.notes}
              </p>
            ) : null}

            <div className="space-y-3">
              {row.claims.map((claim, index) => {
                const key = `${row.id}-${index}`;
                const expanded = open === key;
                return (
                  <div key={key} className="rounded-md border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="max-w-xl text-sm leading-relaxed">{claim.claim}</p>
                      <Chip tone={STRENGTH_TONE[claim.strength]}>
                        {STRENGTH_LABEL[claim.strength]}
                      </Chip>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {claim.note}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {claim.repo_url ? (
                        <a
                          href={claim.repo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {claim.repo_name}
                        </a>
                      ) : null}
                      {claim.technologies.slice(0, 6).map((tech) => (
                        <Chip key={tech} tone="primary">
                          {tech}
                        </Chip>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 px-0"
                      onClick={() => setOpen(expanded ? null : key)}
                    >
                      {expanded ? "Hide evidence" : "Show evidence"}
                    </Button>
                    {expanded ? (
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="eyebrow text-success">Why this is good</p>
                          <ul className="mt-2 space-y-1.5">
                            {claimReasons(claim).good.map((line) => (
                              <li key={line} className="flex gap-2 text-xs leading-relaxed">
                                <span className="font-semibold text-success">✓</span>
                                <span>{line}</span>
                              </li>
                            ))}
                            {claimReasons(claim).good.length === 0 ? (
                              <li className="text-xs text-muted-foreground">
                                Nothing supports this claim yet.
                              </li>
                            ) : null}
                          </ul>
                        </div>
                        <div>
                          <p className="eyebrow text-warning">What is missing</p>
                          <ul className="mt-2 space-y-1.5">
                            {claimReasons(claim).bad.map((line) => (
                              <li
                                key={line}
                                className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                              >
                                <span className="font-semibold">○</span>
                                <span>{line}</span>
                              </li>
                            ))}
                            {claimReasons(claim).bad.length === 0 ? (
                              <li className="text-xs text-muted-foreground">
                                Every check passed for this claim.
                              </li>
                            ) : null}
                          </ul>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
