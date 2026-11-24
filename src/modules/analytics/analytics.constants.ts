import path from "path";

import { DifficultyLevel, ExperienceLevel, SubmissionStatus } from "../../../generated/postgres";

export const PROBLEM_MODEL_PATH =
  process.env.PROBLEM_MODEL_PATH ?? path.resolve(process.cwd(), "models/problem_model.json");

export const HISTORY_SIZE = 20;
export const HISTORY_FETCH_LIMIT = 60;
export const RECOMMENDATION_LIMIT = 5;
export const CANDIDATE_POOL_SIZE = 40;
export const RECOMMENDATION_TTL_DAYS = 7;

export const REGENCY_DECAY = 0.85;
export const TAG_BONUS = 0.3;
export const POPULARITY_WEIGHT = 0.15;

export const STATUS_WEIGHT: Record<SubmissionStatus, number> = {
  ACCEPTED: 1.0,
  WRONG_ANSWER: 1.5,
  TIME_LIMIT_EXCEEDED: 1.5,
  MEMORY_LIMIT_EXCEEDED: 1.5,
  RUNTIME_ERROR: 1.2,
  COMPILE_ERROR: 0.5,
};

export const STRUGGLE_STATUSES: ReadonlySet<SubmissionStatus> = new Set<SubmissionStatus>([
  "WRONG_ANSWER",
  "TIME_LIMIT_EXCEEDED",
  "MEMORY_LIMIT_EXCEEDED",
  "RUNTIME_ERROR",
]);

export const DIFFICULTY_ORDER: Record<DifficultyLevel, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

export const DIFFICULTIES_BY_ORDER: DifficultyLevel[] = ["EASY", "MEDIUM", "HARD"];

export const EXPERIENCE_START_CEILING: Record<ExperienceLevel, number> = {
  BEGINNER: 0,
  INTERMEDIATE: 1,
  ADVANCED: 2,
};

export const RECOMMENDATION_REASON = {
  PRACTICE_WEAK_PATTERN: "PRACTICE_WEAK_PATTERN",
  NEXT_STEP: "NEXT_STEP",
  POPULAR_STARTER: "POPULAR_STARTER",
};

export type RecommendationReason =
  (typeof RECOMMENDATION_REASON)[keyof typeof RECOMMENDATION_REASON];

export const LEETCODE_STATUS_MAP: Record<string, SubmissionStatus> = {
  Accepted: "ACCEPTED",
  "Wrong Answer": "WRONG_ANSWER",
  "Time Limit Exceeded": "TIME_LIMIT_EXCEEDED",
  "Memory Limit Exceeded": "MEMORY_LIMIT_EXCEEDED",
  "Runtime Error": "RUNTIME_ERROR",
  "Compile Error": "COMPILE_ERROR",
};
