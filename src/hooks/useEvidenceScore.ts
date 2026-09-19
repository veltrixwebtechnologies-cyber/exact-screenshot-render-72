import { useEmployeeBundle, useGithubEvidence, usePortfolioVerifications, useResumes } from "@/hooks/useTalentData";
import { githubStats } from "@/lib/evidence";
import type { ProfileEvidenceInput } from "@/lib/evidence-score";

/** Assembles everything the evidence validation needs for one employee. */
export function useEvidenceScoreInput(employeeId: string | undefined): {
  input: ProfileEvidenceInput;
  isLoading: boolean;
} {
  const bundle = useEmployeeBundle(employeeId);
  const github = useGithubEvidence(employeeId);
  const resumes = useResumes(employeeId);
  const portfolios = usePortfolioVerifications(employeeId);

  const stats = githubStats(github.data ?? []);
  const claims = (portfolios.data ?? []).flatMap((row) => row.claims ?? []);

  return {
    isLoading:
      bundle.isLoading || github.isLoading || resumes.isLoading || portfolios.isLoading,
    input: {
      resumes: (resumes.data ?? []).length,
      skills: bundle.data?.skills ?? [],
      insights: (bundle.data?.insights ?? []).map((insight) => ({
        confidence: Number(insight.confidence),
        evidence: insight.evidence ?? [],
        source: insight.source,
      })),
      projects: (bundle.data?.projects ?? []).length,
      achievements: (bundle.data?.achievements ?? []).length,
      certifications: (bundle.data?.certifications ?? []).length,
      learning: (bundle.data?.learning ?? []).length,
      githubRepos: stats.repos,
      githubLanguages: stats.languages.length,
      activeRepos: stats.activeProjects,
      portfolioChecked: (portfolios.data ?? []).length > 0,
      portfolioClaims: claims.map((claim) => ({ strength: claim.strength })),
    },
  };
}
