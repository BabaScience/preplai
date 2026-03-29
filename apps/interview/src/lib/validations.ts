import { z } from "zod";

export const createSessionSchema = z.object({
  type: z.enum(["behavioral", "technical", "system_design", "case_study"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  totalQuestions: z.number().int().min(1).max(20).default(5),
  targetRole: z.string().max(255).optional(),
  targetCompany: z.string().max(255).optional(),
});

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  text: z.string().min(1).max(50_000),
  durationMs: z.number().int().min(0).default(0),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
