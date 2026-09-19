import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  department: string | null;
  job_title: string | null;
  location: string | null;
  joining_date: string | null;
  profile_summary: string | null;
  is_demo: boolean;
}

export interface Me {
  userId: string;
  email: string | null;
  employee: Employee;
  roles: string[];
  isStaff: boolean;
}

/**
 * Loads the signed-in person, creating their employee record and role on first
 * visit (both are self-scoped writes allowed by row level security).
 */
export function useMe() {
  return useQuery<Me | null>({
    queryKey: ["me"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const meta = (user.user_metadata ?? {}) as any;

      let employee: Employee | null = null;
      const existing = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      employee = (existing.data as Employee | null) ?? null;

      if (!employee) {
        const created = await supabase
          .from("employees")
          .insert({
            user_id: user.id,
            name: meta.full_name || user.email?.split("@")[0] || "New employee",
            email: user.email ?? null,
            job_title: meta.job_title || null,
            department: meta.department || null,
            location: meta.location || null,
          })
          .select("*")
          .single();
        if (created.error) throw created.error;
        employee = created.data as Employee;
      }

      let roles: string[] = [];
      const roleRows = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      roles = (roleRows.data ?? []).map((r: { role: string }) => r.role);

      if (roles.length === 0) {
        const desired = meta.desired_role === "hr" ? "hr" : "employee";
        const inserted = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: desired })
          .select("role");
        roles = (inserted.data ?? [{ role: desired }]).map((r: { role: string }) => r.role);
      }

      return {
        userId: user.id,
        email: user.email ?? null,
        employee,
        roles,
        isStaff: roles.some((r) => r === "hr" || r === "admin"),
      };
    },
  });
}
