import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import { analyticsController } from "./analytics.controller";
import { recommendationFeedbackSchema, recordSubmissionSchema } from "./analytics.validation";

const router = Router();

router.post(
  "/submissions",
  authMiddleware,
  validate(recordSubmissionSchema),
  analyticsController.recordSubmission.bind(analyticsController),
);

router.get(
  "/recommendations",
  authMiddleware,
  analyticsController.getRecommendations.bind(analyticsController),
);

router.patch(
  "/recommendations/:id/feedback",
  authMiddleware,
  validate(recommendationFeedbackSchema),
  analyticsController.submitFeedback.bind(analyticsController),
);

export default router;
