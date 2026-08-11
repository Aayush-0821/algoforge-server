import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { mongo } from "./database/mongo/mongodb";
import { postgres } from "./database/postgres/postgres";
import { connectRedis } from "./database/redis";

export async function bootstrap() {
  try {
    await postgres.$connect();
    logger.info("PostgresSQL Connected");

    await mongo.$connect();
    logger.info("MongoDB Connected");

    await connectRedis();

    const server = app.listen(env.PORT, () => {
      logger.info(`Server Running on Port ${env.PORT}`);
    });

    return server;
  } catch (error) {
    logger.fatal(error);

    process.exit(1);
  }
}
