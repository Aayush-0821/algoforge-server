import { env } from "../../config/env.js";

export const ACCESS_TOKEN_EXPIRY = env.JWT_ACCESS_EXPIRY ?? "15m";
export const REFRESH_TOKEN_EXPIRY = env.JWT_REFRESH_EXPIRY ?? "7d";
export const EMAIL_VERIFICATION_TOKEN_MAX_AGE = 15 * 60 * 1000;

export const REDIS_KEYS = {
    EMAIL_VERIFICATION: "",
    PASSWORD_RESET: "",
    LOGIN_ATTEMPTS: ""
} as const

export const TOKEN_TTL = {
    EMAIL_VERIFICATION: env.EMAIL_VERIFICATION_TTL ?? 60*60,
    PASSWORD_RESET: env.PASSWORD_RESET_TTL ?? 15*60
} as const

export const PASSWORD = {
    LENGTH: 8,
    MAX_LENGTH: 120,
} as const

export const COOKIE_NAMES = {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken"
} as const

export const COOKIE_MAX_AGE = {
    ACCESS_TOKEN: 15 * 60 * 1000,
    REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000
} as const

export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const AUTH_MESSAGES = {
  REGISTER_SUCCESS:
    "Registration successful. Please verify your email.",

  LOGIN_SUCCESS: "Login successful.",

  LOGOUT_SUCCESS: "Logout successful.",

  EMAIL_VERIFIED: "Email verified successfully.",

  PASSWORD_RESET_EMAIL_SENT:
    "Password reset email sent.",

  PASSWORD_RESET_SUCCESS:
    "Password reset successfully.",
} as const;