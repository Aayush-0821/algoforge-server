import {
  DifficultyLevel,
  PrismaClient,
  RecommendationType,
  SubmissionStatus,
} from "../../../generated/postgres";
import { prisma } from "../../lib/postgres";

import type { CreateSubmissionData, NewRecommendation } from "./analytics.types";

const PROBLEM_SELECT = {
  id: true,
  slug: true,
  title: true,
  problemUrl: true,
  difficulty: true,
  frequencyScore: true,
} as const;

const RECOMMENDATION_SELECT = {
  id: true,
  score: true,
  reasonCode: true,
  generatedAt: true,
  problem: {
    select: { id: true, slug: true, title: true, problemUrl: true, difficulty: true },
  },
} as const;

export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findProblemBySlug(slug: string) {
    return this.prisma.problem.findUnique({
      where: { slug },
      select: { id: true },
    });
  }

  async findProgrammingLanguageByName(name: string) {
    return this.prisma.programmingLanguage.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
      select: { id: true },
    });
  }

  async createSubmission(userId: string, data: CreateSubmissionData) {
    return this.prisma.$transaction(async (tx) => {
      const previousAttempts = await tx.submission.count({
        where: { userId, problemId: data.problemId },
      });

      return tx.submission.create({
        data: { userId, ...data, attempts: previousAttempts + 1 },
        select: { id: true, status: true, attempts: true },
      });
    });
  }

  /** Newest first; may contain several rows per problem. */
  async getRecentSubmissions(userId: string, take: number) {
    return this.prisma.submission.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" },
      take,
      select: {
        status: true,
        problem: { select: { slug: true, difficulty: true } },
      },
    });
  }

  async getSolvedProblemSlugs(userId: string): Promise<string[]> {
    const rows = await this.prisma.submission.findMany({
      where: { userId, status: SubmissionStatus.ACCEPTED },
      distinct: ["problemId"],
      select: { problem: { select: { slug: true } } },
    });

    return rows.map((row) => row.problem.slug);
  }

  async getExperienceLevel(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      select: { experienceLevel: true },
    });

    return profile?.experienceLevel ?? null;
  }

  async findProblemsBySlugs(slugs: string[]) {
    return this.prisma.problem.findMany({
      where: { slug: { in: slugs } },
      select: PROBLEM_SELECT,
    });
  }

  async getPopularProblems(excludeSlugs: string[], difficulties: DifficultyLevel[], take: number) {
    return this.prisma.problem.findMany({
      where: {
        slug: { notIn: excludeSlugs },
        difficulty: { in: difficulties },
      },
      orderBy: { frequencyScore: { sort: "desc", nulls: "last" } },
      take,
      select: PROBLEM_SELECT,
    });
  }

  async getActiveRecommendations(userId: string, take: number) {
    return this.prisma.recommendation.findMany({
      where: {
        userId,
        type: RecommendationType.PROBLEM,
        expiresAt: { gt: new Date() },
      },
      orderBy: { score: "desc" },
      take,
      select: RECOMMENDATION_SELECT,
    });
  }

  /** Expires the user's current problem recommendations and stores the new set. */
  async replaceActiveRecommendations(userId: string, items: NewRecommendation[], expiresAt: Date) {
    const now = new Date();

    return this.prisma.$transaction(async (tx) => {
      await tx.recommendation.updateMany({
        where: {
          userId,
          type: RecommendationType.PROBLEM,
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { expiresAt: now },
      });

      const created = [];
      for (const item of items) {
        created.push(
          await tx.recommendation.create({
            data: {
              userId,
              type: RecommendationType.PROBLEM,
              problemId: item.problemId,
              score: item.score,
              reasonCode: item.reasonCode,
              generatedAt: now,
              expiresAt,
            },
            select: RECOMMENDATION_SELECT,
          }),
        );
      }

      return created;
    });
  }

  /** Returns how many rows were updated (0 = not found or not owned by the user). */
  async updateRecommendationFeedback(userId: string, id: string, isAccepted: boolean) {
    const result = await this.prisma.recommendation.updateMany({
      where: { id, userId },
      data: { isAccepted },
    });

    return result.count;
  }
}

export const analyticsRepository = new AnalyticsRepository(prisma);
