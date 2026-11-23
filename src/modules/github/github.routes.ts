import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware";

import {
  getGitHubStatus,
  createRevisionVault,
} from "./github.controller";

const router = Router();

router.get(
  "/status",
  authMiddleware,
  getGitHubStatus,
);

router.post(
  "/revision-vault",
  authMiddleware,
  createRevisionVault,
);

export default router;