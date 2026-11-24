export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function createRevisionFilePath(problemNumber: string, problemTitle: string): string {
  return `problems/${slugify(problemNumber)}-${slugify(problemTitle)}.md`;
}

export function createCommitMessage(problemNumber: string, problemTitle: string): string {
  return `docs: add revision for ${problemNumber}. ${problemTitle}`;
}
