// Single place for server-function input schemas, so every endpoint validates
// and normalises its payload the same way.
import { z } from "zod";

export const assessmentIdSchema = z.object({
  assessmentId: z.string().uuid("assessmentId must be a valid id"),
});

export const submitAnswerSchema = z.object({
  assessmentId: z.string().uuid(),
  question: z.string().min(1).max(600),
  category: z.string().max(120).optional(),
  answer: z.string().min(1).max(600),
  signals: z.array(z.string().max(80)).max(12).default([]),
  step: z.number().int().min(1).max(50),
});

export const careerChatSchema = z.object({
  message: z.string().min(1, "message is required").max(1200),
  history: z
    .array(
      z.object({
        role: z.string().max(20),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .default([]),
});

export const talentSearchSchema = z.object({
  query: z.string().min(1, "query is required").max(300),
});

export const feedbackSchema = z.object({
  targetType: z.enum(["capability", "role", "learning", "roadmap", "chat"]),
  targetLabel: z.string().min(1).max(160),
  rating: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().max(600).optional(),
});

export const portfolioUrlSchema = z.object({
  portfolioUrl: z.string().min(4, "Enter your portfolio address").max(300),
});

export const portfolioIdSchema = z.object({
  id: z.string().uuid("id must be a valid id"),
});

/** Parses with zod and rethrows a single readable message. */
export function parseInput<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new Error(first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input");
  }
  return result.data;
}
