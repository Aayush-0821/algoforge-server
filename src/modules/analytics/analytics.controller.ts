import { Request, Response, NextFunction } from "express";

import { analyticsService, AnalyticsService } from "./analytics.service";
import {
  recommendationFeedbackSchema,
  recommendationParamsSchema,
  recordSubmissionSchema,
} from "./analytics.validation";

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async recordSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const input = recordSubmissionSchema.parse(req.body);

      const result = await this.analyticsService.recordSubmission(userId, input);

      res.status(201).json({
        success: true,
        message: "Submission recorded.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const recommendations = await this.analyticsService.getRecommendations(userId);

      res.status(200).json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const { id } = recommendationParamsSchema.parse(req.params);
      const input = recommendationFeedbackSchema.parse(req.body);

      const result = await this.analyticsService.submitFeedback(userId, id, input);

      res.status(200).json({
        success: true,
        message: "Feedback saved.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController(analyticsService);