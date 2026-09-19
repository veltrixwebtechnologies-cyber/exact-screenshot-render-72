import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle } from "@/hooks/useTalentData";
import { useQueryClient } from "@tanstack/react-query";
import { Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — TalentIQ" },
      {
        name: "description",
        content: "Keep your role, projects, achievements, certifications and learning history up to date.",
      },
      { property: "og:title", content: "Your profile — TalentIQ" },
      { property: "og:description", content: "The evidence TalentIQ reasons over." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: me, isLoading } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);

  const [form, setForm] = useState({
    name: "",
    job_title: "",
    department: "",
    location: "",
    joining_date: "",
    profile_summary: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    setForm({
      name: me.employee.name ?? "",
      job_title: me.employee.job_title ?? "",
      department: me.employee.department ?? "",
      location: me.employee.location ?? "",
      joining_date: me.employee.joining_date ?? "",
      profile_summary: me.employee.profile_summary ?? "",
    });
  }, [me]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!me) return;
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({
        name: form.name,
        job_title: form.job_title || null,
        department: form.department || null,
        location: form.location || null,
        joining_date: form.joining_date || null,
        profile_summary: form.profile_summary || null,
      })
      .eq("id", me.employee.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["me"] });
  }

  if (isLoading || !me) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Profile"
        title="Your experience on record"
        description="TalentIQ reasons only over what it can see. The richer this profile, the better the capability insights and role matches."
      />

      <form onSubmit={save} className="panel max-w-3xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="Job title" value={form.job_title} onChange={(v) => setForm({ ...form, job_title: v })} />
          <Field label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          <Field label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <div className="space-y-1.5">
            <Label htmlFor="joining_date">Joined</Label>
            <Input
              id="joining_date"
              type="date"
              value={form.joining_date ?? ""}
              onChange={(e) => setForm({ ...form, joining_date: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="summary">Professional summary</Label>
          <Textarea
            id="summary"
            rows={4}
            value={form.profile_summary}
            onChange={(e) => setForm({ ...form, profile_summary: e.target.value })}
            placeholder="What you work on, what you have delivered, where you want to go."
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </form>

      <section>
        <SectionTitle title="Projects" description="Delivery evidence used for capability reasoning." />
        <div className="grid gap-3 lg:grid-cols-2">
          {(bundle?.projects ?? []).map((project) => (
            <div key={project.id} className="panel p-4">
              <p className="text-sm font-semibold">{project.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{project.role}</p>
              {project.description ? (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{project.description}</p>
              ) : null}
              {project.outcomes ? (
                <p className="mt-2 text-xs leading-relaxed text-success">Outcome: {project.outcomes}</p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.technologies.map((tech) => (
                  <Chip key={tech} tone="outline">
                    {tech}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
          {(bundle?.projects ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects recorded yet.</p>
          ) : null}
        </div>
      </section>

      <section>
        <SectionTitle title="Achievements" />
        <div className="grid gap-3 lg:grid-cols-2">
          {(bundle?.achievements ?? []).map((item) => (
            <div key={item.id} className="panel p-4">
              <p className="text-sm font-semibold">{item.title}</p>
              {item.description ? (
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
              ) : null}
              {item.impact ? <p className="mt-2 text-xs text-success">Impact: {item.impact}</p> : null}
            </div>
          ))}
          {(bundle?.achievements ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No achievements recorded yet.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionTitle title="Certifications" />
          <div className="space-y-3">
            {(bundle?.certifications ?? []).map((cert) => (
              <div key={cert.id} className="panel p-4">
                <p className="text-sm font-semibold">{cert.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cert.issuer} · {cert.issue_date}
                </p>
              </div>
            ))}
            {(bundle?.certifications ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None recorded yet.</p>
            ) : null}
          </div>
        </div>
        <div>
          <SectionTitle title="Learning history" />
          <div className="space-y-3">
            {(bundle?.learning ?? []).map((row) => (
              <div key={row.id} className="panel p-4">
                <p className="text-sm font-semibold">{row.course}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.provider} · completed {row.completion_date}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.skills_gained.map((skill) => (
                    <Chip key={skill} tone="primary">
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
            {(bundle?.learning ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">None recorded yet.</p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
