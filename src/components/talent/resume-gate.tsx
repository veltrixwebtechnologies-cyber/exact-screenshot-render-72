import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { FileUp } from "lucide-react";

import { useMe } from "@/hooks/useMe";
import { useResumes } from "@/hooks/useTalentData";
import { ResumeAndGithubSection } from "@/components/talent/resume-github";
import { PageHeader } from "@/components/talent/primitives";

/**
 * The resume is the starting point: it is what every other screen reasons over.
 * Until one is uploaded, we show the upload instead of an empty screen.
 */
export function ResumeGate({ what, children }: { what: string; children: ReactNode }) {
  const { data: me, isLoading: loadingMe } = useMe();
  const employeeId = me?.employee.id;
  const { data: resumes, isLoading } = useResumes(employeeId);

  if (loadingMe || (employeeId && isLoading)) {
    return <div className="h-40 animate-pulse rounded-xl border border-border bg-muted/40" />;
  }

  if ((resumes?.length ?? 0) > 0) return <>{children}</>;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Start here"
        title="Upload your resume first"
        description={`${what} is built from your own evidence. Upload your resume and TalentMap AI reads your experience, projects, certifications and learning into your profile — then this screen fills in.`}
      />
      <div className="panel space-y-4 p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FileUp aria-hidden className="size-4 text-primary" />
          Your resume (PDF or text)
        </div>
        <ResumeAndGithubSection employeeId={employeeId} compact />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Nothing is read from GitHub unless you authorize it separately. You can add projects,
          certifications and learning by hand on{" "}
          <Link to="/profile" className="font-medium text-primary hover:underline">
            your profile
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
