import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useMe";
import { Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TalentIQ" },
      { name: "description", content: "Your account, access level and data visibility in TalentIQ." },
      { property: "og:title", content: "Settings — TalentIQ" },
      { property: "og:description", content: "Account and access settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: me, isLoading } = useMe();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading || !me) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="max-w-2xl space-y-10">
      <PageHeader eyebrow="Settings" title="Account" description="Your identity and access level in TalentIQ." />

      <section className="panel space-y-4 p-6">
        <Row label="Name" value={me.employee.name} />
        <Row label="Email" value={me.email ?? "—"} />
        <Row label="Job title" value={me.employee.job_title ?? "Not set"} />
        <Row label="Department" value={me.employee.department ?? "Not set"} />
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Access level</p>
          <div className="flex gap-1.5">
            {me.roles.map((role) => (
              <Chip key={role} tone={role === "employee" ? "outline" : "primary"}>
                {role === "hr" ? "HR" : role === "admin" ? "Admin" : "Employee"}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle
          title="Who can see what"
          description="Your profile, skills and capability insights are visible to signed-in colleagues and to HR. Only you can edit your own record; HR can publish internal roles."
        />
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
