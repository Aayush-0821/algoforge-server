import { execa } from "execa";
import { cli } from "./logger.js";

let serverProcess: ReturnType<typeof execa> | null = null;

export async function startServer(): Promise<void> {
  cli.start("Starting Express server...");

  try {
    serverProcess = execa("npm", ["run", "dev:server"], {
      stdout: "inherit",
      stderr: "inherit",
      stdin: "inherit",
    });

    cli.succeed("Server started");

    cli.success("API:      http://localhost:5000");
    cli.info("Docs:     http://localhost:5000/docs");
    cli.info("Health:   http://localhost:5000/health");
    console.log();

    setupShutdownHandlers();
    await serverProcess;
  } catch (error) {
    cli.fail("Failed to start server");
    console.error(error);
    process.exit(1);
  }
}

function setupShutdownHandlers() {
  const shutdown = async (signal: string) => {
    cli.warn(`Received ${signal}. Shutting down...`);

    try {
      if (serverProcess) {
        serverProcess.kill("SIGINT");
        await serverProcess;
      }
    } catch {}

    cli.success("Development server stopped.");

    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}
