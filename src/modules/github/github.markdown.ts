import type {
  RevisionGenerationInput,
} from "./github.llm.js";

import type {
  StructuredRevision,
} from "./github.types.js";

export function renderRevisionMarkdown(
  input: RevisionGenerationInput,
  revision: StructuredRevision,
): string {
  const algorithm = revision.algorithm
    .map(
      (step, index) =>
        `${index + 1}. ${step}`,
    )
    .join("\n");

  const commonMistakes =
    revision.commonMistakes.length > 0
      ? revision.commonMistakes
          .map((item) => `- ${item}`)
          .join("\n")
      : "- None identified.";

  const interviewNotes =
    revision.interviewNotes.length > 0
      ? revision.interviewNotes
          .map((item) => `- ${item}`)
          .join("\n")
      : "- None.";

  return `# ${input.problemNumber}. ${input.problemTitle}

**Difficulty:** ${input.difficulty}  
**Language:** ${input.language}

## Approach

${revision.approach}

## Key Idea

${revision.keyIdea}

## Algorithm

${algorithm}

## Complexity

- **Time:** ${revision.complexity.time}
- **Space:** ${revision.complexity.space}

## Common Mistakes

${commonMistakes}

## Interview Notes

${interviewNotes}

## What to Remember

${revision.whatToRemember}

## My Solution

\`\`\`${getMarkdownLanguage(input.language)}
${input.code}
\`\`\`

## Problem

${input.problemUrl}
`;
}

function getMarkdownLanguage(
  language: string,
): string {
  const normalized =
    language.toLowerCase();

  const mapping: Record<string, string> = {
    "c++": "cpp",
    cpp: "cpp",
    "c#": "csharp",
    java: "java",
    javascript: "javascript",
    typescript: "typescript",
    python: "python",
    python3: "python",
    go: "go",
    rust: "rust",
    kotlin: "kotlin",
    swift: "swift",
  };

  return (
    mapping[normalized] ??
    normalized.replace(/[^a-z0-9+#-]/g, "")
  );
}