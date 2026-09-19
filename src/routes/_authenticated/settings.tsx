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

      {!me.isStaff ? <StaffSetup /> : null}

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

/**
 * Organisation setup: HR access can only be self-claimed while no HR or admin
 * account exists yet. After that, an admin has to grant it (enforced in the
 * database, not here).
 */
function StaffSetup() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const staffQuery = useQuery({
    queryKey: ["staff-exists"],
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .in("role", ["hr", "admin"]);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });

  if (staffQuery.isLoading || staffQuery.data !== false) {
    return (
      <section>
        <SectionTitle
          title="HR access"
          description="Workforce intelligence is limited to HR and admin accounts. Ask an admin in your organisation to grant you HR access."
        />
      </section>
    );
  }

  async function claimHr() {
    setPending(true);
    const { error } = await supabase.from("user_roles").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id ?? "",
      role: "hr",
    });
    setPending(false);
    if (error) {
      toast.error("HR access could not be granted. An admin already exists in this organisation.");
      return;
    }
    toast.success("HR access granted. Workforce intelligence is now available.");
    await queryClient.invalidateQueries();
  }

  return (
    <section className="panel space-y-3 p-6">
      <SectionTitle
        title="Set up HR access"
        description="No HR or admin account exists in this organisation yet, so you can claim HR access as the first administrator. Once that is done, only admins can grant it to anyone else."
      />
      <Button onClick={claimHr} disabled={pending}>
        {pending ? "Granting…" : "Claim HR access"}
      </Button>
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
