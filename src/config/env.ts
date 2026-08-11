import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),

  PORT: z.coerce.number().default(5000),

  DATABASE_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().optional(),

  JWT_REFRESH_SECRET: z.string().optional(),

  REDIS_URL: z.string().optional(),

  JWT_ACCESS_EXPIRY: z.string().default("15m"),

  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  EMAIL_VERIFICATION_TTL: z.coerce.number(),

  PASSWORD_RESET_TTL: z.coerce.number(),

  SMTP_HOST: z.string(),

  SMTP_PORT: z.coerce.number(),

  SMTP_USER: z.string().email(),

  SMTP_PASSWORD: z.string(),

  SMTP_FROM: z.string(),

  FRONTEND_URL: z.string().url(),

  GOOGLE_CLIENT_ID: z.string(),

  GOOGLE_CLIENT_SECRET: z.string(),

  GOOGLE_CALLBACK_URL: z.string(),

  GITHUB_CLIENT_ID: z.string(),

  GITHUB_CLIENT_SECRET: z.string(),

  GITHUB_CALLBACK_URL: z.string(),
});

export const env = envSchema.parse(process.env);
