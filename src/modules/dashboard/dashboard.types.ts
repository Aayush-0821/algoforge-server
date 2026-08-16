export type DashboardDifficulty = "EASY" | "MEDIUM" | "HARD";

export type DashboardActivityType =
  "PROBLEM_SOLVED" | "ROADMAP_STARTED" | "ROADMAP_COMPLETED" | "TOPIC_STARTED" | "TOPIC_COMPLETED";

export interface DashboardStats {
  totalProblemsSolved: number;
  currentStreak: number;
  longestStreak: number;
}

export interface HeatmapProblem {
  problemId: string;
  title: string;
  difficulty: DashboardDifficulty;
}

export interface HeatmapDay {
  date: string;
  problemsSolved: number;
  submissions: number;
  accuracy: number;
  problems: HeatmapProblem[];
}

export interface StreakSuggestion {
  type: "STREAK";
  title: string;
  message: string;
}

export interface RoadmapSuggestion {
  type: "ROADMAP";
  title: string;
  message: string;
  roadmapId: string;
  roadmapItemId: string;
}

export interface DailyProblemSuggestion {
  type: "DAILY_PROBLEM";
  title: string;
  message: string;
  problemId: string;
}

export type DashboardSuggestion = StreakSuggestion | RoadmapSuggestion | DailyProblemSuggestion;

export interface RecentActivity {
  id: string;
  type: DashboardActivityType;
  occurredAt: string;
  problem?: {
    id: string;
    title: string;
    difficulty: DashboardDifficulty;
  };
  roadmap?: {
    id: string;
    title: string;
  };
  topic?: {
    id: string;
    name: string;
  };
}

export interface DashboardResponse {
  stats: DashboardStats;
  heatmap: HeatmapDay[];
  suggestions: DashboardSuggestion[];
  recentActivity: RecentActivity[];
}
