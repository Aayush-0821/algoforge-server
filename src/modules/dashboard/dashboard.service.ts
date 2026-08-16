import { dashboardRepository } from "./dashboard.repository";
import {
  DashboardResponse,
  DashboardSuggestion,
  HeatmapDay,
  RecentActivity,
} from "./dashboard.types";
import { getIndiaDate, getIndiaDateEnd, getIndiaDateStart } from "./dashboard.utils";
import { DashboardQuery } from "./dashboard.validation";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export class DashboardService {
  async getDashboard(userId: string, query: DashboardQuery): Promise<DashboardResponse> {
    const { from, to } = this.getDateRange(query);

    const [
      totalProblemsSolved,
      acceptedSubmissionDates,
      submissions,
      activeRoadmap,
      dailyRecommendation,
      recentActivities,
    ] = await Promise.all([
      dashboardRepository.getTotalProblemsSolved(userId),
      dashboardRepository.getAcceptedSubmissionDates(userId),
      dashboardRepository.getSubmissionsForHeatmap(userId, from, to),
      dashboardRepository.getActiveRoadmap(userId),
      dashboardRepository.getDailyRecommendation(userId),
      dashboardRepository.getRecentActivities(userId),
    ]);

    const { currentStreak, longestStreak } = this.calculateStreaks(
      acceptedSubmissionDates.map((submission) => submission.submittedAt),
    );

    const heatmap = this.buildHeatmap(submissions);

    const suggestions = this.buildSuggestions(currentStreak, activeRoadmap, dailyRecommendation);

    const recentActivity = this.buildRecentActivities(recentActivities);

    return {
      stats: {
        totalProblemsSolved: totalProblemsSolved.length,
        currentStreak,
        longestStreak,
      },
      heatmap,
      suggestions,
      recentActivity,
    };
  }

  private getDateRange(query: DashboardQuery): {
    from: Date;
    to: Date;
  } {
    const now = new Date();

    if (query.from && query.to) {
      return {
        from: getIndiaDateStart(query.from),
        to: getIndiaDateEnd(query.to),
      };
    }

    if (query.from) {
      return {
        from: getIndiaDateStart(query.from),
        to: now,
      };
    }

    if (query.to) {
      const to = getIndiaDateEnd(query.to);
      const from = new Date(to.getTime() - 364 * DAY_IN_MS);

      return {
        from,
        to,
      };
    }

    return {
      from: new Date(now.getTime() - 364 * DAY_IN_MS),
      to: now,
    };
  }

  private calculateStreaks(dates: Date[]): {
    currentStreak: number;
    longestStreak: number;
  } {
    if (dates.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
      };
    }

    const uniqueDates = new Set(dates.map((date) => getIndiaDate(date)));

    const sortedDates = [...uniqueDates].sort();

    let longestStreak = 1;
    let currentStreak = 1;

    for (let index = 1; index < sortedDates.length; index += 1) {
      const previous = new Date(`${sortedDates[index - 1]}T00:00:00.000Z`);
      const current = new Date(`${sortedDates[index]}T00:00:00.000Z`);

      const differenceInDays = (current.getTime() - previous.getTime()) / DAY_IN_MS;

      if (differenceInDays === 1) {
        currentStreak += 1;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    const today = getIndiaDate(new Date());

    const yesterday = getIndiaDate(new Date(Date.now() - DAY_IN_MS));
    const latestDate = sortedDates[sortedDates.length - 1];

    if (latestDate !== today && latestDate !== yesterday) {
      currentStreak = 0;
    } else {
      currentStreak = 1;

      for (let index = sortedDates.length - 1; index > 0; index -= 1) {
        const current = new Date(`${sortedDates[index]}T00:00:00.000Z`);
        const previous = new Date(`${sortedDates[index - 1]}T00:00:00.000Z`);

        const differenceInDays = (current.getTime() - previous.getTime()) / DAY_IN_MS;

        if (differenceInDays !== 1) {
          break;
        }

        currentStreak += 1;
      }
    }

    return {
      currentStreak,
      longestStreak,
    };
  }

  private buildHeatmap(
    submissions: Awaited<ReturnType<typeof dashboardRepository.getSubmissionsForHeatmap>>,
  ): HeatmapDay[] {
    const days = new Map<
      string,
      {
        submissions: number;
        acceptedProblems: Set<string>;
        problems: Map<
          string,
          {
            problemId: string;
            title: string;
            difficulty: "EASY" | "MEDIUM" | "HARD";
          }
        >;
      }
    >();

    for (const submission of submissions) {
      const date = getIndiaDate(submission.submittedAt);

      if (!days.has(date)) {
        days.set(date, {
          submissions: 0,
          acceptedProblems: new Set(),
          problems: new Map(),
        });
      }

      const day = days.get(date)!;

      day.submissions += 1;

      if (submission.status === "ACCEPTED") {
        day.acceptedProblems.add(submission.problemId);

        day.problems.set(submission.problemId, {
          problemId: submission.problemId,
          title: submission.problem.title,
          difficulty: submission.problem.difficulty,
        });
      }
    }

    return [...days.entries()]
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, day]) => ({
        date,
        problemsSolved: day.acceptedProblems.size,
        submissions: day.submissions,
        accuracy:
          day.submissions === 0
            ? 0
            : Number(([...day.acceptedProblems].length / day.submissions).toFixed(2)),
        problems: [...day.problems.values()],
      }));
  }

  private buildSuggestions(
    currentStreak: number,
    roadmap: Awaited<ReturnType<typeof dashboardRepository.getActiveRoadmap>>,
    recommendation: Awaited<ReturnType<typeof dashboardRepository.getDailyRecommendation>>,
  ): DashboardSuggestion[] {
    const suggestions: DashboardSuggestion[] = [];

    if (currentStreak === 0) {
      suggestions.push({
        type: "STREAK",
        title: "Start your streak",
        message: "Solve a problem today to start a new streak.",
      });
    } else {
      suggestions.push({
        type: "STREAK",
        title: "Keep your streak alive",
        message: `You're on a ${currentStreak}-day streak. Keep going!`,
      });
    }

    const roadmapItem = roadmap?.items[0];

    if (roadmap && roadmapItem) {
      suggestions.push({
        type: "ROADMAP",
        title: "Continue your roadmap",
        message: `Continue with "${roadmapItem.title}".`,
        roadmapId: roadmap.id,
        roadmapItemId: roadmapItem.id,
      });
    }

    if (recommendation?.problem) {
      suggestions.push({
        type: "DAILY_PROBLEM",
        title: "Daily recommended problem",
        message: `Try "${recommendation.problem.title}" today.`,
        problemId: recommendation.problem.id,
      });
    }

    return suggestions;
  }

  private buildRecentActivities(
    activities: Awaited<ReturnType<typeof dashboardRepository.getRecentActivities>>,
  ): RecentActivity[] {
    return activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      occurredAt: activity.occurredAt.toISOString(),
      ...(activity.problem && {
        problem: activity.problem,
      }),
      ...(activity.roadmap && {
        roadmap: activity.roadmap,
      }),
      ...(activity.topic && {
        topic: activity.topic,
      }),
    }));
  }
}

export const dashboardService = new DashboardService();
