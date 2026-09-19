import { createFileRoute, Link, useParams } from "@tanstack/react-router";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { bandTone, matchRole, skillGaps } from "@/lib/talent";
import { AIDisclosure, Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/roles/$roleId")({
  head: () => ({
    meta: [
      { title: "Role detail — TalentIQ" },
      {
        name: "description",
        content: "Why this internal role matches your evidence, and the skills you would still need to build.",
      },
      { property: "og:title", content: "Role detail — TalentIQ" },
      { property: "og:description", content: "Explainable internal role match." },
    ],
  }),
  component: RoleDetail,
});

function RoleDetail() {
  const { roleId } = useParams({ from: "/_authenticated/roles/$roleId" });
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const { data: roles, isLoading } = useInternalRoles();

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

  const insights = bundle?.insights ?? [];
  const match = matchRole(role, bundle?.skills ?? [], insights.map((i) => i.capability));
  const gaps = skillGaps(role, bundle?.skills ?? []).filter((g) => g.gap > 0);
  const tone = bandTone(match.band);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={role.department ?? "Internal role"}
        title={role.title}
        description={role.description ?? ""}
        actions={<Chip tone={tone === "muted" ? "outline" : tone}>{match.band}</Chip>}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Why this role matches you</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {match.matched.length ? (
              <li>
                You already have {match.matched.length} of {role.required_skills.length} required skills:{" "}
                <span className="font-medium text-foreground">{match.matched.join(", ")}</span>.
              </li>
            ) : (
              <li>None of the required skills are on your record yet.</li>
            )}
            {match.preferredMatched.length ? (
              <li>
                You also hold preferred skills:{" "}
                <span className="font-medium text-foreground">{match.preferredMatched.join(", ")}</span>.
              </li>
            ) : null}
            {match.capabilitySupport.length ? (
              <li>
                Potential capability detected in{" "}
                <span className="font-medium text-foreground">{match.capabilitySupport.join(", ")}</span> — based
                on your recorded evidence, not a confirmed skill.
              </li>
            ) : null}
            {role.experience_required ? (
              <li>This role is usually filled at around {role.experience_required} years of experience.</li>
            ) : null}
          </ul>
        </div>
        <div className="panel p-5">
          <h2 className="text-sm font-semibold">Requirements</h2>
          <p className="eyebrow mt-4">Required</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {role.required_skills.map((skill) => (
              <Chip key={skill} tone={match.matched.includes(skill) ? "success" : "warning"}>
                {skill}
              </Chip>
            ))}
          </div>
          <p className="eyebrow mt-4">Preferred</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {role.preferred_skills.map((skill) => (
              <Chip key={skill} tone={match.preferredMatched.includes(skill) ? "success" : "outline"}>
                {skill}
              </Chip>
            ))}
          </div>
        </div>
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

      <AIDisclosure>
        Match reasoning uses only the skills, projects, achievements and capability insights on your
        record. Anything labelled potential capability is an indication to explore.
      </AIDisclosure>
    </div>
  );
}
