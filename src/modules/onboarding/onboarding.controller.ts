import { Request, Response, NextFunction } from "express";

import { onboardingService, OnboardingService } from "./onboarding.service";
import { completeOnBoardingSchema } from "./onboarding.validation";

export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  async completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const input = completeOnBoardingSchema.parse(req.body);

      const result = await this.onboardingService.completeOnboarding(userId, input);

      res.status(200).json({
        success: true,
        message: "Onboarding Completed SuccessFully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const onboardingController = new OnboardingController(onboardingService);
