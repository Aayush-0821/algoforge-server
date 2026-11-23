import {z} from "zod";
import { SubmissionStatus } from "../../../generated/postgres";
import { LEETCODE_STATUS_MAP } from "./analytics.constants";

const statusSchema = z.preprocess(
    (value) => (typeof value === "string" ? (LEETCODE_STATUS_MAP[value] ?? value) : value),
    z.nativeEnum(SubmissionStatus)
);

export const recordSubmissionSchema = z.object({
    problemSlug: z
        .string()
        .trim()
        .min(1)
        .max(200)
        .regex(/^[a-z0-9-]+$/, "Invalid problem slug"),

    status: statusSchema,
    language: z
        .string()
        .trim()
        .min(1)
        .max(50)
        .optional(),
    
    runtime: z
        .number()
        .int()
        .nonnegative()
        .optional(),
    
    memory: z
        .number()
        .int()
        .nonnegative()
        .optional(),
    
    solveTimeMinutes: z
        .number()
        .int()
        .nonnegative()
        .max(1440)
        .optional(),
    
    submittedAt: z.coerce
        .date()
        .refine((d) => d.getTime() <= Date.now() + 5 * 60 * 1000, "submittedAt cannot be in the future")
        .optional()
});

export const recommendationParamsSchema = z.object({
    id: z
        .string()
        .trim()
        .uuid("Invalid Recommendation ID")
});

export const recommendationFeedbackSchema = z.object({
    isAccepted: z.boolean()
});