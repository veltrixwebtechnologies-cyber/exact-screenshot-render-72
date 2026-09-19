import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { CircleDashed, CircleDot, Check } from "lucide-react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useGithubEvidence, useInternalRoles } from "@/hooks/useTalentData";
import { bandTone, matchRole, skillGaps } from "@/lib/talent";
import { evidenceMix, matchBreakdown, sourceBucket } from "@/lib/evidence";
import { AIDisclosure, Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/roles/$roleId")({
  head: () => ({
    meta: [
      { title: "Why this match — TalentMap AI" },
      {
        name: "description",
        content: "The evidence behind this internal role match, where each signal came from, and the skills still to build.",
      },
      { property: "og:title", content: "Why this match — TalentMap AI" },
      { property: "og:description", content: "Explainable internal role match with inspectable evidence." },
    ],
  }),
  component: RoleDetail,
});

function RoleDetail() {
  const { roleId } = useParams({ from: "/_authenticated/roles/$roleId" });
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const { data: repos } = useGithubEvidence(me?.employee.id);
  const { data: roles, isLoading } = useInternalRoles();
  const [showEvidence, setShowEvidence] = useState(false);

  if (isLoading || !roles) return <Skeleton className="h-96 w-full" />;

  const role = roles.find((r) => r.id === roleId);
  if (!role) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-sm font-semibold">Role not found</p>
        <Link to="/roles" className="mt-2 inline-block text-sm font-medium text-primary hover:underline">
          Back to roles
        </Link>
      </div>
    );
  }

  const skills = bundle?.skills ?? [];
  const insights = bundle?.insights ?? [];
  const capabilities = insights.map((i) => i.capability);
  const match = matchRole(role, skills, capabilities);
  const breakdown = matchBreakdown(role, skills, capabilities);
  const gaps = skillGaps(role, skills).filter((g) => g.gap > 0);
  const tone = bandTone(match.band);

  // Where the evidence behind *this* match came from.
  const mix = evidenceMix(breakdown.strong);
  const repoBySkill = (name: string) =>
    (repos ?? [])
      .filter((repo) => repo.detected_tech.some((tech) => tech.toLowerCase() === name.toLowerCase()))
      .map((repo) => repo.repo_name);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={role.department ?? "Internal role"}
        title={role.title}
        description={role.description ?? ""}
        actions={<Chip tone={tone === "muted" ? "outline" : tone}>{match.band}</Chip>}
      />

      <section>
        <SectionTitle
          title="Match analysis"
          description={`Your profile → ${role.title}. Coarse bands, not a score out of ten.`}
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <Column
            icon={<Check aria-hidden className="size-3.5 text-success" />}
            title="Strong evidence"
            hint="Recorded at a working level or better."
          >
            {breakdown.strong.length ? (
              breakdown.strong.map((skill) => (
                <Chip key={skill.name} tone="success">
                  {skill.name}
                </Chip>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Nothing at this level yet.</p>
            )}
          </Column>
          <Column
            icon={<CircleDot aria-hidden className="size-3.5 text-primary" />}
            title="Transferable"
            hint="Related evidence points this way — worth exploring, not proven."
          >
            {breakdown.transferable.length ? (
              breakdown.transferable.map((row) => (
                <Chip key={row.skill} tone="primary">
                  {row.skill}
                </Chip>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No transferable signals found.</p>
            )}
          </Column>
          <Column
            icon={<CircleDashed aria-hidden className="size-3.5 text-warning" />}
            title="Skill gaps"
            hint="Nothing on record for these yet."
          >
            {breakdown.gaps.length ? (
              breakdown.gaps.map((skill) => (
                <Chip key={skill} tone="warning">
                  {skill}
                </Chip>
              ))
            ) : (
              <p className="text-xs text-success">Requirements already covered.</p>
            )}
          </Column>
        </div>
      </section>

      <section className="panel space-y-5 p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Why this match?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Where the evidence behind this match came from.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={() => setShowEvidence((v) => !v)}>
            {showEvidence ? "Hide evidence" : "Show evidence"}
          </Button>
        </div>

        {mix.length ? (
          <div className="space-y-3">
            {mix.map((row) => (
              <div key={row.source} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{row.source}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {Math.round(row.share * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(row.share * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            There is no recorded evidence behind this role yet. Connect a resume or GitHub, or run a
            discovery interview.
          </p>
        )}

        {showEvidence ? (
          <div className="space-y-3 border-t border-border pt-4">
            {breakdown.strong.map((skill) => {
              const fromRepos = repoBySkill(skill.name);
              return (
                <div key={skill.name} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{skill.name}</p>
                    <Chip tone="outline">{sourceBucket(skill.source)}</Chip>
                    <span className="font-mono text-xs tabular-nums text-muted-foreground">
                      level {skill.proficiency}/5
                    </span>
                  </div>
                  {skill.evidence ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{skill.evidence}</p>
                  ) : null}
                  {fromRepos.length ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Seen in authorized GitHub repositories: {fromRepos.slice(0, 4).join(", ")}
                    </p>
                  ) : null}
                </div>
              );
            })}
            {match.capabilitySupport.length ? (
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-semibold">Potential capability signals</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Interview and profile evidence points at {match.capabilitySupport.join(", ")}. These
                  are indications to explore, not confirmed skills.
                </p>
              </div>
            ) : null}
            {breakdown.strong.length === 0 && match.capabilitySupport.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evidence recorded for this role yet.</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <section>
        <SectionTitle
          title="What you would need to build"
          description="Current level against the level this role usually asks for."
        />
        {gaps.length === 0 ? (
          <p className="text-sm text-success">Your recorded skills already cover this role's requirements.</p>
        ) : (
          <div className="panel divide-y divide-border">
            {gaps.map((gap) => (
              <div key={gap.skill} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-semibold">{gap.skill}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Your level {gap.currentLevel}/5 · role expects {gap.requiredLevel}/5
                  </p>
                </div>
                <Chip tone={gap.priority === "High" ? "destructive" : gap.priority === "Medium" ? "warning" : "muted"}>
                  {gap.priority} priority
                </Chip>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/skill-gaps" className="font-medium text-primary hover:underline">
            Build a development plan
          </Link>
          <Link to="/career-roadmap" className="font-medium text-primary hover:underline">
            See this role on your roadmap
          </Link>
        </div>
      </section>

      {role.experience_required ? (
        <p className="text-xs text-muted-foreground">
          This role is usually filled at around {role.experience_required} years of experience.
        </p>
      ) : null}

      <AIDisclosure>
        Match reasoning uses only the skills, projects, achievements, authorized GitHub evidence and
        capability insights on your record. Anything labelled potential capability is an indication to
        explore.
      </AIDisclosure>
    </div>
  );
}

function Column({
  icon,
  title,
  hint,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
