import { z } from "zod";

export const revisionVaultSchema = z.object({
  problemNumber: z
    .string()
    .trim()
    .min(1)
    .max(20),

  problemTitle: z
    .string()
    .trim()
    .min(1)
    .max(200),

  difficulty: z
    .string()
    .trim()
    .min(1)
    .max(30),

  language: z
    .string()
    .trim()
    .min(1)
    .max(50),

  problemUrl: z
    .string()
    .url()
    .max(1000),

  code: z
    .string()
    .min(1)
    .max(100_000),
});

export type RevisionVaultInput =
  z.infer<typeof revisionVaultSchema>;