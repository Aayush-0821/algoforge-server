import { SubmissionStatus } from "../../../generated/postgres";
import type { ExperienceLevel } from "../../../generated/postgres";
import { AppError } from "../../errors/app.errors";

import {
  CANDIDATE_POOL_SIZE,
  DIFFICULTIES_BY_ORDER,
  DIFFICULTY_ORDER,
  EXPERIENCE_START_CEILING,
  HISTORY_FETCH_LIMIT,
  HISTORY_SIZE,
  POPULARITY_WEIGHT,
  RECOMMENDATION_LIMIT,
  RECOMMENDATION_REASON,
  RECOMMENDATION_TTL_DAYS,
} from "./analytics.constants";
import { problemRecommender, ProblemRecommender } from "./analytics.recommender";
import { AnalyticsRepository, analyticsRepository } from "./analytics.repository";
import type {
  HistoryEntry,
  NewRecommendation,
  RecommendationDTO,
  RecommendationFeedbackInput,
  RecordSubmissionInput,
  RecordSubmissionResult,
  ScoredCandidate,
} from "./analytics.types";

type RecommendationRow = Awaited<
  ReturnType<AnalyticsRepository["getActiveRecommendations"]>
>[number];

type ProblemRow = Awaited<ReturnType<AnalyticsRepository["findProblemsBySlugs"]>>[number];

export class AnalyticsService {
  constructor(
    private readonly analyticsRepository: AnalyticsRepository,
    private readonly recommender: ProblemRecommender,
  ) {}

  async recordSubmission(
    userId: string,
    input: RecordSubmissionInput,
  ): Promise<RecordSubmissionResult> {
    const problem = await this.analyticsRepository.findProblemBySlug(input.problemSlug);
    if (!problem) {
      throw new AppError("Problem not found.", 404);
    }

    // Unknown language names are stored as null rather than rejecting the submission
    let languageId: string | null = null;
    if (input.language) {
      const language = await this.analyticsRepository.findProgrammingLanguageByName(
        input.language,
      );
      languageId = language?.id ?? null;
    }

    const submission = await this.analyticsRepository.createSubmission(userId, {
      problemId: problem.id,
      status: input.status,
      languageId,
      runtime: input.runtime,
      memory: input.memory,
      solveInMinutes: input.solveTimeMinutes,
      submittedAt: input.submittedAt ?? new Date(),
    });

    // The submission is already saved. A recommendation failure must not turn this into a
    // 500, or the extension will retry and create a duplicate submission.
    let recommendations: RecommendationDTO[] = [];
    try {
      recommendations = await this.generateRecommendations(userId);
    } catch (error) {
      console.error("Failed to generate recommendations", error); // TODO: use your logger
    }

    return { submission, recommendations };
  }

  async getRecommendations(userId: string): Promise<RecommendationDTO[]> {
    const active = await this.analyticsRepository.getActiveRecommendations(
      userId,
      RECOMMENDATION_LIMIT,
    );

    if (active.length > 0) {
      return this.toDTOs(active);
    }

    return this.generateRecommendations(userId);
  }

  async submitFeedback(userId: string, recommendationId: string, input: RecommendationFeedbackInput) {
    const updated = await this.analyticsRepository.updateRecommendationFeedback(
      userId,
      recommendationId,
      input.isAccepted,
    );

    if (updated === 0) {
      throw new AppError("Recommendation not found.", 404);
    }

    return { id: recommendationId, isAccepted: input.isAccepted };
  }

