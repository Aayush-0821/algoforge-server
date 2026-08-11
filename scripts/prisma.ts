import { execa } from "execa";
import { cli } from "./logger.js";
import { MONGO_SCHEMA, POSTGRES_SCHEMA } from "./constants.js";

async function run(command: string, args: string[]) {
  await execa(command, args, {
    stdio: "inherit",
  });
}

export async function generatePrismaClients() {
  cli.start("Generating Prisma clients...");

  try {
    await run("npx", [
      "prisma",
      "generate",
      `--schema=${POSTGRES_SCHEMA}`,
    ]);

    await run("npx", [
      "prisma",
      "generate",
      `--schema=${MONGO_SCHEMA}`,
    ]);

    cli.succeed("Prisma clients generated");
  } catch {
    cli.fail("Failed to generate Prisma clients");
    process.exit(1);
  }
}

export async function deployMigrations() {
  cli.start("Applying database migrations...");

  try {
    await run("npx", [
      "prisma",
      "migrate",
      "deploy",
      `--schema=${POSTGRES_SCHEMA}`,
    ]);

    cli.succeed("Database migrations applied");
  } catch (error) {
    cli.fail("Failed to apply database migrations");
    throw error;
  }
}