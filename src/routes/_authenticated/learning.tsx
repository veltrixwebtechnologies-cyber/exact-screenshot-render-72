import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BookOpen, GraduationCap, Hammer, Users } from "lucide-react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useInternalRoles } from "@/hooks/useTalentData";
import { matchRole, skillGaps } from "@/lib/talent";
import { AIDisclosure, Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { FeedbackButtons } from "@/components/talent/feedback-buttons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning plan — TalentIQ" },
      {
        name: "description",
        content: "Courses, projects, mentoring and certifications recommended from your actual skill gaps.",
      },
      { property: "og:title", content: "Learning plan — TalentIQ" },
      { property: "og:description", content: "Learning tied to the gaps that matter." },
    ],
  }),
  component: LearningPage,
});

const modes = [
  { icon: BookOpen, label: "Course", body: (skill: string) => `A focused course covering ${skill} fundamentals and applied practice.` },
  { icon: Hammer, label: "Project", body: (skill: string) => `Volunteer for a delivery task where ${skill} is the main requirement.` },
  { icon: Users, label: "Mentoring", body: (skill: string) => `Pair with a colleague already strong in ${skill} for regular reviews.` },
  { icon: GraduationCap, label: "Certification", body: (skill: string) => `A recognised certification to evidence ${skill} formally.` },
];

function LearningPage() {
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const { data: roles, isLoading } = useInternalRoles();
  const [targetId, setTargetId] = useState<string | null>(null);

  if (isLoading || !roles) return <Skeleton className="h-96 w-full" />;

  const skills = bundle?.skills ?? [];
  const ranked = roles
    .map((role) => matchRole(role, skills, (bundle?.insights ?? []).map((i) => i.capability)))
    .sort((a, b) => b.score - a.score);
  const target = roles.find((r) => r.id === targetId) ?? ranked[0]?.role;
  const gaps = target ? skillGaps(target, skills).filter((g) => g.gap > 0).slice(0, 4) : [];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Learning"
        title="What to learn, and why"
        description="Every recommendation traces back to a skill a real internal role asks for."
        actions={
          target ? (
            <Select value={target.id} onValueChange={setTargetId}>
              <SelectTrigger className="sm:w-72">
                <SelectValue placeholder="Choose a target role" />
              </SelectTrigger>
              <SelectContent>
                {ranked.map((match) => (
                  <SelectItem key={match.role.id} value={match.role.id}>
                    {match.role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null
        }
      />

      <section>
        <SectionTitle
          title="Recommended for your target role"
          description={target ? `Based on the gaps between your record and ${target.title}.` : ""}
        />
        {gaps.length === 0 ? (
          <p className="text-sm text-success">No open gaps for this role — explore a more ambitious target.</p>
        ) : (
          <div className="space-y-6">
            {gaps.map((gap) => (
              <div key={gap.skill} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{gap.skill}</h3>
                  <Chip tone={gap.priority === "High" ? "destructive" : "warning"}>{gap.priority} priority</Chip>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Recommended because this skill is required for {target?.title}, and your record currently
                  shows level {gap.currentLevel}/5 against an expected {gap.requiredLevel}/5.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {modes.map((mode) => (
                    <div key={mode.label} className="rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <mode.icon aria-hidden className="size-4 text-primary" />
                        <p className="text-xs font-semibold">{mode.label}</p>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {mode.body(gap.skill)}
                      </p>
                    </div>
                  ))}
                 </div>
                 <div className="mt-4 border-t border-border pt-3">
                   <FeedbackButtons
                     targetType="learning"
                     targetLabel={gap.skill}
                     label="Is this recommendation relevant?"
                   />
                 </div>
               </div>
             ))}
           </div>
         )}
       </section>

      {(bundle?.recommendations ?? []).length ? (
        <section>
          <SectionTitle title="Saved recommendations" description="Recorded against your profile." />
          <div className="grid gap-3 lg:grid-cols-2">
            {(bundle?.recommendations ?? []).map((rec) => (
              <div key={rec.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Chip tone="primary">{rec.type}</Chip>
                  {rec.related_role ? <Chip tone="outline">{rec.related_role}</Chip> : null}
                </div>
                <p className="mt-3 text-sm font-semibold">{rec.title}</p>
                {rec.description ? (
                  <p className="mt-1.5 text-sm text-muted-foreground">{rec.description}</p>
                ) : null}
                {rec.reason ? <p className="mt-2 text-xs text-muted-foreground">{rec.reason}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionTitle title="Completed learning" description="Already on your record." />
        <div className="flex flex-wrap gap-2">
          {(bundle?.learning ?? []).map((row) => (
            <Chip key={row.id} tone="success">
              {row.course}
            </Chip>
          ))}
          {(bundle?.learning ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : null}
        </div>
      </section>

      <AIDisclosure>
        Suggestions are generated from role requirements and your recorded skills. They are starting
        points to agree with your manager, not a mandated curriculum.
      </AIDisclosure>
    </div>
  );
}
