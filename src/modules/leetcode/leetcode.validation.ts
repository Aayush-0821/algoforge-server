import { z } from "zod";

export const usernameParamSchema = z.object({
  username: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/),
});

export const recentSubmissionsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

export const userProblemParamSchema = z.object({
  username: z.string().trim().min(1).max(50).regex(/^[A-Za-z0-9_-]+$/),
  titleSlug: z.string().trim().min(1).max(150).regex(/^[a-z0-9-]+$/),
});

export const submissionIdParamSchema = z.object({
  submissionId: z.coerce.number().int().positive(),
});
