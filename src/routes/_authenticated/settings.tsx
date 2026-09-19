import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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

      {me.roles.includes("admin") ? <TeamAccess /> : <StaffNote />}

      <section>
        <SectionTitle
          title="Who can see what"
          description="Your profile, skills, evidence and capability insights are visible only to you and to HR or admin accounts. Colleagues cannot read your record. Only you can edit it; HR publishes internal roles."
        />
        <Button variant="outline" onClick={signOut}>
          Sign out
        </Button>
      </section>
    </div>
  );
}

function StaffNote() {
  return (
    <section>
      <SectionTitle
        title="HR access"
        description="Workforce intelligence is limited to HR and admin accounts. Access can only be granted by an admin in your organisation — it is never self-assigned."
      />
    </section>
  );
}

/**
 * Admin-only: grant HR access to a colleague. The database enforces that only
 * admins may write privileged roles; this panel is the UI for that permission.
 */
function TeamAccess() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const people = useQuery({
    queryKey: ["team-access"],
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: employees, error }, { data: staff }] = await Promise.all([
        supabase.from("employees").select("id,name,email,user_id,job_title").order("name"),
        supabase.from("user_roles").select("user_id,role").in("role", ["hr", "admin"]),
      ]);
      if (error) throw error;
      const staffIds = new Set((staff ?? []).map((r: { user_id: string }) => r.user_id));
      return (employees ?? [])
        .filter((e: { user_id: string | null }) => Boolean(e.user_id))
        .map((e: { id: string; name: string; email: string | null; user_id: string | null; job_title: string | null }) => ({
          ...e,
          isStaff: staffIds.has(e.user_id as string),
        }));
    },
  });

  async function grantHr(userId: string) {
    setPending(userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "hr" });
    setPending(null);
    if (error) {
      toast.error("That access level could not be granted.");
      return;
    }
    toast.success("HR access granted.");
    await queryClient.invalidateQueries({ queryKey: ["team-access"] });
  }

  return (
    <section className="panel space-y-4 p-6">
      <SectionTitle
        title="Team access"
        description="As an admin you can give colleagues HR access to workforce intelligence. Nobody can grant it to themselves."
      />
      {people.isLoading ? <Skeleton className="h-24 w-full" /> : null}
      <div className="space-y-2">
        {(people.data ?? []).map((person) => (
          <div key={person.id} className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">{person.name}</p>
              <p className="text-xs text-muted-foreground">{person.email ?? person.job_title ?? "—"}</p>
            </div>
            {person.isStaff ? (
              <Chip tone="primary">HR access</Chip>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={pending === person.user_id}
                onClick={() => grantHr(person.user_id as string)}
              >
                {pending === person.user_id ? "Granting…" : "Grant HR access"}
              </Button>
            )}
          </div>
        ))}
      </div>
    </section>
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
