import chalk from "chalk";
import ora, { Ora } from "ora";
import { logger } from "../src/config/logger.js";

export class CliLogger {
  private spinner: Ora;

  constructor() {
    this.spinner = ora({
      color: "cyan",
    });
  }

  start(message: string) {
    this.spinner.start(message);
  }

  succeed(message: string) {
    this.spinner.succeed(chalk.green(message));
  }

  fail(message: string) {
    this.spinner.fail(chalk.red(message));
  }

  warn(message: string) {
    this.spinner.warn(chalk.yellow(message));
  }

  info(message: string) {
    console.log(chalk.cyan(message));
  }

  success(message: string) {
    console.log(chalk.green(message));
  }

  error(message: string) {
    console.log(chalk.red(message));
  }

  async step(fn: () => Promise<void>) {
    const start = performance.now();
    try {
      await fn();

      const end = performance.now();

      logger.info(`(${(end - start).toFixed(0)} ms)`);
    } catch (error) {
      const end = performance.now();

      logger.error(`(${(end - start).toFixed(0)} ms)`);

      throw error;
    }
  }

  title(title: string) {
    console.log();
    console.log(chalk.bold.blue("────────────────────────────────────────"));
    console.log(chalk.bold.cyan(title));
    console.log(chalk.bold.blue("────────────────────────────────────────"));
    console.log();
  }
}

export const cli = new CliLogger();
