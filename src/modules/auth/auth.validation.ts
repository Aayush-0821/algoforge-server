import { z } from "zod";

import { PASSWORD } from "./auth.constants.js";

const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address");

const passwordSchema = z
  .string()
  .min(PASSWORD.LENGTH, `Password must be at Least ${PASSWORD.LENGTH} characters long.`)
  .max(PASSWORD.MAX_LENGTH, `Password cannot exceed ${PASSWORD.MAX_LENGTH} characters.`)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character.");

const tokenSchema = z.string().trim().min(1, "Token is Required.");

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is Required."),
});

export const refreshTokenSchema = z.object({
  token: tokenSchema,
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: tokenSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
