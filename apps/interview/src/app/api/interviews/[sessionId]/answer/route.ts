import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  interviewSessions,
  questions,
  answers,
  feedback,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { submitAnswerSchema } from "@/lib/validations";
import {
  scoreAnswerStreaming,
  generateQuestion,
} from "@/lib/ai/interview-service";
import type { InterviewType } from "@/lib/ai/prompts";

// POST /api/interviews/:sessionId/answer — Submit answer, stream feedback via SSE
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { sessionId } = await params;

  // Validate session ownership and status
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
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (interviewSession.status !== "in_progress") {
    return new Response(
      JSON.stringify({ error: "Session is not in progress" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Validation failed",
        details: parsed.error.flatten(),
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { questionId, text: answerText, durationMs } = parsed.data;

  // Verify the question belongs to this session
  const [question] = await db
    .select()
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.sessionId, sessionId)))
    .limit(1);

  if (!question) {
    return new Response(JSON.stringify({ error: "Question not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if this question was already answered
  const [existingAnswer] = await db
    .select({ id: answers.id })
    .from(answers)
    .where(eq(answers.questionId, questionId))
    .limit(1);

  if (existingAnswer) {
    return new Response(
      JSON.stringify({ error: "This question has already been answered" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // Save the answer
  const [savedAnswer] = await db
    .insert(answers)
    .values({
      questionId,
      sessionId,
      text: answerText,
      durationMs,
    })
    .returning();

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(eventType: string, data: unknown) {
        const payload = `data: ${JSON.stringify({ type: eventType, ...((typeof data === 'object' && data !== null) ? data : { value: data }) })}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      try {
        await scoreAnswerStreaming({
          sessionId,
          type: interviewSession.type as InterviewType,
          difficulty: interviewSession.difficulty,
          targetRole: interviewSession.targetRole,
          targetCompany: interviewSession.targetCompany,
          questionIndex: question.questionIndex,
          totalQuestions: interviewSession.totalQuestions,
          questionText: question.text,
          answerText,
          onToken(token) {
            send("feedback_token", { token });
          },
          onScore(score) {
            send("score", {
              overall: score.overall_score,
              dimensions: score.dimensions,
              strengths: score.strengths,
              improvements: score.improvements,
              sampleAnswerSnippet: score.sample_answer_snippet,
            });
          },
          async onComplete(result) {
            // Save feedback to DB
            const [savedFeedback] = await db
              .insert(feedback)
              .values({
                answerId: savedAnswer.id,
                sessionId,
                overallScore: result.score.overall_score,
                dimensions: result.score.dimensions,
                strengths: result.score.strengths,
                improvements: result.score.improvements,
                sampleAnswerSnippet: result.score.sample_answer_snippet,
                feedbackText: result.narrativeFeedback,
                tokensUsed: result.tokensUsed,
              })
              .returning();

            // Update session progress
            const newAnswered = interviewSession.questionsAnswered + 1;
            const isComplete = newAnswered >= interviewSession.totalQuestions;

            if (isComplete) {
              // Calculate final score
              const allFeedback = await db
                .select({ overallScore: feedback.overallScore })
                .from(feedback)
                .where(eq(feedback.sessionId, sessionId));

              const avgScore = Math.round(
                allFeedback.reduce((sum, f) => sum + f.overallScore, 0) /
                  allFeedback.length
              );

              await db
                .update(interviewSessions)
                .set({
                  questionsAnswered: newAnswered,
                  status: "completed",
                  totalScore: avgScore,
                  completedAt: new Date(),
                  updatedAt: new Date(),
                })
                .where(eq(interviewSessions.id, sessionId));

              send("complete", {
                feedbackId: savedFeedback.id,
                sessionComplete: true,
                totalScore: avgScore,
              });
            } else {
              await db
                .update(interviewSessions)
                .set({
                  questionsAnswered: newAnswered,
                  updatedAt: new Date(),
                })
                .where(eq(interviewSessions.id, sessionId));

              // Generate the next question
              try {
                const nextQ = await generateQuestion({
                  sessionId,
                  type: interviewSession.type as InterviewType,
                  difficulty: interviewSession.difficulty,
                  targetRole: interviewSession.targetRole,
                  targetCompany: interviewSession.targetCompany,
                  questionIndex: newAnswered,
                  totalQuestions: interviewSession.totalQuestions,
                });

                const [savedNextQ] = await db
                  .insert(questions)
                  .values({
                    sessionId,
                    questionIndex: newAnswered,
                    type: interviewSession.type,
                    text: nextQ.questionText,
                    topic: nextQ.topic,
                    difficulty: interviewSession.difficulty,
                  })
                  .returning();

                send("complete", {
                  feedbackId: savedFeedback.id,
                  sessionComplete: false,
                  nextQuestion: {
                    id: savedNextQ.id,
                    text: savedNextQ.text,
                    topic: savedNextQ.topic,
                    questionIndex: savedNextQ.questionIndex,
                  },
                });
              } catch (err) {
                console.error("Failed to generate next question:", err);
                send("complete", {
                  feedbackId: savedFeedback.id,
                  sessionComplete: false,
                  nextQuestion: null,
                  error: "Failed to generate next question",
                });
              }
            }

            controller.close();
          },
          onError(error) {
            send("error", { message: error.message });
            controller.close();
          },
        });
      } catch (err) {
        send("error", {
          message: err instanceof Error ? err.message : "Unknown error",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
