export interface LeetCodeTopicTag {
  name: string;
  slug: string;
}

export interface LeetCodeProfile {
  username: string;
  realName: string | null;
  ranking: number | null;
  reputation: number | null;
  solved: { easy: number; medium: number; hard: number; total: number };
}

export interface LeetCodeRecentSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
}

export interface LeetCodeProblem {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: LeetCodeTopicTag[];
}

export interface LeetCodeSubmissionDetail {
  id: string;
  runtime: number | null;
  runtimeDisplay: string | null;
  runtimePercentile: number | null;
  memory: number | null;
  memoryDisplay: string | null;
  memoryPercentile: number | null;
  code: string | null;
  timestamp: string;
  statusCode: number | null;
  statusDisplay: string | null;
  lang: { name: string; verboseName: string } | null;
  question: {
    questionId: string;
    questionFrontendId: string;
    title: string;
    titleSlug: string;
    difficulty: string;
    topicTags: LeetCodeTopicTag[];
  } | null;
}

export interface LeetCodeGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export interface LeetCodeProfileQueryData {
  matchedUser: {
    username: string;
    profile: { realName: string | null; ranking: number | null; reputation: number | null } | null;
    submitStatsGlobal: { acSubmissionNum: Array<{ difficulty: string; count: number }> } | null;
  } | null;
}

export interface LeetCodeRecentSubmissionsQueryData {
  recentAcSubmissionList: LeetCodeRecentSubmission[];
}

export interface LeetCodeQuestionQueryData {
  question: LeetCodeProblem | null;
}

export interface LeetCodeSubmissionDetailsQueryData {
  submissionDetails: LeetCodeSubmissionDetail | null;
}
