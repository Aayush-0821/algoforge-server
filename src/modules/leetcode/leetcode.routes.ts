import { Router } from "express";
import { leetcodeController } from "./leetcode.controller";

const router = Router();

router.get("/profile/:username", leetcodeController.getProfile.bind(leetcodeController));

router.get(
  "/submissions/:username",
  leetcodeController.getRecentSubmissions.bind(leetcodeController),
);

router.get("/problem/:titleSlug", leetcodeController.getProblem.bind(leetcodeController));

router.get(
  "/submissions/:username/:titleSlug",
  leetcodeController.getUserProblemSubmissions.bind(leetcodeController),
);

router.get(
  "/submission/:submissionId",
  leetcodeController.getSubmissionDetails.bind(leetcodeController),
);

export default router;
