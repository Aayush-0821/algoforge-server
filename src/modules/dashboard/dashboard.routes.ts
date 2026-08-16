import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";

import { dashboardController } from "./dashboard.controller";
import { dashboardQuerySchema } from "./dashboard.validation";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validate(dashboardQuerySchema),
  dashboardController.getDashboard.bind(dashboardController),
);

export default router;
