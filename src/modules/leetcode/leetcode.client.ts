import { AppError } from "../../errors/app.errors";
import type {
  LeetCodeGraphQLResponse,
  LeetCodeProfileQueryData,
  LeetCodeQuestionQueryData,
  LeetCodeRecentSubmissionsQueryData,
  LeetCodeSubmissionDetailsQueryData,
} from "./leetcode.types";

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/";

const PROFILE_QUERY = `query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile { realName ranking reputation }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
}`;

const RECENT_SUBMISSIONS_QUERY = `query recentAcSubmissions($username: String!, $limit: Int!) {
  recentAcSubmissionList(username: $username, limit: $limit) {
    id title titleSlug timestamp
  }
}`;

const QUESTION_QUERY = `query questionData($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId title titleSlug difficulty
    topicTags { name slug }
  }
}`;

const SUBMISSION_DETAILS_QUERY = `query submissionDetails($submissionId: Int!) {
  submissionDetails(submissionId: $submissionId) {
    id
    runtime
    runtimeDisplay
    runtimePercentile
    memory
    memoryDisplay
    memoryPercentile
    code
    timestamp
    statusCode
    statusDisplay
    lang { name verboseName }
    question {
      questionId questionFrontendId title titleSlug difficulty
      topicTags { name slug }
    }
  }
}`;

interface GraphQLRequest {
  query: string;
  variables: Record<string, string | number>;
  operationName?: string;
}

class LeetCodeClient {
  private async request<T>(payload: GraphQLRequest): Promise<T> {
    let response: Response;

    try {
      response = await fetch(LEETCODE_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": "AlgoForge/1.0",
          Referer: "https://leetcode.com/",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new AppError("Unable to connect to LeetCode.", 502);
    }

    if (!response.ok) {
      throw new AppError(`LeetCode returned HTTP ${response.status}.`, 502);
    }

    let body: LeetCodeGraphQLResponse<T>;
    try {
      body = (await response.json()) as LeetCodeGraphQLResponse<T>;
    } catch {
      throw new AppError("LeetCode returned an invalid response.", 502);
    }

    if (body.errors?.length) {
      throw new AppError(
        body.errors[0]?.message || "LeetCode GraphQL request failed.",
        502,
      );
    }

    if (!body.data) {
      throw new AppError("LeetCode returned no data.", 502);
    }

    return body.data;
  }

  async getProfile(username: string): Promise<LeetCodeProfileQueryData> {
    return this.request({
      query: PROFILE_QUERY,
      variables: { username },
      operationName: "getUserProfile",
    });
  }

  async getRecentSubmissions(
    username: string,
    limit: number,
  ): Promise<LeetCodeRecentSubmissionsQueryData> {
    return this.request({
      query: RECENT_SUBMISSIONS_QUERY,
      variables: { username, limit },
      operationName: "recentAcSubmissions",
    });
  }

  async getQuestion(titleSlug: string): Promise<LeetCodeQuestionQueryData> {
    return this.request({
      query: QUESTION_QUERY,
      variables: { titleSlug },
      operationName: "questionData",
    });
  }

  async getSubmissionDetails(
    submissionId: number,
  ): Promise<LeetCodeSubmissionDetailsQueryData> {
    return this.request({
      query: SUBMISSION_DETAILS_QUERY,
      variables: { submissionId },
      operationName: "submissionDetails",
    });
  }
}

export const leetcodeClient = new LeetCodeClient();
