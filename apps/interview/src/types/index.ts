import type { InferSelectModel } from "drizzle-orm";
import type {
  users,
  interviewSessions,
  questions,
  answers,
  feedback,
  systemPrompts,
} from "@/lib/db/schema";

export type User = InferSelectModel<typeof users>;
export type InterviewSession = InferSelectModel<typeof interviewSessions>;
export type Question = InferSelectModel<typeof questions>;
export type Answer = InferSelectModel<typeof answers>;
export type Feedback = InferSelectModel<typeof feedback>;
export type SystemPrompt = InferSelectModel<typeof systemPrompts>;
