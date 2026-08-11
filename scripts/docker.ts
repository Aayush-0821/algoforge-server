import { execa } from "execa";
import { cli } from "./logger.js";

export async function ensureDockerInstalled() {
  cli.start("Checking Docker installation...");

  try {
    await execa("docker", ["--version"]);

    cli.succeed("Docker installed");
  } catch {
    cli.fail("Docker is not installed.");

    process.exit(1);
  }
}

export async function ensureDockerRunning() {
  cli.start("Checking Docker daemon...");

  try {
    await execa("docker", ["info"]);

    cli.succeed("Docker daemon running");
  } catch {
    cli.fail("Docker Desktop is not running.");

    process.exit(1);
  }
}

export async function startInfrastructure() {
  cli.start("Starting infrastructure...");

  try {
    await execa("docker", ["compose", "up", "-d"], {
      stdio: "ignore",
    });

    cli.succeed("docker compose up -d");
  } catch {
    cli.fail("Failed to start docker compose.");

    process.exit(1);
  }
}
