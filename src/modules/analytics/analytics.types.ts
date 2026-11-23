import type { DifficultyLevel, SubmissionStatus } from "../../../generated/postgres";

import type { RecommendationReason } from "./analytics.constants";

export interface RecordSubmissionInput {
    problemSlug: string;
    status: SubmissionStatus;
    language?: string;
    runtime?: number;
    memory?: number;
    solveTimeMinutes?: number;
    submittedAt?: Date;
}

export interface RecommendationFeedbackInput {
    isAccepted: boolean;
}

export interface CreateSubmissionData {
    problemId: string;
    status: SubmissionStatus;
    languageId: string | null;
    runtime?: number;
    memory?: number;
    solveInMinutes?: number;
    submittedAt: Date;
}

export interface NewRecommendation {
    problemId: string;
    score: number;
    reasonCode: RecommendationReason;
}

export interface RawProblemModel {
    slugs: string[];
    titles: string[];
    difficulty: string[];
    tags: string[][];
    neighbors: [number,number][][];
}

export interface ProblemModel extends Omit<RawProblemModel, "difficulty">{
    difficulty: DifficultyLevel[];
}

export interface HistoryEntry{
    slug: string;
    status: SubmissionStatus;
    difficulty: DifficultyLevel;
}

export interface RecommendOption{
    excludeSlugs: ReadonlySet<string>;
    maxDifficulty: number;
    limit: number;
}

export interface ScoredCandidate{
    slug: string;
    score: number;
    reasonCode: RecommendationReason;
}

export interface RecommendationDTO{
    id: string;
    score: number;
    reasonCode: string | null;
    generatedAt: Date;
    problem:{
        id: string;
        slug: string;
        title: string;
        problemUrl: string;
        difficulty: DifficultyLevel;
    }
}

export interface RecordSubmissionResult{
    submission:{
        id: string;
        status: SubmissionStatus;
        attempts: number;
    }
    recommendations: RecommendationDTO[];
}

