import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Compass, LineChart, Search, Sparkles, Target } from "lucide-react";

import { LandingPreview } from "@/components/landing-preview";
import logoMark from "@/assets/talentmap-mark.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TalentMap AI — AI-powered talent discovery & career intelligence" },
      {
        name: "description",
        content:
          "TalentMap AI surfaces the skills and potential capabilities hidden behind job titles, matches people to internal roles and turns skill gaps into development plans.",
      },
      { property: "og:title", content: "TalentMap AI — AI-powered talent discovery" },
      {
        property: "og:description",
        content:
          "Discover, match, develop and grow internal talent with evidence-based capability insights.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    icon: Sparkles,
    title: "Discover",
    body: "An adaptive interview combined with projects, achievements and learning history surfaces potential capabilities a résumé never shows.",
  },
  {
    icon: Compass,
    title: "Match",
    body: "Explainable matching against open internal roles, with the evidence behind every match and the skills still to build.",
  },
  {
    icon: Target,
    title: "Develop",
    body: "Skill gaps against a chosen target role, turned into a specific plan of courses, projects and mentoring.",
  },
  {
    icon: LineChart,
    title: "Grow",
    body: "A personalised roadmap from current role to long-term destination, plus workforce intelligence for HR.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="glass-bar sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <img src={logoMark.url} alt="" className="size-7 rounded-md object-contain" />
            <span className="text-sm font-semibold tracking-tight">TalentMap AI</span>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Sign in
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="grid-faint pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 lg:px-8 lg:py-28">
          <p className="eyebrow">Talent discovery &amp; career intelligence</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Our AI doesn&apos;t just identify what employees are doing today — it discovers what
            they are capable of doing tomorrow.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
            TalentMap AI reads the evidence already inside your organisation — projects, achievements,
            certifications, learning history — and pairs it with an adaptive interview to surface
            potential capabilities, match people to internal roles and close real skill gaps.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Build my capability profile
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Search aria-hidden className="size-4" />
              Explore for HR
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
            <div className="panel p-4">
              <p className="eyebrow">If you are an employee</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Show me what I&apos;m capable of — and prove why you think so. Discover capabilities,
                find internal roles, develop the missing skills.
              </p>
            </div>
            <div className="panel p-4">
              <p className="eyebrow">If you are in HR</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Workforce skill intelligence, evidence-backed talent matching and the skill gaps
                forming across your teams.
              </p>
            </div>
          </div>

          <div className="mt-14">
            <LandingPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">Discover → Match → Develop → Grow</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="panel p-5">
              <span className="grid size-8 place-items-center rounded-md bg-primary-soft text-primary-soft-foreground">
                <pillar.icon aria-hidden className="size-4" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center lg:px-8">
          <h2 className="text-xl font-semibold">Insights you can defend</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            TalentMap AI never claims a questionnaire proves a talent. Every capability is presented as
            a potential strength, with the confidence level, the evidence behind it and a plain
            explanation of why it was identified.
          </p>
          <Link
            to="/auth"
            className="mt-7 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get started
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground lg:px-8">
          TalentMap AI · Internal talent discovery and career intelligence. Sample workforce content is
          labelled as demo data.
        </p>
      </footer>
    </div>
  );
}
