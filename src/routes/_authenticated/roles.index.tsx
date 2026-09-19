import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { matchRole } from "@/lib/talent";
import { AIDisclosure, PageHeader } from "@/components/talent/primitives";
import { RoleMatchCard } from "@/components/talent/role-match-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeGate } from "@/components/talent/resume-gate";

export const Route = createFileRoute("/_authenticated/roles/")({
  head: () => ({
    meta: [
      { title: "Internal roles — TalentMap AI" },
      {
        name: "description",
        content: "Explore open internal roles, how well you match and which skills you would still need.",
      },
      { property: "og:title", content: "Internal roles — TalentMap AI" },
      { property: "og:description", content: "Explainable internal role matching." },
    ],
  }),
  component: () => (
    <ResumeGate what="Internal role matching">
      <RolesPage />
    </ResumeGate>
  ),
});

function RolesPage() {
  const [query, setQuery] = useState("");
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const { data: roles, isLoading } = useInternalRoles();

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  const capabilities = (bundle?.insights ?? []).map((i) => i.capability);
  const matches = (roles ?? [])
    .map((role) => matchRole(role, bundle?.skills ?? [], capabilities))
    .filter((match) => {
      if (!query.trim()) return true;
      const needle = query.toLowerCase();
      return (
        match.role.title.toLowerCase().includes(needle) ||
        (match.role.department ?? "").toLowerCase().includes(needle) ||
        match.role.required_skills.some((s) => s.toLowerCase().includes(needle))
      );
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Internal mobility"
        title="Roles open inside the organisation"
        description="Match bands are deliberately coarse. Open a role to see exactly why it matches and what is missing."
        actions={
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by title, team or skill"
            className="sm:w-72"
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {matches.map((match) => (
          <RoleMatchCard key={match.role.id} match={match} />
        ))}
      </div>
      {matches.length === 0 ? (
        <p className="text-sm text-muted-foreground">No roles match that filter.</p>
      ) : null}

      <AIDisclosure>
        Matching weighs the role's required skills most heavily, then preferred skills, then potential
        capabilities that relate to the requirement. It is an indication for a conversation, not a score.
      </AIDisclosure>
    </div>
  );
}
