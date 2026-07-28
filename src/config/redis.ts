import { createClient } from "redis";

import { env } from "./env";
import { logger } from "./logger";

export const redis = createClient({
  url: env.REDIS_URL,
});

redis.on("connect", () => {
  logger.info("Redis Connected");
});

redis.on("error", (err) => {
  logger.fatal(err);
});
