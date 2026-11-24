import { postgres } from "../../database/postgres/postgres.js";
import type { Prisma } from "../../../generated/postgres/index.js";

import type {
  GitHubProfile,
  GitHubTokenResponse,
} from "../auth/oauth/github.oauth.js";

import {
  encryptGitHubToken,
} from "./github.crypto.js";

import { AppError } from "../../errors/app.errors.js";

import {
  decryptGitHubToken,
} from "./github.crypto.js";

import {
  AIJobStatus,
  AIJobType,
} from "../../../generated/postgres/index.js";

import { mongo } from "../../database/mongo/mongodb.js";

export async function saveGitHubConnection(
  userId: string,
  profile: GitHubProfile,
  token: GitHubTokenResponse,
) {
  const accessTokenExpiresAt =
    token.expires_in
      ? new Date(
          Date.now() +
            token.expires_in * 1000,
        )
      : null;

  const refreshTokenExpiresAt =
    token.refresh_token_expires_in
      ? new Date(
          Date.now() +
            token.refresh_token_expires_in *
              1000,
        )
      : null;

  return postgres.gitHubConnection.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      githubUserId: profile.id,
      githubUsername: profile.login,
      githubEmail: profile.email,
      avatarUrl: profile.avatarUrl ?? null,

      accessTokenEncrypted:
        encryptGitHubToken(
          token.access_token,
        ),

      refreshTokenEncrypted:
        token.refresh_token
          ? encryptGitHubToken(
              token.refresh_token,
            )
          : null,

      accessTokenExpiresAt,
      refreshTokenExpiresAt,

      scope: token.scope,
    },

    update: {
      githubUserId: profile.id,
      githubUsername: profile.login,
      githubEmail: profile.email,
      avatarUrl: profile.avatarUrl ?? null,

      accessTokenEncrypted:
        encryptGitHubToken(
          token.access_token,
        ),

      refreshTokenEncrypted:
        token.refresh_token
          ? encryptGitHubToken(
              token.refresh_token,
            )
          : null,

      accessTokenExpiresAt,
      refreshTokenExpiresAt,

      scope: token.scope,
    },
  });
}

export async function getGitHubConnection(
  userId: string,
) {
  const connection =
    await postgres.gitHubConnection.findUnique({
      where: {
        userId,
      },
    });

  if (!connection) {
    throw new AppError(
      "GitHub is not connected to your AlgoForge account.",
      400,
    );
  }

  return connection;
}

export async function getGitHubAccessToken(
  userId: string,
): Promise<string> {
  const connection =
    await getGitHubConnection(userId);

  if (
    connection.accessTokenExpiresAt &&
    connection.accessTokenExpiresAt <= new Date()
  ) {
    throw new AppError(
      "Your GitHub connection has expired. Please reconnect GitHub.",
      401,
    );
  }

  return decryptGitHubToken(
    connection.accessTokenEncrypted,
  );
}
export async function createGithubSummaryJob(
  userId: string,
  metadata: Prisma.InputJsonValue,
) {
  return postgres.aIJob.create({
    data: {
      userId,
      jobType: AIJobType.GITHUB_SUMMARY,
      status: AIJobStatus.QUEUED,
      metadata,
    },
  });
}

export async function markGithubSummaryJobProcessing(
  jobId: string,
) {
  return postgres.aIJob.update({
    where: {
      id: jobId,
    },

    data: {
      status: AIJobStatus.PROCESSING,
      startedAt: new Date(),
    },
  });
}

export async function markGithubSummaryJobCompleted(
  jobId: string,
) {
  return postgres.aIJob.update({
    where: {
      id: jobId,
    },

    data: {
      status: AIJobStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

export async function markGithubSummaryJobFailed(
  jobId: string,
  errorMessage: string,
) {
  return postgres.aIJob.update({
    where: {
      id: jobId,
    },

    data: {
      status: AIJobStatus.FAILED,
      errorMessage,
      completedAt: new Date(),
    },
  });
}

export async function saveGithubSummary(
  userId: string,
  data: {
    summaryMarkdown: string;
    repositoryName: string;
    commitMessage: string;
    commitHash: string;
    branch: string;
    filesChanged: string;
    generatedBy: string;
    modelVersion: string;
  },
) {
  return mongo.githubSummary.create({
    data: {
      userId,
      date: new Date(),

      summaryMarkdown:
        data.summaryMarkdown,

      repositoryName:
        data.repositoryName,

      commitMessage:
        data.commitMessage,

      commitHash:
        data.commitHash,

      branch:
        data.branch,

      filesChanged:
        data.filesChanged,

      generatedBy:
        data.generatedBy,

      modelVersion:
        data.modelVersion,
    },
  });
}