import { cli } from "./logger.js";
import { ensureDockerInstalled, ensureDockerRunning, startInfrastructure } from "./docker.js";
import { waitForInfrastructure } from "./health.js";
import { deployMigrations, generatePrismaClients } from "./prisma.js";
import { startServer } from "./server.js";

async function main() {
  console.clear();

  cli.title("AlgoForge Development CLI");

  await cli.step(ensureDockerInstalled);

  await cli.step(ensureDockerRunning);

  await cli.step(startInfrastructure);

  await cli.step(waitForInfrastructure);

  await cli.step(generatePrismaClients);

  await cli.step(deployMigrations);

  await cli.step(startServer);
}

main();
