import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass, ListChecks, ShieldCheck, Sparkles } from "lucide-react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle } from "@/hooks/useTalentData";
import { AIDisclosure, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { CapabilityCard } from "@/components/talent/capability-card";

export const Route = createFileRoute("/_authenticated/talent-discovery/")({
  head: () => ({
    meta: [
      { title: "Talent discovery — TalentIQ" },
      {
        name: "description",
        content:
          "An adaptive discovery session that combines your answers with your recorded experience to surface potential capabilities.",
      },
      { property: "og:title", content: "Talent discovery — TalentIQ" },
      { property: "og:description", content: "Adaptive, evidence-based capability discovery." },
    ],
  }),
  component: DiscoveryIntro,
});

const steps = [
  {
    icon: ListChecks,
    title: "Around 10 adaptive questions",
    body: "Each question is chosen based on your previous answers, so the session narrows in on the capabilities that look most likely.",
  },
  {
    icon: Compass,
    title: "Combined with your real evidence",
    body: "Your projects, achievements, certifications and learning history are read alongside your answers.",
  },
  {
    icon: ShieldCheck,
    title: "Presented as potential capability",
    body: "Results are indications with confidence levels and evidence, never a claim that a questionnaire proved a talent.",
  },
];

function DiscoveryIntro() {
  const { data: me } = useMe();
  const { data: bundle } = useEmployeeBundle(me?.employee.id);
  const insights = bundle?.insights ?? [];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Discover"
        title="Talent discovery session"
        description="A short adaptive interview that looks for capabilities your job title does not describe."
        actions={
          <Link
            to="/talent-discovery/assessment"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Sparkles aria-hidden className="size-4" />
            {insights.length ? "Run a new session" : "Begin session"}
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {steps.map((step) => (
          <article key={step.title} className="panel p-5">
            <span className="grid size-8 place-items-center rounded-md bg-primary-soft text-primary-soft-foreground">
              <step.icon aria-hidden className="size-4" />
            </span>
            <h2 className="mt-4 text-sm font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </article>
        ))}
      </div>

      {insights.length ? (
        <section>
          <SectionTitle
            title="Your latest results"
            description="From your most recent discovery session and profile evidence."
            action={
              <Link to="/talent-discovery/results" className="text-sm font-medium text-primary hover:underline">
                Full results
              </Link>
            }
          />
          <div className="grid gap-4 lg:grid-cols-2">
            {insights.slice(0, 2).map((insight) => (
              <CapabilityCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      ) : null}

      <AIDisclosure>
        A discovery session produces evidence-based indications of potential capability. Nothing here
        is a formal assessment, a psychometric test or a performance rating.
      </AIDisclosure>
    </div>
  );
}
