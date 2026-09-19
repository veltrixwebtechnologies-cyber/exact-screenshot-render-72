import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { matchRole } from "@/lib/talent";
import {
  AIDisclosure,
  Chip,
  EmptyState,
  PageHeader,
  SectionTitle,
  StatCard,
} from "@/components/talent/primitives";
import { CapabilityCard } from "@/components/talent/capability-card";
import { RoleMatchCard } from "@/components/talent/role-match-card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your talent dashboard — TalentMap AI" },
      {
        name: "description",
        content:
          "See your strongest skills, potential capabilities, matching internal roles and what to learn next.",
      },
      { property: "og:title", content: "Your talent dashboard — TalentMap AI" },
      { property: "og:description", content: "Evidence-based talent intelligence for your career." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: me, isLoading: meLoading } = useMe();
  const { data: bundle, isLoading } = useEmployeeBundle(me?.employee.id);
  const { data: roles } = useInternalRoles();

  if (meLoading || isLoading || !me) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const skills = bundle?.skills ?? [];
  const insights = bundle?.insights ?? [];
  const capabilities = insights.map((i) => i.capability);
  const matches = (roles ?? [])
    .map((role) => matchRole(role, skills, capabilities))
    .sort((a, b) => b.score - a.score);
  const topSkills = [...skills].sort((a, b) => b.proficiency - a.proficiency).slice(0, 6);
  const gapCount = matches[0]?.missing.length ?? 0;
  const firstName = me.employee.name.split(" ")[0];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Your talent profile"
        title={`Hello ${firstName}`}
        description="This is what your recorded experience and discovery session suggest about your capabilities — always with the evidence behind it."
        actions={
          <Link
            to="/talent-discovery"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles aria-hidden className="size-4" />
            {insights.length ? "Run discovery again" : "Start talent discovery"}
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Skills on record" value={skills.length} hint="From profile, projects and learning" />
        <StatCard
          label="Potential capabilities"
          value={insights.length}
          tone="primary"
          hint="Identified with supporting evidence"
        />
        <StatCard
          label="Matching roles"
          value={matches.filter((m) => m.score >= 0.35).length}
          tone="success"
          hint="Internal opportunities worth exploring"
        />
        <StatCard label="Skills to build" value={gapCount} tone="warning" hint="For your closest role match" />
      </div>

      <section>
        <SectionTitle
          title="What you are demonstrably good at"
          description="Skills recorded with evidence from your projects, certifications and learning history."
          action={
            <Link to="/profile" className="text-sm font-medium text-primary hover:underline">
              Manage profile
            </Link>
          }
        />
        {topSkills.length === 0 ? (
          <EmptyState
            title="No skills recorded yet"
            description="Add your projects, achievements and certifications and TalentMap AI will build your skill profile from them."
            action={
              <Link to="/profile" className="text-sm font-medium text-primary hover:underline">
                Go to profile
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topSkills.map((skill) => (
              <div key={skill.name} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{skill.name}</p>
                  <Chip tone="outline">Level {skill.proficiency}/5</Chip>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {skill.evidence ?? `Recorded from ${skill.source}.`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          title="Potential capabilities"
          description="Capabilities suggested by your evidence. These are indications to explore, not proof of talent."
        />
        {insights.length === 0 ? (
          <EmptyState
            title="No capability insights yet"
            description="Run a discovery session and TalentMap AI will combine your answers with your recorded experience."
            action={
              <Link to="/talent-discovery" className="text-sm font-medium text-primary hover:underline">
                Start discovery
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {insights.slice(0, 4).map((insight) => (
              <CapabilityCard key={insight.id} insight={insight} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          title="Internal roles worth exploring"
          description="Matching is explainable and deliberately coarse — a band, not a precise score."
          action={
            <Link to="/roles" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              All roles <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          {matches.slice(0, 4).map((match) => (
            <RoleMatchCard key={match.role.id} match={match} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="What to learn next"
          description="Recommendations tied to the skills your target roles actually ask for."
          action={
            <Link to="/learning" className="text-sm font-medium text-primary hover:underline">
              Learning plan
            </Link>
          }
        />
        <div className="grid gap-3 lg:grid-cols-2">
          {(bundle?.recommendations ?? []).slice(0, 4).map((rec) => (
            <div key={rec.id} className="panel p-4">
              <div className="flex items-center gap-2">
                <Chip tone="primary">{rec.type}</Chip>
                {rec.related_skill ? <Chip tone="outline">{rec.related_skill}</Chip> : null}
              </div>
              <p className="mt-3 text-sm font-semibold">{rec.title}</p>
              {rec.reason ? (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{rec.reason}</p>
              ) : null}
            </div>
          ))}
          {(bundle?.recommendations ?? []).length === 0 ? (
            <div className="lg:col-span-2">
              <EmptyState
                title="No recommendations yet"
                description="Pick a target role on the skill gaps page and TalentMap AI will build a development plan from the gaps."
                action={
                  <Link to="/skill-gaps" className="text-sm font-medium text-primary hover:underline">
                    Analyse skill gaps
                  </Link>
                }
              />
            </div>
          ) : null}
        </div>
      </section>

      <AIDisclosure>
        Capability insights are evidence-based indications generated from your recorded data. They
        describe potential strengths to explore and never claim to prove talent.
      </AIDisclosure>
    </div>
  );
}
