import { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { logger } from "../config/logger";
import { AppError } from "../errors/app.errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({
    err,
    requestId: req.id,
  });

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });

    return;
  }

  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
}