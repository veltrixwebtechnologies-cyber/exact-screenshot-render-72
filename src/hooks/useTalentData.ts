import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RoleLike, SkillHolding } from "@/lib/talent";

export interface TalentInsight {
  id: string;
  employee_id: string;
  capability: string;
  confidence: number;
  evidence: string[];
  explanation: string | null;
  explore: string[];
  source: string;
  created_at: string;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  role: string | null;
  technologies: string[];
  outcomes: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface AchievementRow {
  id: string;
  title: string;
  description: string | null;
  impact: string | null;
  date: string | null;
}

export interface CertificationRow {
  id: string;
  name: string;
  issuer: string | null;
  issue_date: string | null;
  expiry_date: string | null;
}

export interface LearningRow {
  id: string;
  course: string;
  provider: string | null;
  skills_gained: string[];
  completion_date: string | null;
}

export interface RecommendationRow {
  id: string;
  type: string;
  title: string;
  description: string | null;
  reason: string | null;
  related_skill: string | null;
  related_role: string | null;
}

export interface EmployeeBundle {
  skills: SkillHolding[];
  insights: TalentInsight[];
  projects: ProjectRow[];
  achievements: AchievementRow[];
  certifications: CertificationRow[];
  learning: LearningRow[];
  recommendations: RecommendationRow[];
}

export function useEmployeeBundle(employeeId: string | undefined) {
  return useQuery<EmployeeBundle>({
    queryKey: ["employee-bundle", employeeId],
    enabled: Boolean(employeeId),
    queryFn: async () => {
      const id = employeeId!;
      const [skills, insights, projects, achievements, certifications, learning, recommendations] =
        await Promise.all([
          supabase
            .from("employee_skills")
            .select("proficiency, confidence, source, evidence, skills(name, category)")
            .eq("employee_id", id),
          supabase.from("talent_insights").select("*").eq("employee_id", id).order("confidence", { ascending: false }),
          supabase.from("projects").select("*").eq("employee_id", id).order("start_date", { ascending: false }),
          supabase.from("achievements").select("*").eq("employee_id", id).order("date", { ascending: false }),
          supabase.from("certifications").select("*").eq("employee_id", id),
          supabase.from("learning_records").select("*").eq("employee_id", id).order("completion_date", { ascending: false }),
          supabase.from("recommendations").select("*").eq("employee_id", id),
        ]);

      return {
        skills: (skills.data ?? []).map((row: any) => ({
          name: row.skills?.name ?? "Unknown",
          category: row.skills?.category ?? null,
          proficiency: row.proficiency,
          confidence: Number(row.confidence),
          source: row.source,
          evidence: row.evidence,
        })) as SkillHolding[],
        insights: (insights.data ?? []) as TalentInsight[],
        projects: (projects.data ?? []) as ProjectRow[],
        achievements: (achievements.data ?? []) as AchievementRow[],
        certifications: (certifications.data ?? []) as CertificationRow[],
        learning: (learning.data ?? []) as LearningRow[],
        recommendations: (recommendations.data ?? []) as RecommendationRow[],
      };
    },
  });
}

export function useInternalRoles() {
  return useQuery<RoleLike[]>({
    queryKey: ["internal-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("internal_roles")
        .select("id, title, department, description, required_skills, preferred_skills, experience_required")
        .order("title");
      if (error) throw error;
      return (data ?? []) as RoleLike[];
    },
  });
}

export function useWorkforce() {
  return useQuery({
    queryKey: ["workforce"],
    queryFn: async () => {
      const [employees, skills, insights, roles] = await Promise.all([
        supabase.from("employees").select("*").order("name"),
        supabase.from("employee_skills").select("employee_id, proficiency, skills(name, category)"),
        supabase.from("talent_insights").select("employee_id, capability, confidence"),
        supabase.from("internal_roles").select("id, title, department, required_skills, preferred_skills"),
      ]);
      return {
        employees: (employees.data ?? []) as any[],
        skills: (skills.data ?? []) as any[],
        insights: (insights.data ?? []) as any[],
        roles: (roles.data ?? []) as any[],
      };
    },
  });
}
