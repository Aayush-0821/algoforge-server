import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import { subscriptionController } from "./subscriptions.controller";

import {
  applyPromoCodeSchema,
  createSubscriptionSchema,
} from "./subscriptions.validation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  subscriptionController.getSubscription.bind(subscriptionController),
);

router.get(
  "/plans",
  subscriptionController.getAvailablePlans.bind(subscriptionController),
);

router.get(
  "/plans/:planId",
  subscriptionController.getPlan.bind(subscriptionController),
);

router.post(
  "/calculate",
  authMiddleware,
  validate(createSubscriptionSchema),
  subscriptionController.calculateSubscriptionPrice.bind(
    subscriptionController,
  ),
);

router.post(
  "/promo/validate",
  authMiddleware,
  validate(applyPromoCodeSchema),
  subscriptionController.validatePromoCode.bind(
    subscriptionController,
  ),
);

router.get(
  "/features/:featureKey",
  authMiddleware,
  subscriptionController.checkFeatureAccess.bind(
    subscriptionController,
  ),
);

export default router;