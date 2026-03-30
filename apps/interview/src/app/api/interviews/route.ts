import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { interviewSessions, questions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createSessionSchema } from "@/lib/validations";
import { generateQuestion } from "@/lib/ai/interview-service";

// POST /api/interviews — Create a new interview session + generate first question
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse and validate body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const input = parsed.data;

  // Per-user concurrency limit: max 1 active session
  const [activeSession] = await db
    .select({ id: interviewSessions.id })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        eq(interviewSessions.status, "in_progress")
      )
    )
    .limit(1);

  if (activeSession) {
    return NextResponse.json(
      {
        error: "You already have an active interview session",
        activeSessionId: activeSession.id,
      },
      { status: 409 }
    );
  }

  // Create interview session
  const [newSession] = await db
    .insert(interviewSessions)
    .values({
      userId,
      type: input.type,
      difficulty: input.difficulty,
      targetRole: input.targetRole ?? null,
      targetCompany: input.targetCompany ?? null,
      totalQuestions: input.totalQuestions,
      questionsAnswered: 0,
      durationMs: 0,
    })
    .returning();

  // Generate the first question
  try {
    const result = await generateQuestion({
      sessionId: newSession.id,
      type: input.type,
      difficulty: input.difficulty,
      targetRole: input.targetRole,
      targetCompany: input.targetCompany,
      questionIndex: 0,
      totalQuestions: input.totalQuestions,
    });

    // Save the question to DB
    const [savedQuestion] = await db
      .insert(questions)
      .values({
        sessionId: newSession.id,
        questionIndex: 0,
        type: input.type,
        text: result.questionText,
        topic: result.topic,
        difficulty: input.difficulty,
      })
      .returning();

    return NextResponse.json(
      {
        id: newSession.id,
        status: newSession.status,
        type: newSession.type,
        difficulty: newSession.difficulty,
        totalQuestions: newSession.totalQuestions,
        firstQuestion: {
          id: savedQuestion.id,
          text: savedQuestion.text,
          topic: savedQuestion.topic,
          questionIndex: 0,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    // Clean up the session if question generation fails
    await db
      .delete(interviewSessions)
      .where(eq(interviewSessions.id, newSession.id));
    console.error("Failed to generate first question:", err);
    return NextResponse.json(
      { error: "Failed to generate interview question. Please try again." },
      { status: 502 }
    );
  }
}

// GET /api/interviews — List user's sessions
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, session.user.id))
    .orderBy(interviewSessions.createdAt);

  return NextResponse.json({ sessions });
}
