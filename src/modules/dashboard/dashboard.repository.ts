import { PrismaClient } from "../../../generated/postgres";
import { prisma } from "../../lib/postgres";

export class DashboardRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getTotalProblemsSolved(userId: string) {
    return this.prisma.submission.groupBy({
      by: ["problemId"],
      where: {
        userId,
        status: "ACCEPTED",
      },
    });
  }

  async getSubmissionsForHeatmap(userId: string, from: Date, to: Date) {
    return this.prisma.submission.findMany({
      where: {
        userId,
        submittedAt: {
          gte: from,
          lte: to,
        },
      },
      select: {
        problemId: true,
        status: true,
        submittedAt: true,
        problem: {
          select: {
            title: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        submittedAt: "asc",
      },
    });
  }

  async getActiveRoadmap(userId: string) {
    return this.prisma.roadmap.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        items: {
          where: {
            status: {
              in: ["NOT_STARTED", "IN_PROGRESS"],
            },
          },
          orderBy: {
            displayOrder: "asc",
          },
          take: 1,
          select: {
            id: true,
            title: true,
            status: true,
            displayOrder: true,
          },
        },
      },
    });
  }

  async getDailyRecommendation(userId: string) {
    return this.prisma.recommendation.findFirst({
      where: {
        userId,
        type: "PROBLEM",
        problemId: {
          not: null,
        },
        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gte: new Date(),
            },
          },
        ],
      },
      orderBy: [
        {
          score: "desc",
        },
        {
          generatedAt: "desc",
        },
      ],
      select: {
        id: true,
        score: true,
        reasonCode: true,
        generatedAt: true,
        expiresAt: true,
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
      },
    });
  }

  async getRecentActivities(userId: string, limit: number = 10) {
    return this.prisma.userActivity.findMany({
      where: {
        userId,
      },
      orderBy: {
        occurredAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        type: true,
        occurredAt: true,
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
          },
        },
        roadmap: {
          select: {
            id: true,
            title: true,
          },
        },
        topic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getAcceptedSubmissionDates(userId: string) {
    return this.prisma.submission.findMany({
      where: {
        userId,
        status: "ACCEPTED",
      },
      select: {
        submittedAt: true,
      },
      orderBy: {
        submittedAt: "asc",
      },
    });
  }
}

export const dashboardRepository = new DashboardRepository(prisma);
