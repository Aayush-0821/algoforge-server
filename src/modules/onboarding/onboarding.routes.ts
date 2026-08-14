import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import { onboardingController } from "./onboarding.controller";
import { completeOnBoardingSchema } from "./onboarding.validation";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validate(completeOnBoardingSchema),
    onboardingController.completeOnboarding.bind(onboardingController)
);

export default router;