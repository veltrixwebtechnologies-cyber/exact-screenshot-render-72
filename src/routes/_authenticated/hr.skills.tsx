import { createFileRoute } from "@tanstack/react-router";

import { useWorkforce } from "@/hooks/useTalentData";
import { AIDisclosure, Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { StaffGuard } from "@/components/talent/staff-guard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/hr/skills")({
  head: () => ({
    meta: [
      { title: "Skill intelligence — TalentMap AI" },
      {
        name: "description",
        content: "Skill coverage by department: strong, moderate, low or missing across the workforce.",
      },
      { property: "og:title", content: "Skill intelligence — TalentMap AI" },
      { property: "og:description", content: "Department by skill capability coverage." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <SkillIntelligence />
    </StaffGuard>
  ),
});

type Level = "Strong" | "Moderate" | "Low" | "Missing";

function levelFor(avg: number | null): Level {
  if (avg === null) return "Missing";
  if (avg >= 4) return "Strong";
  if (avg >= 3) return "Moderate";
  return "Low";
}

const levelClass: Record<Level, string> = {
  Strong: "bg-success-soft text-success",
  Moderate: "bg-primary-soft text-primary-soft-foreground",
  Low: "bg-warning-soft text-warning",
  Missing: "bg-muted text-muted-foreground",
};

function SkillIntelligence() {
  const { data, isLoading } = useWorkforce();
  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const departments = [...new Set(data.employees.map((e) => e.department).filter(Boolean))] as string[];
  const deptByEmployee = new Map(data.employees.map((e) => [e.id, e.department]));

  const skillCounts = new Map<string, number>();
  for (const row of data.skills) {
    const name = row.skills?.name;
    if (name) skillCounts.set(name, (skillCounts.get(name) ?? 0) + 1);
  }
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name]) => name);

  const allSkills = data.skills;
  function cell(department: string, skill: string): Level {
    const values = allSkills
      .filter((row) => row.skills?.name === skill && deptByEmployee.get(row.employee_id) === department)
      .map((row) => Number(row.proficiency));
    if (values.length === 0) return "Missing";
    return levelFor(values.reduce((a, b) => a + b, 0) / values.length);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Skill intelligence"
        title="Where capability sits"
        description="Average recorded proficiency per department and skill. Empty cells mean nothing has been recorded, not that nobody can do it."
      />

      <section>
        <SectionTitle title="Department × skill coverage" />
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Department
                </th>
                {topSkills.map((skill) => (
                  <th key={skill} className="px-2 py-3 text-left text-xs font-medium text-muted-foreground">
                    {skill}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => (
                <tr key={department} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{department}</td>
                  {topSkills.map((skill) => {
                    const level = cell(department, skill);
                    return (
                      <td key={skill} className="px-2 py-3">
                        <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${levelClass[level]}`}>
                          {level}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <SectionTitle title="Most widely held skills" description="Count of people with the skill on record." />
        <div className="flex flex-wrap gap-2">
          {[...skillCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20)
            .map(([skill, count]) => (
              <Chip key={skill} tone="outline">
                {skill} · {count}
              </Chip>
            ))}
        </div>
      </section>

      <AIDisclosure>
        Coverage reflects recorded evidence only. A missing cell is a data gap as often as a capability gap.
      </AIDisclosure>
    </div>
  );
}
