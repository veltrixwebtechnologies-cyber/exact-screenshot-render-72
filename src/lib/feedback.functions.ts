import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

import { feedbackSchema, parseInput } from "./validation";

type SupabaseCtx = { supabase: any; userId: string };

async function myEmployeeId(ctx: SupabaseCtx): Promise<string | null> {
  const { data } = await ctx.supabase
    .from("employees")
    .select("id")
    .eq("user_id", ctx.userId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/**
 * Records whether a recommendation was useful. Stored per employee and fed back
 * into later AI reasoning so future recommendations account for what the person
 * said was or was not relevant.
 */
export const submitFeedback = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => parseInput(feedbackSchema, data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const ctx = context as unknown as SupabaseCtx;
    const employeeId = await myEmployeeId(ctx);
    if (!employeeId) throw new Error("No employee profile yet");

    const { error } = await ctx.supabase.from("recommendation_feedback").upsert(
      {
        employee_id: employeeId,
        target_type: data.targetType,
        target_label: data.targetLabel,
        rating: data.rating,
        comment: data.comment ?? null,
      },
      { onConflict: "employee_id,target_type,target_label" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface FeedbackRow {
  target_type: string;
  target_label: string;
  rating: number;
  comment: string | null;
}

/** The signed-in person's own feedback, used to show state in the UI. */
export const myFeedback = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const ctx = context as unknown as SupabaseCtx;
    const employeeId = await myEmployeeId(ctx);
    if (!employeeId) return { feedback: [] as FeedbackRow[] };

    const { data } = await ctx.supabase
      .from("recommendation_feedback")
      .select("target_type, target_label, rating, comment")
      .eq("employee_id", employeeId);
    return { feedback: (data ?? []) as FeedbackRow[] };
  });
