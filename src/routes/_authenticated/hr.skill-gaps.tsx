import { createFileRoute } from "@tanstack/react-router";

import { useWorkforce } from "@/hooks/useTalentData";
import { AIDisclosure, Chip, PageHeader, SectionTitle, StatCard } from "@/components/talent/primitives";
import { StaffGuard } from "@/components/talent/staff-guard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/hr/skill-gaps")({
  head: () => ({
    meta: [
      { title: "Organisational skill gaps — TalentMap AI" },
      {
        name: "description",
        content: "Compare what open internal roles require with the capability recorded across the workforce.",
      },
      { property: "og:title", content: "Organisational skill gaps — TalentMap AI" },
      { property: "og:description", content: "Demand versus supply across the workforce." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <OrgSkillGaps />
    </StaffGuard>
  ),
});

function OrgSkillGaps() {
  const { data, isLoading } = useWorkforce();
  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const supply = new Map<string, number>();
  for (const row of data.skills) {
    const name = row.skills?.name;
    if (name) supply.set(name, (supply.get(name) ?? 0) + 1);
  }

  const demand = new Map<string, number>();
  for (const role of data.roles) {
    for (const name of [...(role.required_skills ?? []), ...(role.preferred_skills ?? [])]) {
      demand.set(name, (demand.get(name) ?? 0) + 1);
    }
  }

  const rows = [...demand.entries()]
    .map(([skill, demanded]) => ({ skill, demanded, held: supply.get(skill) ?? 0 }))
    .sort((a, b) => b.demanded - b.held - (a.demanded - a.held));

  const critical = rows.filter((r) => r.held === 0);
  const thin = rows.filter((r) => r.held > 0 && r.held <= 2);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Skill gap analysis"
        title="Demand against recorded supply"
        description="Skills asked for by open internal roles, compared with how many people have them on record."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Skills in demand" value={rows.length} />
        <StatCard label="Nobody on record" value={critical.length} tone="warning" />
        <StatCard label="Thin coverage" value={thin.length} hint="Held by one or two people" />
      </div>

      <section>
        <SectionTitle title="Gap table" description="Ordered by the size of the shortfall." />
        <div className="panel divide-y divide-border">
          {rows.map((row) => (
            <div key={row.skill} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-semibold">{row.skill}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Required by {row.demanded} role{row.demanded > 1 ? "s" : ""} · held by {row.held}{" "}
                  {row.held === 1 ? "person" : "people"}
                </p>
              </div>
              <Chip tone={row.held === 0 ? "destructive" : row.held <= 2 ? "warning" : "success"}>
                {row.held === 0 ? "Critical gap" : row.held <= 2 ? "Thin coverage" : "Covered"}
              </Chip>
            </div>
          ))}
          {rows.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No internal roles have been published yet.</p>
          ) : null}
        </div>
      </section>

      <AIDisclosure>
        Gaps are computed from recorded skills and published role requirements. Improving the data on
        employee profiles usually closes part of an apparent gap.
      </AIDisclosure>
    </div>
  );
}
