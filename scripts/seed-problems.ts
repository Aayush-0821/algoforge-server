// algoforge-server/scripts/seed-problems.ts
import { readFileSync } from "node:fs";
import path from "node:path";

import { DifficultyLevel, Prisma } from "../generated/postgres";
import { prisma } from "../src/lib/postgres";

interface RawProblem {
  titleSlug: string;
  title: string;
  difficulty: string;
  questionFrontendId?: string | number;
  acRate?: number;
  likes?: number;
  dislikes?: number;
  similarQuestions?: string;
  isPaidOnly?: boolean;
}

const RAW_PATH =
  process.argv[2] ??
  process.env.LEETCODE_RAW_DATASET_PATH ??
  path.resolve(
    process.cwd(),
    "../algoforge-ai/readinessScore/data/raw/leetcode_detailed_dataset.json",
  );

const DIFF_MAP: Record<string, DifficultyLevel> = {
  Easy: "EASY",
  Medium: "MEDIUM",
  Hard: "HARD",
};

function loadProblems(): RawProblem[] {
  const raw = readFileSync(RAW_PATH, "utf-8");
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : Object.values(parsed).find((v) => Array.isArray(v));
  if (!Array.isArray(arr)) throw new Error("Raw dataset is not a list");
  return arr as RawProblem[];
}

function realId(p: RawProblem): number | null {
  const v = p.questionFrontendId;
  const n = typeof v === "number" ? v : typeof v === "string" ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Count how many other problems reference each slug in their similarQuestions list. */
function buildSimilarityFrequency(problems: RawProblem[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const p of problems) {
    if (!p.similarQuestions) continue;
    try {
      const parsed = JSON.parse(p.similarQuestions) as Array<{ titleSlug?: string }>;
      if (!Array.isArray(parsed)) continue;
      for (const s of parsed) {
        const slug = s.titleSlug?.trim().toLowerCase();
        if (slug) counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    } catch {
      // skip malformed JSON
    }
  }
  return counts;
}

async function main() {
  console.log(`Reading ${RAW_PATH}`);
  const problems = loadProblems();
  console.log(`Loaded ${problems.length} raw problems`);
  if (problems.length === 0) {
    console.error("Dataset is empty. Check path.");
    process.exit(1);
  }

  console.log(`First item keys: ${Object.keys(problems[0]).join(", ")}`);

  const similarityFreq = buildSimilarityFrequency(problems);
  console.log(`Built similarity frequency for ${similarityFreq.size} slugs`);

  const bySlug = new Map<string, RawProblem>();
  const byId = new Map<number, RawProblem>();
  let skippedNoId = 0;
  let skippedBadDiff = 0;
  let skippedDuplicateSlug = 0;
  let skippedDuplicateId = 0;

  for (const p of problems) {
    if (!p.titleSlug || !p.title || !p.difficulty) continue;
    const slug = p.titleSlug.trim().toLowerCase();
    if (bySlug.has(slug)) {
      skippedDuplicateSlug++;
      continue;
    }
    const id = realId(p);
    if (id === null) {
      skippedNoId++;
      continue;
    }
    if (byId.has(id)) {
      skippedDuplicateId++;
      continue;
    }
    const difficulty = DIFF_MAP[p.difficulty];
    if (!difficulty) {
      skippedBadDiff++;
      continue;
    }
    bySlug.set(slug, p);
    byId.set(id, p);
  }

  console.log(`Kept ${bySlug.size} unique problems`);
  console.log(
    `Skipped: noId=${skippedNoId}, dupSlug=${skippedDuplicateSlug}, dupId=${skippedDuplicateId}, badDiff=${skippedBadDiff}`,
  );

  const rows: Prisma.ProblemCreateManyInput[] = [];
  for (const [id, p] of byId) {
    const slug = p.titleSlug.trim().toLowerCase();
    const difficulty = DIFF_MAP[p.difficulty];
    rows.push({
      slug,
      title: p.title.trim(),
      difficulty,
      leetcodeQuestionId: id,
      problemUrl: `https://leetcode.com/problems/${slug}/`,
      acceptanceRate: typeof p.acRate === "number" ? p.acRate : null,
      likes: typeof p.likes === "number" ? Math.round(p.likes) : null,
      dislikes: typeof p.dislikes === "number" ? Math.round(p.dislikes) : null,
      // Popularity proxy: how many other problems list this one as "similar"
      frequencyScore: similarityFreq.get(slug) ?? null,
    });
  }

  console.log(`Inserting ${rows.length} problems in batches of 500...`);

  const BATCH = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const result = await prisma.problem.createMany({ data: chunk, skipDuplicates: true });
    inserted += result.count;
    console.log(
      `  ${Math.min(i + BATCH, rows.length)}/${rows.length} processed (inserted: ${inserted})`,
    );
  }

  const total = await prisma.problem.count();
  console.log(`\nDone. Total problems in DB: ${total}`);

  const top = await prisma.problem.findMany({
    where: { frequencyScore: { not: null } },
    orderBy: { frequencyScore: "desc" },
    take: 10,
    select: { slug: true, difficulty: true, frequencyScore: true },
  });
  console.log("\nTop 10 by frequencyScore (coldStart would return these first):");
  console.table(top);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
