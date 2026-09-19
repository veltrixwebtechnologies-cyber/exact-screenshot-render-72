import { createFileRoute, Link } from "@tanstack/react-router";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { matchRole } from "@/lib/talent";
import { AIDisclosure, Chip, EmptyState, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { CapabilityCard } from "@/components/talent/capability-card";
import { RoleMatchCard } from "@/components/talent/role-match-card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/talent-discovery/results")({
  head: () => ({
    meta: [
      { title: "Discovery results — TalentMap AI" },
      {
        name: "description",
        content: "Your strongest demonstrated skills, potential capabilities, evidence and next steps.",
      },
      { property: "og:title", content: "Discovery results — TalentMap AI" },
      { property: "og:description", content: "Evidence-based capability insights." },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { data: me } = useMe();
  const { data: bundle, isLoading } = useEmployeeBundle(me?.employee.id);
  const { data: roles } = useInternalRoles();

  if (isLoading || !bundle) return <Skeleton className="h-96 w-full" />;

  const insights = bundle.insights;
  const strongest = [...bundle.skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 8);
  const explore = [...new Set(insights.flatMap((i) => i.explore))].slice(0, 8);
  const matches = (roles ?? [])
    .map((role) => matchRole(role, bundle.skills, insights.map((i) => i.capability)))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Discovery results"
        title="What your evidence suggests"
        description="Demonstrated skills, potential capabilities and the transferable strengths that came out of your session."
        actions={
          <Link
            to="/talent-discovery/assessment"
            className="inline-flex items-center rounded-md border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            Run again
          </Link>
        }
      />

      {insights.length === 0 ? (
        <EmptyState
          title="No results yet"
          description="Run a discovery session and TalentMap AI will generate capability insights with the evidence behind them."
          action={
            <Link to="/talent-discovery/assessment" className="text-sm font-medium text-primary hover:underline">
              Start a session
            </Link>
          }
        />
      ) : (
        <>
          <section>
            <SectionTitle
              title="Strongest demonstrated skills"
              description="Recorded with evidence — these are things you have visibly done."
            />
            <div className="flex flex-wrap gap-2">
              {strongest.map((skill) => (
                <Chip key={skill.name} tone="success">
                  {skill.name} · level {skill.proficiency}/5
                </Chip>
              ))}
              {strongest.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills recorded yet.</p>
              ) : null}
            </div>
          </section>

          <section>
            <SectionTitle
              title="Potential hidden capabilities"
              description="Each card explains why it was identified and which evidence supports it."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {insights.map((insight) => (
                <CapabilityCard key={insight.id} insight={insight} />
              ))}
            </div>
          </section>

          {explore.length ? (
            <section>
              <SectionTitle
                title="Areas worth exploring"
                description="Suggested directions based on the capabilities above."
              />
              <div className="flex flex-wrap gap-2">
                {explore.map((item) => (
                  <Chip key={item} tone="primary">
                    {item}
                  </Chip>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionTitle
              title="Recommended next steps"
              description="Where these capabilities could take you inside the organisation."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {matches.map((match) => (
                <RoleMatchCard key={match.role.id} match={match} />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link to="/skill-gaps" className="font-medium text-primary hover:underline">
                See what to develop
              </Link>
              <Link to="/career-roadmap" className="font-medium text-primary hover:underline">
                Build a career roadmap
              </Link>
              <Link to="/career-assistant" className="font-medium text-primary hover:underline">
                Ask Career AI about these results
              </Link>
            </div>
          </section>
        </>
      )}

      <AIDisclosure>
        These are evidence-based indications of potential capability, generated from your recorded
        data and session answers. They are a starting point for a conversation, not a verdict.
      </AIDisclosure>
    </div>
  );
}
