import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  interviewSessions,
  questions,
  answers,
  feedback,
} from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

// GET /api/interviews/:sessionId — Session summary with all Q&A + scores
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  // Fetch the session, ensuring it belongs to this user
  const [interviewSession] = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.id, sessionId),
        eq(interviewSessions.userId, session.user.id)
      )
    )
    .limit(1);

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Fetch all questions in order
  const sessionQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.sessionId, sessionId))
    .orderBy(asc(questions.questionIndex));

  // For each question, fetch answer and feedback
  const qAndA = await Promise.all(
    sessionQuestions.map(async (q) => {
      const [answer] = await db
        .select()
        .from(answers)
        .where(eq(answers.questionId, q.id))
        .limit(1);

      let fb = null;
      if (answer) {
        const [fbRow] = await db
          .select()
          .from(feedback)
          .where(eq(feedback.answerId, answer.id))
          .limit(1);
        fb = fbRow ?? null;
      }

      return {
        question: {
          id: q.id,
          text: q.text,
          topic: q.topic,
          questionIndex: q.questionIndex,
        },
        answer: answer
          ? { id: answer.id, text: answer.text, durationMs: answer.durationMs }
          : null,
        feedback: fb
          ? {
              id: fb.id,
              overallScore: fb.overallScore,
              dimensions: fb.dimensions,
              strengths: fb.strengths,
              improvements: fb.improvements,
              sampleAnswerSnippet: fb.sampleAnswerSnippet,
              feedbackText: fb.feedbackText,
            }
          : null,
      };
    })
  );

  return NextResponse.json({
    session: {
      id: interviewSession.id,
      type: interviewSession.type,
      difficulty: interviewSession.difficulty,
      status: interviewSession.status,
      targetRole: interviewSession.targetRole,
      targetCompany: interviewSession.targetCompany,
      totalQuestions: interviewSession.totalQuestions,
      questionsAnswered: interviewSession.questionsAnswered,
      totalScore: interviewSession.totalScore,
      durationMs: interviewSession.durationMs,
      startedAt: interviewSession.startedAt,
      completedAt: interviewSession.completedAt,
    },
    questions: qAndA,
  });
}

// PATCH /api/interviews/:sessionId — Complete or abandon session
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const [interviewSession] = await db
    .select()
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.id, sessionId),
        eq(interviewSessions.userId, session.user.id)
      )
    )
    .limit(1);

  if (!interviewSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (interviewSession.status !== "in_progress") {
    return NextResponse.json(
      { error: "Session is not in progress" },
      { status: 400 }
    );
  }

  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body.status !== "completed" && body.status !== "abandoned") {
    return NextResponse.json(
      { error: "Status must be 'completed' or 'abandoned'" },
      { status: 400 }
    );
  }

  // Calculate average score if completing
  let totalScore: number | null = null;
  if (body.status === "completed") {
    const feedbacks = await db
      .select({ overallScore: feedback.overallScore })
      .from(feedback)
      .where(eq(feedback.sessionId, sessionId));

    if (feedbacks.length > 0) {
      totalScore = Math.round(
        feedbacks.reduce((sum, f) => sum + f.overallScore, 0) / feedbacks.length
      );
    }
  }

  const now = new Date();
  const durationMs = now.getTime() - interviewSession.startedAt.getTime();

  const [updated] = await db
    .update(interviewSessions)
    .set({
      status: body.status,
      totalScore,
      durationMs,
      completedAt: now,
      updatedAt: now,
    })
    .where(eq(interviewSessions.id, sessionId))
    .returning();

  return NextResponse.json({ session: updated });
}
