import { z } from "zod";

export const completeOnBoardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display Name must be Atleast 2 Characters")
    .max(50, "Display Name cannot be more than 50 Characters"),

  username: z
    .string()
    .trim()
    .min(3, "UserName must be 3 Characters long")
    .max(30, "UserName cannot be more than 30 Characters long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),

  preferredLanguageId: z.string().trim().uuid("Invalid Programming Language ID"),

  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),

  avatarUrl: z.string().trim().url("Invalid Avatar URL").optional(),
});