import type Anthropic from "@anthropic-ai/sdk";

export const SCORE_ANSWER_TOOL: Anthropic.Messages.Tool = {
  name: "score_answer",
  description:
    "Score the candidate's answer across multiple dimensions. You MUST call this tool before providing narrative feedback.",
  input_schema: {
    type: "object" as const,
    properties: {
      overall_score: {
        type: "number",
        minimum: 1,
        maximum: 10,
        description: "Overall score from 1 (poor) to 10 (exceptional)",
      },
      dimensions: {
        type: "object",
        properties: {
          clarity: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "How clearly the answer was communicated",
          },
          depth: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "How thoroughly the topic was explored",
          },
          relevance: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "How well the answer addressed the question",
          },
          structure: {
            type: "number",
            minimum: 1,
            maximum: 10,
            description: "How well-organized the answer was",
          },
        },
        required: ["clarity", "depth", "relevance", "structure"],
      },
      strengths: {
        type: "array",
        items: { type: "string" },
        description: "2-4 specific things the candidate did well",
      },
      improvements: {
        type: "array",
        items: { type: "string" },
        description: "2-4 specific areas for improvement",
      },
      sample_answer_snippet: {
        type: "string",
        description:
          "A brief excerpt (2-3 sentences) showing how a strong answer might address the weakest dimension",
      },
    },
    required: [
      "overall_score",
      "dimensions",
      "strengths",
      "improvements",
      "sample_answer_snippet",
    ],
  },
};

export interface ScoreResult {
  overall_score: number;
  dimensions: {
    clarity: number;
    depth: number;
    relevance: number;
    structure: number;
  };
  strengths: string[];
  improvements: string[];
  sample_answer_snippet: string;
}

/** Extract score_answer tool call from Claude response content blocks. */
export function extractScore(
  contentBlocks: Anthropic.Messages.ContentBlock[]
): ScoreResult | null {
  for (const block of contentBlocks) {
    if (block.type === "tool_use" && block.name === "score_answer") {
      return block.input as ScoreResult;
    }
  }
  return null;
}

/** Extract text content (narrative feedback) from Claude response. */
export function extractNarrativeFeedback(
  contentBlocks: Anthropic.Messages.ContentBlock[]
): string {
  return contentBlocks
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");
}
