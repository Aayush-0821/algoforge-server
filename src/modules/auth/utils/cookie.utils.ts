import type { Response } from "express";

import { env } from "../../../config/env";
import { COOKIE_MAX_AGE, COOKIE_NAMES } from "../auth.constants";

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE.ACCESS_TOKEN,
    path: "/",
  });

  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE.REFRESH_TOKEN,
    path: "/",
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN);
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN);
}
