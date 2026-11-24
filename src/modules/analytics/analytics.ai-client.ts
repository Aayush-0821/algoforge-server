import { env } from "../../config/env";
import { logger } from "../../config/logger";

import type { RecommendationReason } from "./analytics.constants";

interface AIServiceCandidate {
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  score: number;
  reasonCode: RecommendationReason;
}

interface AIServiceRequest {
  history: Array<{ slug: string; status: string }>;
  n: number;
  decay?: number;
  excludeSlugs?: string[];
  maxDifficulty?: number;
}

interface AIServiceResponse {
  success: boolean;
  data?: {
    recommendations: AIServiceCandidate[];
    meta: {
      historyCount: number;
      usableEntries: number;
      candidatesConsidered: number;
      ceiling: number;
      decay: number;
    };
  };
  message?: string;
}

export class AnalyticsAIClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number = 3000,
  ) {}

  async recommend(input: AIServiceRequest): Promise<AIServiceCandidate[]> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/recommend`;

    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      throw new Error(
        `AI service unreachable at ${url}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!res.ok) {
      throw new Error(`AI service returned HTTP ${res.status}`);
    }

    const body = (await res.json()) as AIServiceResponse;
    if (!body.success || !body.data?.recommendations) {
      throw new Error(`AI service returned invalid payload: ${body.message ?? "no data"}`);
    }

    logger.debug({ meta: body.data.meta }, "AI service recommend() ok");

    return body.data.recommendations;
  }
}

export const analyticsAIClient = new AnalyticsAIClient(
  env.AI_SERVICE_URL,
  env.AI_SERVICE_TIMEOUT_MS,
);