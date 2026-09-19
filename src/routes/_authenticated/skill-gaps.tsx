import { createFileRoute, Link } from "@tanstack/react-router";
import { ResumeGate } from "@/components/talent/resume-gate";
import { useState } from "react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { matchRole, skillGaps } from "@/lib/talent";
import { AIDisclosure, Chip, PageHeader, SectionTitle, StatCard } from "@/components/talent/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/skill-gaps")({
  head: () => ({
    meta: [
      { title: "Skill gaps — TalentMap AI" },
      {
        name: "description",
        content: "Compare your current skills with a target internal role and get a development plan.",
      },
      { property: "og:title", content: "Skill gaps — TalentMap AI" },
      { property: "og:description", content: "Turn gaps into a specific development plan." },
    ],
  }),
  component: () => (
    <ResumeGate what="Skill gap analysis">
      <SkillGapsPage />
    </ResumeGate>
  ),
});

function SkillGapsPage() {
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const { data: roles, isLoading } = useInternalRoles();
  const [targetId, setTargetId] = useState<string | null>(null);

  if (isLoading || !roles) return <Skeleton className="h-96 w-full" />;

  const skills = bundle?.skills ?? [];
  const capabilities = (bundle?.insights ?? []).map((i) => i.capability);
  const ranked = roles
    .map((role) => matchRole(role, skills, capabilities))
    .sort((a, b) => b.score - a.score);
  const target = roles.find((r) => r.id === targetId) ?? ranked[0]?.role;

  if (!target) {
    return <p className="text-sm text-muted-foreground">No internal roles have been published yet.</p>;
  }

  const rows = skillGaps(target, skills);
  const strong = rows.filter((r) => r.gap === 0);
  const develop = rows.filter((r) => r.gap > 0);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Develop"
        title="Skill gap analysis"
        description="Pick the role you are aiming for. TalentMap AI compares its requirements with what you already have on record."
        actions={
          <Select value={target.id} onValueChange={setTargetId}>
            <SelectTrigger className="sm:w-72">
              <SelectValue placeholder="Choose a target role" />
            </SelectTrigger>
            <SelectContent>
              {ranked.map((match) => (
                <SelectItem key={match.role.id} value={match.role.id}>
                  {match.role.title} · {match.band}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Already strong" value={strong.length} tone="success" hint="Requirements you meet" />
        <StatCard label="Needs development" value={develop.length} tone="warning" hint="Gaps to close" />
        <StatCard
          label="High priority"
          value={develop.filter((r) => r.priority === "High").length}
          hint="Not on your record at all"
        />
      </div>

      <section>
        <SectionTitle title="Already strong" description={`Requirements for ${target.title} that your record covers.`} />
        <div className="flex flex-wrap gap-2">
          {strong.map((row) => (
            <Chip key={row.skill} tone="success">
              {row.skill} · level {row.currentLevel}/5
            </Chip>
          ))}
          {strong.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet — start with the highest priority gap below.</p>
          ) : null}
        </div>
      </section>

      <section>
        <SectionTitle title="Needs development" description="Ordered by the size of the gap." />
        <div className="panel divide-y divide-border">
          {develop.map((row) => (
            <div key={row.skill} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">{row.skill}</p>
                <Chip tone={row.priority === "High" ? "destructive" : row.priority === "Medium" ? "warning" : "muted"}>
                  {row.priority} priority
                </Chip>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-warning"
                  style={{ width: `${(row.currentLevel / row.requiredLevel) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your level {row.currentLevel}/5 · {target.title} expects {row.requiredLevel}/5. Recommended
                because this skill is required for your selected target role.
              </p>
            </div>
          ))}
          {develop.length === 0 ? (
            <p className="p-4 text-sm text-success">You already meet every requirement recorded for this role.</p>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Link to="/learning" className="font-medium text-primary hover:underline">
            See learning recommendations
          </Link>
          <Link to="/career-roadmap" className="font-medium text-primary hover:underline">
            Put this on a roadmap
          </Link>
        </div>
      </section>

      <AIDisclosure>
        Expected levels are indicative role benchmarks, not a formal competency framework. Use them to
        prioritise development, not to judge performance.
      </AIDisclosure>
    </div>
  );
}
