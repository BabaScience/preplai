import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────

export const interviewTypeEnum = pgEnum("interview_type", [
  "behavioral",
  "technical",
  "system_design",
  "case_study",
]);

export const difficultyEnum = pgEnum("difficulty", [
  "easy",
  "medium",
  "hard",
]);

export const sessionStatusEnum = pgEnum("session_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

// ── Users ──────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  targetRole: varchar("target_role", { length: 255 }),
  targetCompany: varchar("target_company", { length: 255 }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ── Auth.js required tables ────────────────────────────────────────

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 }),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// ── Interview Sessions ─────────────────────────────────────────────

export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: interviewTypeEnum("type").notNull(),
  difficulty: difficultyEnum("difficulty").notNull().default("medium"),
  targetRole: varchar("target_role", { length: 255 }),
  targetCompany: varchar("target_company", { length: 255 }),
  status: sessionStatusEnum("status").notNull().default("in_progress"),
  totalScore: integer("total_score"),
  totalQuestions: integer("total_questions").notNull().default(0),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  startedAt: timestamp("started_at", { mode: "date" }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});

// ── Questions ──────────────────────────────────────────────────────

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  questionIndex: integer("question_index").notNull(),
  type: interviewTypeEnum("type").notNull(),
  text: text("text").notNull(),
  topic: varchar("topic", { length: 255 }),
  difficulty: difficultyEnum("difficulty").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ── Answers ────────────────────────────────────────────────────────

export const answers = pgTable("answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  durationMs: integer("duration_ms").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ── Feedback ───────────────────────────────────────────────────────

export const feedback = pgTable("feedback", {
  id: uuid("id").primaryKey().defaultRandom(),
  answerId: uuid("answer_id")
    .notNull()
    .references(() => answers.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(),
  dimensions: jsonb("dimensions").$type<{
    clarity: number;
    depth: number;
    relevance: number;
    structure: number;
  }>(),
  strengths: jsonb("strengths").$type<string[]>(),
  improvements: jsonb("improvements").$type<string[]>(),
  sampleAnswerSnippet: text("sample_answer_snippet"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

// ── System Prompts ─────────────────────────────────────────────────

export const systemPrompts = pgTable("system_prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: interviewTypeEnum("type").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull().default(1),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
