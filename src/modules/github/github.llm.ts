import { env } from "../../config/env.js";
import { AppError } from "../../errors/app.errors.js";

import type {
  StructuredRevision,
} from "./github.types.js";

export interface RevisionGenerationInput {
  problemNumber: string;
  problemTitle: string;
  difficulty: string;
  language: string;
  problemUrl: string;
  code: string;
}

const SYSTEM_PROMPT = `
You are AlgoForge's coding interview revision assistant.

Your job is to analyze a coding problem and the user's submitted
solution and create a concise but useful revision note.

Focus on:
- What approach the submitted solution uses
- The core idea behind it
- The algorithm step by step
- Time and space complexity
- Mistakes or pitfalls the user should remember
- Interview-specific observations
- The single most important thing to remember

You MUST return valid JSON.

Return exactly this structure:

{
  "approach": "string",
  "keyIdea": "string",
  "algorithm": ["string"],
  "complexity": {
    "time": "string",
    "space": "string"
  },
  "commonMistakes": ["string"],
  "interviewNotes": ["string"],
  "whatToRemember": "string"
}

Do not return Markdown.
Do not wrap the JSON in a code block.
Do not add commentary outside the JSON.
`;

function extractJson(text: string): string {
  const trimmed = text.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i,
  );

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start !== -1 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new AppError(
    "LLM returned an invalid revision response.",
    502,
  );
}

function validateRevision(
  value: unknown,
): StructuredRevision {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    throw new AppError(
      "LLM returned an invalid revision object.",
      502,
    );
  }

  const revision =
    value as Record<string, unknown>;

  if (
    typeof revision.approach !== "string" ||
    typeof revision.keyIdea !== "string" ||
    typeof revision.whatToRemember !== "string"
  ) {
    throw new AppError(
      "LLM revision is missing required fields.",
      502,
    );
  }

  const complexity =
    revision.complexity as
      | Record<string, unknown>
      | undefined;

  if (
    !complexity ||
    typeof complexity.time !== "string" ||
    typeof complexity.space !== "string"
  ) {
    throw new AppError(
      "LLM revision has invalid complexity data.",
      502,
    );
  }

  if (
    !Array.isArray(revision.algorithm) ||
    !revision.algorithm.every(
      (item) => typeof item === "string",
    )
  ) {
    throw new AppError(
      "LLM revision has an invalid algorithm.",
      502,
    );
  }

  if (
    !Array.isArray(revision.commonMistakes) ||
    !revision.commonMistakes.every(
      (item) => typeof item === "string",
    )
  ) {
    throw new AppError(
      "LLM revision has invalid common mistakes.",
      502,
    );
  }

  if (
    !Array.isArray(revision.interviewNotes) ||
    !revision.interviewNotes.every(
      (item) => typeof item === "string",
    )
  ) {
    throw new AppError(
      "LLM revision has invalid interview notes.",
      502,
    );
  }

  return {
    approach: revision.approach,
    keyIdea: revision.keyIdea,
    algorithm: revision.algorithm,
    complexity: {
      time: complexity.time,
      space: complexity.space,
    },
    commonMistakes:
      revision.commonMistakes,
    interviewNotes:
      revision.interviewNotes,
    whatToRemember:
      revision.whatToRemember,
  };
}

export async function generateRevision(
  input: RevisionGenerationInput,
): Promise<StructuredRevision> {
  const userPrompt = `
Analyze this coding problem and the submitted solution.

Problem Number:
${input.problemNumber}

Problem Title:
${input.problemTitle}

Difficulty:
${input.difficulty}

Language:
${input.language}

Problem URL:
${input.problemUrl}

Submitted Solution:
${input.code}
`;

  const response = await fetch(
    `${env.LLM_BASE_URL}/chat/completions`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${env.LLM_API_KEY}`,

        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        model: env.LLM_MODEL,

        temperature: 0.2,

        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],

        response_format: {
          type: "json_object",
        },
      }),
    },
  );

  if (!response.ok) {
    let message =
      `LLM request failed (${response.status}).`;

    try {
      const body =
        (await response.json()) as {
          error?: {
            message?: string;
          };
        };

      if (body.error?.message) {
        message =
          `LLM request failed: ${body.error.message}`;
      }
    } catch {
      // Keep generic message.
    }

    throw new AppError(message, 502);
  }

  const body =
    (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

  const content =
    body.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError(
      "LLM returned an empty revision.",
      502,
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(
      extractJson(content),
    );
  } catch {
    throw new AppError(
      "LLM returned malformed revision JSON.",
      502,
    );
  }

  return validateRevision(parsed);
}