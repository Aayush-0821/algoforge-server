import { z } from "zod";

export const updateProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Display Name must be at least 2 characters")
      .max(50, "Display Name cannot be more than 50 characters")
      .optional(),

    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username cannot be more than 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
      .optional(),

    avatarUrl: z.string().trim().url("Invalid Avatar URL").optional(),

    experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),

    leetcodeUsername: z
      .string()
      .trim()
      .min(3, "Leetcode Username must be at least 3 characters")
      .max(30, "Leetcode Username cannot be more than 30 characters")
      .optional(),

    githubUsername: z
      .string()
      .trim()
      .min(1, "Github Username cannot be Empty")
      .max(39, "Github Username cannot be more than 39 characters")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is Required");

export const updateProfilePreferencesSchema = z
  .object({
    targetCompany: z
      .array(z.string().trim().min(1, "Company Name cannot be Empty"))
      .max(50, "Cannot Select more than 50 Companies")
      .optional(),

    targetRole: z
      .string()
      .trim()
      .min(1, "Target Role cannot be Empty")
      .max(100, "Target Role cannot be more than 100 Characters")
      .optional(),

    preferredLanguageId: z.string().trim().uuid("Invalid Programming Language ID").optional(),

    dailyGoalMinutes: z
      .number()
      .int("Daily Goal Minutes has to be a whole number")
      .min(1, "Daily Goal Minutes must be atleast 1 minute")
      .max(1440, "Daily Goal Minutes cannot exceed 1440 minutes")
      .optional(),

    weeklyGoalProblems: z
      .number()
      .int("Weekly Goal Problems has to be a whole number")
      .min(1, "Weekly Goal Problems must be atleast 1 problem")
      .max(500, "Weekly Goal Problems cannot exceed 500 problems")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At Least one field is Required");

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export type UpdateProfilePreferencesSchema = z.infer<typeof updateProfilePreferencesSchema>;
