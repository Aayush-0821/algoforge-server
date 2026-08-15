import type { Request, Response, NextFunction } from "express";

import { AppError } from "../errors/app.errors";
import { COOKIE_NAMES } from "../modules/auth/auth.constants";
import { verifyAccessToken } from "../modules/auth/utils/jwt";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const accessToken = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    if (!accessToken) {
      throw new AppError("Access Token is Missing", 401);
    }

    const payload = await verifyAccessToken(accessToken);

    if (payload.type !== "access") {
      throw new AppError("Invalid Access Token", 401);
    }

    req.user = {
      id: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    next(error);
  }
}
