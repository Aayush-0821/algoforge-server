import { prisma } from "../src/lib/postgres";

async function main() {
  const count = await prisma.problem.count();
  console.log("Total problems:", count);

  const first20 = await prisma.problem.findMany({
    take: 20,
    select: { slug: true, title: true, difficulty: true },
    orderBy: { createdAt: "desc" },
  });
  console.log("\nNewest 20 rows:");
  console.table(first20);

  const target = process.argv[2] ?? "two-sum";
  console.log(`\nLooking up slug: "${target}" (length ${target.length})`);

  const exact = await prisma.problem.findUnique({
    where: { slug: target },
    select: { id: true, slug: true, title: true },
  });
  console.log("findUnique:", exact);

  const ilike = await prisma.$queryRaw<Array<{ id: string; slug: string }>>`
    SELECT id, slug FROM "Problem" WHERE slug ILIKE ${target}
  `;
  console.log("ILIKE (case-insensitive):", ilike);

  const trimmed = target.trim();
  const all = await prisma.problem.findMany({ select: { slug: true } });
  const nearMatches = all
    .filter((p) => p.slug.toLowerCase().includes(trimmed.toLowerCase().slice(0, 5)))
    .map((p) => `"${p.slug}"`);
  console.log("\nNear matches:", nearMatches.length ? nearMatches : "none");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());