import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useWorkforce } from "@/hooks/useTalentData";
import { matchRole, type RoleLike, type SkillHolding } from "@/lib/talent";
import { AIDisclosure, Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { StaffGuard } from "@/components/talent/staff-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/hr/internal-mobility")({
  head: () => ({
    meta: [
      { title: "Internal mobility — TalentIQ" },
      {
        name: "description",
        content: "Publish internal opportunities and see which employees already fit, with the evidence behind each match.",
      },
      { property: "og:title", content: "Internal mobility — TalentIQ" },
      { property: "og:description", content: "Fill roles from inside, with evidence." },
    ],
  }),
  component: () => (
    <StaffGuard>
      <InternalMobility />
    </StaffGuard>
  ),
});

function InternalMobility() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useWorkforce();
  const [form, setForm] = useState({
    title: "",
    department: "",
    description: "",
    required: "",
    preferred: "",
    experience: "",
  });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  async function createRole(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("internal_roles").insert({
      title: form.title,
      department: form.department || null,
      description: form.description || null,
      required_skills: form.required.split(",").map((s) => s.trim()).filter(Boolean),
      preferred_skills: form.preferred.split(",").map((s) => s.trim()).filter(Boolean),
      experience_required: form.experience ? Number(form.experience) : null,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Internal opportunity published");
    setForm({ title: "", department: "", description: "", required: "", preferred: "", experience: "" });
    queryClient.invalidateQueries({ queryKey: ["workforce"] });
    queryClient.invalidateQueries({ queryKey: ["internal-roles"] });
  }

  if (isLoading || !data) return <Skeleton className="h-96 w-full" />;

  const roles = data.roles as RoleLike[];
  const activeRole = roles.find((r) => r.id === selected) ?? roles[0];

  const skillsByEmployee = new Map<string, SkillHolding[]>();
  for (const row of data.skills) {
    const list = skillsByEmployee.get(row.employee_id) ?? [];
    list.push({
      name: row.skills?.name ?? "",
      proficiency: Number(row.proficiency),
      confidence: 0.7,
      source: "record",
      evidence: null,
    });
    skillsByEmployee.set(row.employee_id, list);
  }
  const capabilitiesByEmployee = new Map<string, string[]>();
  for (const row of data.insights) {
    const list = capabilitiesByEmployee.get(row.employee_id) ?? [];
    list.push(row.capability);
    capabilitiesByEmployee.set(row.employee_id, list);
  }

  const candidates = activeRole
    ? data.employees
        .map((employee) => {
          const match = matchRole(
            { ...activeRole, preferred_skills: activeRole.preferred_skills ?? [], required_skills: activeRole.required_skills ?? [] },
            skillsByEmployee.get(employee.id) ?? [],
            capabilitiesByEmployee.get(employee.id) ?? [],
          );
          return { employee, match };
        })
        .filter((row) => row.match.score > 0)
        .sort((a, b) => b.match.score - a.match.score)
        .slice(0, 8)
    : [];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Internal mobility"
        title="Fill roles from inside"
        description="Publish an opportunity, then see who already has the evidence — including people whose job title would not suggest it."
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={createRole} className="panel space-y-4 p-5">
          <h2 className="text-sm font-semibold">Publish an internal opportunity</h2>
          <div className="space-y-1.5">
            <Label htmlFor="title">Role title</Label>
            <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experience">Years of experience</Label>
              <Input
                id="experience"
                type="number"
                min={0}
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="required">Required skills</Label>
            <Input
              id="required"
              value={form.required}
              onChange={(e) => setForm({ ...form, required: e.target.value })}
              placeholder="React, TypeScript, System Design"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferred">Preferred skills</Label>
            <Input
              id="preferred"
              value={form.preferred}
              onChange={(e) => setForm({ ...form, preferred: e.target.value })}
              placeholder="Mentoring, Stakeholder Communication"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Publishing…" : "Publish opportunity"}
          </Button>
        </form>

        <div>
          <SectionTitle title="Open opportunities" description="Select one to see internal candidates." />
          <div className="space-y-2">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  activeRole?.id === role.id ? "border-primary bg-primary-soft" : "border-border hover:bg-accent"
                }`}
              >
                <p className="text-sm font-semibold">{role.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {role.department} · {(role.required_skills ?? []).slice(0, 3).join(", ")}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeRole ? (
        <section>
          <SectionTitle
            title={`Internal candidates for ${activeRole.title}`}
            description="Ranked on recorded skills, then preferred skills, then related potential capabilities."
          />
          <div className="space-y-3">
            {candidates.map(({ employee, match }) => (
              <article key={employee.id} className="panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{employee.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {employee.job_title}
                      {employee.department ? ` · ${employee.department}` : ""}
                    </p>
                  </div>
                  <Chip tone={match.band === "Strong match" ? "success" : match.band === "Good match" ? "primary" : "warning"}>
                    {match.band}
                  </Chip>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Holds {match.matched.length} of {(activeRole.required_skills ?? []).length} required skills
                  {match.matched.length ? `: ${match.matched.join(", ")}` : ""}
                  {match.capabilitySupport.length
                    ? `. Potential capability detected in ${match.capabilitySupport.join(", ")}.`
                    : "."}
                </p>
                {match.missing.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {match.missing.map((skill) => (
                      <Chip key={skill} tone="warning">
                        Needs {skill}
                      </Chip>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recorded evidence matches this role yet. Encourage employees to complete their profile and a
                discovery session.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      <AIDisclosure>
        Candidate ranking uses recorded evidence only and is deliberately coarse. Potential capability is an
        indication for a conversation, never a hiring decision on its own.
      </AIDisclosure>
    </div>
  );
}
