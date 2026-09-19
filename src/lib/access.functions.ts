import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseInput } from "./validation";

type SupabaseCtx = { supabase: any; userId: string };

/** Role assignments are never readable by colleagues; only an admin may list them. */
async function assertAdmin(ctx: SupabaseCtx) {
  const { data } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId);
  const isAdmin = (data ?? []).some((row: { role: string }) => row.role === "admin");
  if (!isAdmin) throw new Error("Admin access is required.");
}

export interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  job_title: string | null;
  user_id: string;
  isStaff: boolean;
}

export const listTeamAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ people: TeamMember[] }> => {
    const ctx = context as unknown as SupabaseCtx;
    await assertAdmin(ctx);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: employees }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("employees").select("id,name,email,user_id,job_title").order("name"),
      supabaseAdmin.from("user_roles").select("user_id,role").in("role", ["hr", "admin"]),
    ]);

    const staff = new Set((roles ?? []).map((row: any) => row.user_id as string));
    const people = (employees ?? [])
      .filter((row: any) => Boolean(row.user_id))
      .map((row: any) => ({
        id: row.id as string,
        name: row.name as string,
        email: (row.email ?? null) as string | null,
        job_title: (row.job_title ?? null) as string | null,
        user_id: row.user_id as string,
        isStaff: staff.has(row.user_id as string),
      }));
    return { people };
  });

export const grantHrAccess = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => parseInput(z.object({ userId: z.string().uuid() }), data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as SupabaseCtx;
    await assertAdmin(ctx);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.userId, role: "hr" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
