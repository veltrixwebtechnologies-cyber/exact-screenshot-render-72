import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Search, TrendingUp, Users } from "lucide-react";

import { useWorkforce } from "@/hooks/useTalentData";
import { AIDisclosure, Chip, PageHeader, SectionTitle, StatCard } from "@/components/talent/primitives";
import { StaffGuard } from "@/components/talent/staff-guard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/hr/")({
  head: () => ({
    meta: [
      { title: "Workforce intelligence — TalentIQ" },
      {
        name: "description",
        content: "Workforce capability overview: skills identified, potential capabilities, internal opportunities and gaps.",
      },
      { property: "og:title", content: "Workforce intelligence — TalentIQ" },
      { property: "og:description", content: "Capability intelligence for HR teams." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <HrOverview />
    </StaffGuard>
  ),
});

const sections = [
  { to: "/hr/talent-search" as const, icon: Search, title: "Talent search", body: "Search by meaning: 'someone who can mentor junior developers'." },
  { to: "/hr/skills" as const, icon: Users, title: "Skill intelligence", body: "Department by skill coverage across the workforce." },
  { to: "/hr/internal-mobility" as const, icon: ArrowRight, title: "Internal mobility", body: "Publish roles and see who inside already fits." },
  { to: "/hr/emerging-skills" as const, icon: TrendingUp, title: "Emerging skills", body: "Growing capability, shortages and future gaps." },
];

function HrOverview() {
  const { data, isLoading } = useWorkforce();
  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const uniqueSkills = new Set(data.skills.map((s) => s.skills?.name).filter(Boolean));
  const demandedSkills = new Set(
    data.roles.flatMap((r) => [...(r.required_skills ?? []), ...(r.preferred_skills ?? [])]),
  );
  const missing = [...demandedSkills].filter((skill) => !uniqueSkills.has(skill));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="HR workspace"
        title="Workforce capability at a glance"
        description="Everything here is generated from recorded employee evidence. Capability insights are indications, not ratings."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Employees" value={data.employees.length} />
        <StatCard label="Skills identified" value={uniqueSkills.size} tone="primary" />
        <StatCard label="Potential capabilities" value={data.insights.length} tone="primary" />
        <StatCard label="Internal opportunities" value={data.roles.length} tone="success" />
        <StatCard label="Unmet skill demands" value={missing.length} tone="warning" />
      </div>

      <section>
        <SectionTitle title="Where to go next" />
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <Link key={section.to} to={section.to} className="panel block p-5 transition-colors hover:bg-accent/50">
              <span className="grid size-8 place-items-center rounded-md bg-primary-soft text-primary-soft-foreground">
                <section.icon aria-hidden className="size-4" />
              </span>
              <p className="mt-4 text-sm font-semibold">{section.title}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{section.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Talent marketplace"
          description="Recently identified potential capabilities across the workforce."
        />
        <div className="flex flex-wrap gap-2">
          {data.insights.slice(0, 16).map((insight, index) => (
            <Chip key={`${insight.employee_id}-${index}`} tone="primary">
              {insight.capability} · {Math.round(Number(insight.confidence) * 100)}%
            </Chip>
          ))}
          {data.insights.length === 0 ? (
            <p className="text-sm text-muted-foreground">No capability insights recorded yet.</p>
          ) : null}
        </div>
      </section>

      <AIDisclosure>
        Organisational figures count recorded evidence only. Potential capabilities describe indications
        worth a conversation and must not be used as a performance measure.
      </AIDisclosure>
    </div>
  );
}
