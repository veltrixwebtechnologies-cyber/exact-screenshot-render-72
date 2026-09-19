import { createFileRoute } from "@tanstack/react-router";
import { ResumeGate } from "@/components/talent/resume-gate";
import { useState } from "react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { matchRole, skillGaps, type RoleLike } from "@/lib/talent";
import { AIDisclosure, Chip, PageHeader } from "@/components/talent/primitives";
import { CareerGraph, CoverageBar } from "@/components/talent/career-graph";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/career-roadmap")({
  head: () => ({
    meta: [
      { title: "Career roadmap — TalentMap AI" },
      {
        name: "description",
        content: "A step-by-step path from your current role to a long-term destination, with the skills each step needs.",
      },
      { property: "og:title", content: "Career roadmap — TalentMap AI" },
      { property: "og:description", content: "Current, next, possible future and long-term steps." },
    ],
  }),
  component: () => (
    <ResumeGate what="Your career roadmap">
      <RoadmapPage />
    </ResumeGate>
  ),
});

function RoadmapPage() {
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const { data: roles, isLoading } = useInternalRoles();
  const [destinationId, setDestinationId] = useState<string | null>(null);

  if (isLoading || !roles || !me) return <Skeleton className="h-96 w-full" />;

  const skills = bundle?.skills ?? [];
  const capabilities = (bundle?.insights ?? []).map((i) => i.capability);
  const ranked = roles
    .map((role) => matchRole(role, skills, capabilities))
    .sort((a, b) => b.score - a.score);

  const destination = roles.find((r) => r.id === destinationId) ?? ranked[ranked.length - 1]?.role;
  const nextStep = ranked[0]?.role;
  const future = ranked[1]?.role ?? nextStep;

  const steps: Array<{ label: string; title: string; role: RoleLike | undefined; horizon: string }> = [
    { label: "Current", title: me.employee.job_title ?? "Current role", role: undefined, horizon: "Today" },
    { label: "Next", title: nextStep?.title ?? "—", role: nextStep, horizon: "6–12 months" },
    { label: "Possible future", title: future?.title ?? "—", role: future, horizon: "1–2 years" },
    { label: "Long term", title: destination?.title ?? "—", role: destination, horizon: "3+ years" },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Grow"
        title="Your career roadmap"
        description="Built from your closest role matches. Each step lists the skills it needs, what you already have and what to build."
        actions={
          <Select value={destination?.id ?? ""} onValueChange={setDestinationId}>
            <SelectTrigger className="sm:w-72">
              <SelectValue placeholder="Choose a long-term destination" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <CareerGraph
        currentRole={me.employee.job_title ?? "Current role"}
        branches={ranked.slice(0, 4)}
        selectedId={destination?.id ?? null}
        onSelect={setDestinationId}
      />

      {destination ? (
        <section className="panel space-y-5 p-6">
          <div>
            <p className="eyebrow">Selected destination</p>
            <h2 className="mt-1 text-base font-semibold">{destination.title}</h2>
          </div>
          {(() => {
            const rows = skillGaps(destination, skills);
            const total = rows.length || 1;
            const covered = rows.filter((row) => row.gap === 0).length;
            const missing = rows.filter((row) => row.gap > 0);
            return (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <CoverageBar label="Current capabilities" value={covered / total} />
                  <CoverageBar
                    label="Missing capabilities"
                    value={missing.length / total}
                    tone="warning"
                  />
                </div>
                <div>
                  <p className="eyebrow">Recommended next steps</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {missing.slice(0, 3).map((row) => (
                      <li key={row.skill}>
                        → Take on a project or course that builds {row.skill} (level{" "}
                        {row.currentLevel}/5 today, {row.requiredLevel}/5 expected)
                      </li>
                    ))}
                    {missing.length ? (
                      <li>→ Pair with someone strong in {missing[0]?.skill} for regular feedback</li>
                    ) : (
                      <li>→ Your recorded evidence already covers this destination's requirements</li>
                    )}
                  </ul>
                </div>
              </>
            );
          })()}
        </section>
      ) : null}

      <ol className="space-y-4">
        {steps.map((step, index) => {
          const gaps = step.role ? skillGaps(step.role, skills).filter((g) => g.gap > 0) : [];
          const have = step.role ? skillGaps(step.role, skills).filter((g) => g.gap === 0) : [];
          return (
            <li key={step.label} className="relative pl-8">
              <span className="absolute left-0 top-5 grid size-6 place-items-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              {index < steps.length - 1 ? (
                <span aria-hidden className="absolute left-3 top-11 h-[calc(100%-1rem)] w-px bg-border" />
              ) : null}
              <div className="panel space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="eyebrow">{step.label}</p>
                    <h2 className="mt-1 text-base font-semibold">{step.title}</h2>
                  </div>
                  <Chip tone="outline">{step.horizon}</Chip>
                </div>
                {step.role ? (
                  <>
                    <div>
                      <p className="eyebrow">Skills you already have</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {have.length ? (
                          have.map((row) => (
                            <Chip key={row.skill} tone="success">
                              {row.skill}
                            </Chip>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">None recorded yet for this step.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="eyebrow">Skills to build</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {gaps.length ? (
                          gaps.map((row) => (
                            <Chip key={row.skill} tone="warning">
                              {row.skill}
                            </Chip>
                          ))
                        ) : (
                          <p className="text-xs text-success">Requirements already covered.</p>
                        )}
                      </div>
                    </div>
                    {gaps.length ? (
                      <div className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">
                        <p className="font-semibold text-foreground">How to get there</p>
                        <p className="mt-1">
                          Take on a project that uses {gaps[0]?.skill}, pair with someone strong in{" "}
                          {(gaps[0]?.skill ?? "").toLowerCase()}, and complete a focused course or certification in it.
                        </p>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {me.employee.department ? `${me.employee.department} · ` : ""}
                    {skills.length} skills and {capabilities.length} potential capabilities on record.
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <AIDisclosure>
        The roadmap is generated from published internal roles and your recorded evidence. Timeframes are
        typical ranges, not commitments.
      </AIDisclosure>
    </div>
  );
}
