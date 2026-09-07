import type { NextFunction, Request, Response } from "express";
import { leetcodeService } from "./leetcode.service";
import {
  recentSubmissionsQuerySchema,
  submissionIdParamSchema,
  userProblemParamSchema,
  usernameParamSchema,
} from "./leetcode.validation";

export class LeetCodeController {
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = usernameParamSchema.parse(req.params);
      res.status(200).json({
        success: true,
        data: await leetcodeService.getProfile(username),
      });
    } catch (error) {
      next(error);
    }
  }

  async getRecentSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username } = usernameParamSchema.parse(req.params);
      const { limit } = recentSubmissionsQuerySchema.parse(req.query);

      res.status(200).json({
        success: true,
        data: await leetcodeService.getRecentSubmissions(username, limit),
      });
    } catch (error) {
      next(error);
    }
  }

  async getProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { titleSlug } = userProblemParamSchema
        .pick({ titleSlug: true })
        .parse(req.params);

      res.status(200).json({
        success: true,
        data: await leetcodeService.getProblem(titleSlug),
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserProblemSubmissions(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { username, titleSlug } = userProblemParamSchema.parse(req.params);
      const { limit } = recentSubmissionsQuerySchema.parse(req.query);

      res.status(200).json({
        success: true,
        data: await leetcodeService.getPublicUserProblemSubmissions(
          username,
          titleSlug,
          limit,
        ),
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubmissionDetails(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { submissionId } = submissionIdParamSchema.parse(req.params);

      res.status(200).json({
        success: true,
        data: await leetcodeService.getSubmissionDetails(submissionId),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const leetcodeController = new LeetCodeController();
