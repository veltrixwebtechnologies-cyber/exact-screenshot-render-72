import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, FileUp, Github, ListChecks, Sparkles } from "lucide-react";

import { useMe } from "@/hooks/useMe";
import { useEmployeeBundle, useGithubEvidence, useInternalRoles, useResumes } from "@/hooks/useTalentData";
import { githubStats } from "@/lib/evidence";
import { matchRole } from "@/lib/talent";
import { AIDisclosure, Chip, PageHeader, SectionTitle } from "@/components/talent/primitives";
import { CapabilityCard } from "@/components/talent/capability-card";
import { ResumeAndGithubSection } from "@/components/talent/resume-github";
import { PortfolioVerificationSection } from "@/components/talent/portfolio-verification";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/talent-discovery/")({
  head: () => ({
    meta: [
      { title: "Build your capability profile — TalentMap AI" },
      {
        name: "description",
        content:
          "Connect your evidence, let TalentMap AI extract it, answer an adaptive interview and see the capabilities it can defend.",
      },
      { property: "og:title", content: "Build your capability profile — TalentMap AI" },
      {
        property: "og:description",
        content: "Connect, extract, interview, profile — evidence-based capability discovery.",
      },
    ],
  }),
  component: BuildProfileFlow,
});

function BuildProfileFlow() {
  const { data: me } = useMe();
  const employeeId = me?.employee.id;
  const { data: bundle } = useEmployeeBundle(employeeId);
  const { data: repos } = useGithubEvidence(employeeId);
  const { data: resumes } = useResumes(employeeId);
  const { data: roles } = useInternalRoles();

  const insights = bundle?.insights ?? [];
  const skills = bundle?.skills ?? [];
  const projects = bundle?.projects ?? [];
  const learning = bundle?.learning ?? [];
  const certifications = bundle?.certifications ?? [];
  const stats = githubStats(repos ?? []);

  const capabilityNames = insights.map((i) => i.capability);
  const paths = (roles ?? [])
    .map((role) => matchRole(role, skills, capabilityNames))
    .filter((match) => match.score >= 0.35).length;

  const behaviouralSignals = insights.filter((insight) =>
    /leader|mentor|communicat|coordinat|ownership|strateg/i.test(insight.capability),
  ).length;

  const hasResume = (resumes?.length ?? 0) > 0;
  const hasSources = hasResume;
  const hasExtraction = skills.length > 0 || stats.signals.length > 0;
  const hasInterview = insights.length > 0;

  const extraction = [
    { label: "projects on record", value: projects.length },
    { label: "technical skills detected", value: skills.length },
    { label: "repositories analyzed", value: stats.repos },
    { label: "behavioural signals detected", value: behaviouralSignals },
    { label: "courses & certifications", value: learning.length + certifications.length },
    { label: "possible career paths", value: paths },
  ];

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Discover"
        title="Build your capability profile"
        description="Four steps: connect your evidence, let TalentMap AI read it, answer an adaptive interview, then see what it can defend — and why."
        actions={
          hasResume ? (
            <Link
              to="/talent-discovery/assessment"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Sparkles aria-hidden className="size-4" />
              {hasInterview ? "Run a new interview" : "Start the interview"}
            </Link>
          ) : null
        }
      />

      <Step
        index={1}
        done={hasSources}
        title="Upload your resume, then connect the rest"
        body="Your resume comes first — it is what everything else is built on. GitHub, a portfolio, projects, achievements, certifications and learning then add to the picture. Nothing is read from GitHub unless you authorize it."
      >
        <ResumeAndGithubSection employeeId={employeeId} compact />
        <PortfolioVerificationSection employeeId={employeeId} compact />
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={resumes?.length ? "success" : "outline"}>
            <FileUp aria-hidden className="size-3.5" />
            {resumes?.length ? `Resume · ${resumes[0]?.file_name}` : "Resume not uploaded"}
          </Chip>
          <Chip tone={stats.repos ? "success" : "outline"}>
            <Github aria-hidden className="size-3.5" />
            {stats.repos ? `GitHub · ${stats.repos} repositories` : "GitHub not connected"}
          </Chip>
          <Chip tone={projects.length ? "success" : "outline"}>
            {projects.length} projects
          </Chip>
          <Chip tone={learning.length ? "success" : "outline"}>
            {learning.length} learning records
          </Chip>
          <Link to="/profile" className="text-sm font-medium text-primary hover:underline">
            Add projects, learning and certifications
          </Link>
        </div>
      </Step>

      <Step
        index={2}
        done={hasExtraction}
        title="AI evidence extraction"
        body="What TalentMap AI can currently see across everything you have connected."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {extraction.map((row) => (
            <div key={row.label} className="rounded-lg border border-border p-4">
              <p className="font-mono text-2xl font-semibold tabular-nums text-primary">{row.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{row.label}</p>
            </div>
          ))}
        </div>
        {!hasExtraction ? (
          <p className="text-sm text-muted-foreground">
            Add a project or connect GitHub and these counts will fill in.
          </p>
        ) : null}
      </Step>

      <Step
        index={3}
        done={hasInterview}
        title="Adaptive interview"
        body="Around ten questions, each chosen from your previous answers and your recorded evidence, so the session narrows towards the capabilities that look most likely."
      >
        <div className="flex flex-wrap items-center gap-3">
          {hasResume ? (
          <Link
            to="/talent-discovery/assessment"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-3.5 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ListChecks aria-hidden className="size-4" />
            {hasInterview ? "Run a new interview" : "Begin the interview"}
          </Link>
          ) : (
            <p className="text-sm text-muted-foreground">
              Upload your resume in step 1 and the interview unlocks — its questions are built from
              your own records.
            </p>
          )}
          {hasInterview ? (
            <p className="text-xs text-muted-foreground">
              Last session produced {insights.length} potential capabilities.
            </p>
          ) : null}
        </div>
      </Step>

      <Step
        index={4}
        done={hasInterview}
        title="Your capability profile"
        body="Each capability is a potential strength with a confidence level. Open one to see exactly which evidence pointed at it."
      >
        {insights.length ? (
          <>
            <SectionTitle
              title="Potential capabilities"
              action={
                <Link to="/talent-discovery/results" className="text-sm font-medium text-primary hover:underline">
                  Full results
                </Link>
              }
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {insights.slice(0, 4).map((insight) => (
                <CapabilityCard key={insight.id} insight={insight} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your capability profile appears here once the interview has run.
          </p>
        )}
      </Step>

      <AIDisclosure>
        A discovery session produces evidence-based indications of potential capability. Nothing here
        is a formal assessment, a psychometric test or a performance rating.
      </AIDisclosure>
    </div>
  );
}

function Step({
  index,
  title,
  body,
  done,
  children,
}: {
  index: number;
  title: string;
  body: string;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="relative pl-10">
      <span
        className={cn(
          "absolute left-0 top-1 grid size-7 place-items-center rounded-full font-mono text-xs font-semibold",
          done ? "bg-success-soft text-success" : "bg-primary text-primary-foreground",
        )}
      >
        {done ? <Check aria-hidden className="size-4" /> : index}
      </span>
      <div className="space-y-4">
        <div>
          <p className="eyebrow">Step {index}</p>
          <h2 className="mt-1 text-base font-semibold">{title}</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
        {children}
      </div>
    </section>
  );
}
