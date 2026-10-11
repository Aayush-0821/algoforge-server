import { redisService } from "../../database/redis/redis.service";
import { AppError } from "../../errors/app.errors";
import { leetcodeClient } from "./leetcode.client";
import type {
  LeetCodeProfile,
  LeetCodeProblem,
  LeetCodeRecentSubmission,
  LeetCodeSubmissionDetail,
} from "./leetcode.types";

const TTL = {
  profile: 15 * 60,
  recent: 5 * 60,
  problem: 24 * 60 * 60,
  detail: 5 * 60,
};

const cacheKey = {
  profile: (u: string) => `leetcode:profile:${u.toLowerCase()}`,
  recent: (u: string, l: number) => `leetcode:recent:${u.toLowerCase()}:${l}`,
  problem: (s: string) => `leetcode:question:${s.toLowerCase()}`,
  detail: (id: number) => `leetcode:submission-detail:${id}`,
};

class LeetCodeService {
  async getProfile(username: string): Promise<LeetCodeProfile> {
    const key = cacheKey.profile(username);
    const cached = await redisService.get(key);
    if (cached) return JSON.parse(cached) as LeetCodeProfile;

    const user = (await leetcodeClient.getProfile(username)).matchedUser;
    if (!user) throw new AppError("LeetCode user not found.", 404);

    const stats = user.submitStatsGlobal?.acSubmissionNum ?? [];
    const count = (difficulty: string) =>
      stats.find((x) => x.difficulty.toLowerCase() === difficulty.toLowerCase())?.count ?? 0;

    const profile: LeetCodeProfile = {
      username: user.username,
      realName: user.profile?.realName ?? null,
      ranking: user.profile?.ranking ?? null,
      reputation: user.profile?.reputation ?? null,
      solved: {
        easy: count("easy"),
        medium: count("medium"),
        hard: count("hard"),
        total: count("all"),
      },
    };

    await redisService.set(key, JSON.stringify(profile), TTL.profile);
    return profile;
  }

  async getRecentSubmissions(username: string, limit: number): Promise<LeetCodeRecentSubmission[]> {
    const key = cacheKey.recent(username, limit);
    const cached = await redisService.get(key);
    if (cached) return JSON.parse(cached) as LeetCodeRecentSubmission[];

    const submissions =
      (await leetcodeClient.getRecentSubmissions(username, limit)).recentAcSubmissionList ?? [];

    await redisService.set(key, JSON.stringify(submissions), TTL.recent);
    return submissions;
  }

  async getProblem(titleSlug: string): Promise<LeetCodeProblem> {
    const key = cacheKey.problem(titleSlug);
    const cached = await redisService.get(key);
    if (cached) return JSON.parse(cached) as LeetCodeProblem;

    const problem = (await leetcodeClient.getQuestion(titleSlug)).question;
    if (!problem) throw new AppError("LeetCode problem not found.", 404);

    await redisService.set(key, JSON.stringify(problem), TTL.problem);
    return problem;
  }

  async getPublicUserProblemSubmissions(
    username: string,
    titleSlug: string,
    limit: number,
  ): Promise<{
    username: string;
    titleSlug: string;
    submissions: LeetCodeRecentSubmission[];
    note: string;
  }> {
    const recent = await this.getRecentSubmissions(username, limit);

    const submissions = recent.filter(
      (submission) => submission.titleSlug.toLowerCase() === titleSlug.toLowerCase(),
    );

    return {
      username,
      titleSlug,
      submissions,
      note: "This uses LeetCode's public recentAcSubmissionList. It returns recent accepted submissions only (public, max 20), not the user's complete attempt history.",
    };
  }

  async getSubmissionDetails(submissionId: number): Promise<LeetCodeSubmissionDetail> {
    const key = cacheKey.detail(submissionId);
    const cached = await redisService.get(key);
    if (cached) return JSON.parse(cached) as LeetCodeSubmissionDetail;

    const details = (await leetcodeClient.getSubmissionDetails(submissionId)).submissionDetails;

    if (!details) {
      throw new AppError("Submission details are not publicly available for this submission.", 403);
    }

    await redisService.set(key, JSON.stringify(details), TTL.detail);
    return details;
  }
}

export const leetcodeService = new LeetCodeService();