  private async generateRecommendations(userId: string): Promise<RecommendationDTO[]> {
    const [recentRows, solvedSlugs, experienceLevel] = await Promise.all([
      this.analyticsRepository.getRecentSubmissions(userId, HISTORY_FETCH_LIMIT),
      this.analyticsRepository.getSolvedProblemSlugs(userId),
      this.analyticsRepository.getExperienceLevel(userId),
    ]);

    const history = this.buildHistory(recentRows);
    const ceiling = this.difficultyCeiling(history, experienceLevel);
    const exclude = new Set<string>([...solvedSlugs, ...history.map((h) => h.slug)]);

    const candidates = this.recommender.recommend(history, {
      excludeSlugs: exclude,
      maxDifficulty: ceiling,
      limit: CANDIDATE_POOL_SIZE,
    });

    let picked: NewRecommendation[] = [];
    if (candidates.length > 0) {
      const problems = await this.analyticsRepository.findProblemsBySlugs(
        candidates.map((c) => c.slug),
      );
      picked = this.rank(candidates, problems);
    }

    // New user, or none of the candidates exist in the DB yet
    if (picked.length === 0) {
      picked = await this.coldStart(exclude, ceiling);
    }

    if (picked.length === 0) {
      return [];
    }

    const expiresAt = new Date(Date.now() + RECOMMENDATION_TTL_DAYS * 24 * 60 * 60 * 1000);
    const saved = await this.analyticsRepository.replaceActiveRecommendations(
      userId,
      picked,
      expiresAt,
    );

    return this.toDTOs(saved);
  }

  /** Rows are newest first; keeps the latest submission per problem. */
  private buildHistory(
    rows: { status: SubmissionStatus; problem: { slug: string; difficulty: HistoryEntry["difficulty"] } }[],
  ): HistoryEntry[] {
    const seen = new Set<string>();
    const history: HistoryEntry[] = [];

    for (const row of rows) {
      if (seen.has(row.problem.slug)) continue;
      seen.add(row.problem.slug);

      history.push({
        slug: row.problem.slug,
        status: row.status,
        difficulty: row.problem.difficulty,
      });

      if (history.length === HISTORY_SIZE) break;
    }

    return history;
  }

  /** One level above the hardest recently-solved problem, never below the user's self-reported level. */
  private difficultyCeiling(history: HistoryEntry[], experienceLevel: ExperienceLevel | null) {
    const base = experienceLevel ? EXPERIENCE_START_CEILING[experienceLevel] : 1;

    const solved = history
      .filter((h) => h.status === SubmissionStatus.ACCEPTED)
      .map((h) => DIFFICULTY_ORDER[h.difficulty]);
    const hardestSolved = solved.length > 0 ? Math.max(...solved) : -1;

    return Math.min(2, Math.max(base, hardestSolved + 1));
  }

  /** Blends model score with a small popularity prior (frequencyScore) from your DB. */
  private rank(candidates: ScoredCandidate[], problems: ProblemRow[]): NewRecommendation[] {
    const bySlug = new Map(problems.map((p) => [p.slug, p]));
    const rows = candidates.flatMap((candidate) => {
      const problem = bySlug.get(candidate.slug);
      return problem ? [{ candidate, problem }] : [];
    });

    const maxScore = Math.max(1e-9, ...rows.map((r) => r.candidate.score));
    const maxFrequency = Math.max(1e-9, ...rows.map((r) => r.problem.frequencyScore ?? 0));

    return rows
      .map(({ candidate, problem }) => ({
        problemId: problem.id,
        reasonCode: candidate.reasonCode,
        score:
          candidate.score / maxScore +
          POPULARITY_WEIGHT * ((problem.frequencyScore ?? 0) / maxFrequency),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, RECOMMENDATION_LIMIT);
  }

  private async coldStart(exclude: Set<string>, ceiling: number): Promise<NewRecommendation[]> {
    const problems = await this.analyticsRepository.getPopularProblems(
      [...exclude],
      DIFFICULTIES_BY_ORDER.slice(0, ceiling + 1),
      RECOMMENDATION_LIMIT,
    );

    return problems.map((problem) => ({
      problemId: problem.id,
      score: problem.frequencyScore ?? 0,
      reasonCode: RECOMMENDATION_REASON.POPULAR_STARTER,
    }));
  }

  private toDTOs(rows: RecommendationRow[]): RecommendationDTO[] {
    return rows.flatMap((row) =>
      row.problem
        ? [
            {
              id: row.id,
              score: row.score,
              reasonCode: row.reasonCode,
              generatedAt: row.generatedAt,
              problem: row.problem,
            },
          ]
        : [],
    );
  }
}

export const analyticsService = new AnalyticsService(analyticsRepository, problemRecommender);