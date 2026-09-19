import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, TrendingUp, Telescope } from "lucide-react";

import { emergingSkills } from "@/lib/talent.functions";
import { AIDisclosure, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { StaffGuard } from "@/components/talent/staff-guard";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/hr/emerging-skills")({
  head: () => ({
    meta: [
      { title: "Emerging skills — TalentIQ" },
      {
        name: "description",
        content: "AI-generated organisational insight on growing capability, current shortages and future gaps.",
      },
      { property: "og:title", content: "Emerging skills — TalentIQ" },
      { property: "og:description", content: "Where workforce capability is heading." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <EmergingSkillsPage />
    </StaffGuard>
  ),
});

function EmergingSkillsPage() {
  const fetchTrends = useServerFn(emergingSkills);
  const { data, isLoading } = useQuery({
    queryKey: ["emerging-skills"],
    queryFn: () => fetchTrends({}),
    staleTime: 5 * 60_000,
  });

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const groups = [
    { key: "growing", icon: TrendingUp, title: "Growing capability", description: "Skills the workforce is actively building.", items: data.growing, tone: "text-success" },
    { key: "shortages", icon: AlertTriangle, title: "Current shortages", description: "Demanded by open roles but thinly held.", items: data.shortages, tone: "text-warning" },
    { key: "future", icon: Telescope, title: "Future gaps", description: "Asked for with no recorded capability behind it.", items: data.futureGaps, tone: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Emerging skills"
        title="Where capability is heading"
        description="AI-generated organisational insight, derived from recorded skills, learning activity and published role requirements."
      />

      {data.mode === "computed" ? (
        <AIDisclosure>
          The AI analysis is unavailable right now, so these trends were computed directly from recorded
          learning activity and role demand.
        </AIDisclosure>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {groups.map((group) => (
          <section key={group.key}>
            <SectionTitle title={group.title} description={group.description} />
            <div className="space-y-3">
              {group.items.map((item) => (
                <div key={item.skill} className="panel p-4">
                  <div className="flex items-center gap-2">
                    <group.icon aria-hidden className={`size-4 ${group.tone}`} />
                    <p className="text-sm font-semibold">{item.skill}</p>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.insight}</p>
                </div>
              ))}
              {group.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing detected from the current data.</p>
              ) : null}
            </div>
          </section>
        ))}
      </div>

      <AIDisclosure>
        These are AI-generated organisational insights, not forecasts. Treat them as prompts for workforce
        planning conversations.
      </AIDisclosure>
    </div>
  );
}
