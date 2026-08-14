import compression from "compression";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import hpp from "hpp";

import { corsOptions } from "./config/cors";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { postgres } from "./database/postgres/postgres";
import { redisClient } from "./database/redis";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { notFound } from "./middleware/notFound.middleware";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { requestLogger } from "./middleware/requestLogger.middleware";
import authRoutes from "./modules/auth/auth.routes";
import onboardingRoutes from "./modules/onboarding/onboarding.routes";
import profileRoutes from "./modules/profile/profile.routes";

const app = express();

const startedAt = new Date();

app.use(requestLogger);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(corsOptions);

app.use(apiLimiter);

app.use(compression());

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.use(hpp());

app.set("trust proxy", 1);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "AlgoForge AI API",
    version: "v1",
    status: "running",
    documentation: "/docs",
    health: "/health",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    status: "UP",
    service: "AlgoForge AI API",
    enviroment: env.NODE_ENV,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    startedAt,
  });
});

app.get("/ready", async (_req, res) => {
  const checks = {
    database: false,
    redis: false,
  };

  try {
    await postgres.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (err) {
    logger.warn({ err }, "Database health check failed");
  }

  try {
    await redisClient.ping();
    checks.redis = true;
  } catch (err) {
    logger.warn({ err }, "Redis health check failed");
  }

  const ready = checks.database && checks.redis;

  res.status(ready ? 200 : 503).json({
    success: ready,
    status: ready ? "READY" : "NOT_READY",
    checks,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/profile", profileRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
