import { Socket } from "node:net";
import { cli } from "./logger.js";

interface WaitOptions {
  host: string;
  port: number;
  service: string;
  timeout?: number;
  retryInterval?: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isPortOpen(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();

    socket.setTimeout(2000);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

export async function waitForService({
  host,
  port,
  service,
  timeout = 60_000,
  retryInterval = 1000,
}: WaitOptions): Promise<void> {
  cli.start(`Waiting for ${service}...`);

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeout) {
    const healthy = await isPortOpen(host, port);

    if (healthy) {
      cli.succeed(`${service} healthy`);
      return;
    }

    await sleep(retryInterval);
  }

  cli.fail(`${service} failed to start within ${timeout / 1000}s`);

  process.exit(1);
}

export async function waitForInfrastructure() {
  await waitForService({
    host: "localhost",
    port: 5432,
    service: "PostgreSQL",
  });

  await waitForService({
    host: "localhost",
    port: 27017,
    service: "MongoDB",
  });

  await waitForService({
    host: "localhost",
    port: 6379,
    service: "Redis",
  });
}
