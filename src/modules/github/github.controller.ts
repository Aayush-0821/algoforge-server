import type { Request, Response } from "express";
import { AppError } from "../../errors/app.errors.js";
import {
  getGitHubConnection,
  getGitHubAccessToken,
  createGithubSummaryJob,
  markGithubSummaryJobProcessing,
  markGithubSummaryJobCompleted,
  markGithubSummaryJobFailed,
} from "./github.service.js";
import { revisionVaultSchema } from "./github.validation.js";
import { ensureRevisionVaultRepository } from "./github.repository.js";
import {
  createRevisionFilePath,
  createCommitMessage,
} from "./github.utils.js";
import { createOrUpdateRepositoryFile } from "./github.client.js";
import { generateRevision } from "./github.llm.js";
import { renderRevisionMarkdown } from "./github.markdown.js";
import { mongo } from "../../database/mongo/mongodb";

export async function getGitHubStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required.", 401);
  }

  const connection = await getGitHubConnection(userId);

  res.status(200).json({
    connected: true,
    github: {
      id: connection.githubUserId,
      username: connection.githubUsername,
      email: connection.githubEmail,
      avatarUrl: connection.avatarUrl,
    },
  });
}

export async function createRevisionVault(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError("Authentication required.", 401);
  }

  const input = revisionVaultSchema.parse(req.body);

  const connection = await getGitHubConnection(userId);
  const accessToken = await getGitHubAccessToken(userId);

  const job = await createGithubSummaryJob(userId, {
    problemNumber: input.problemNumber,
    problemTitle: input.problemTitle,
    difficulty: input.difficulty,
    language: input.language,
  });

  try {
    await markGithubSummaryJobProcessing(job.id);

    const repository = await ensureRevisionVaultRepository(
      accessToken,
      connection.githubUsername,
    );

    const revision = await generateRevision({
      problemNumber: input.problemNumber,
      problemTitle: input.problemTitle,
      difficulty: input.difficulty,
      language: input.language,
      problemUrl: input.problemUrl,
      code: input.code,
    });

    const markdown = renderRevisionMarkdown(input, revision);

    const filePath = createRevisionFilePath(
      input.problemNumber,
      input.problemTitle,
    );

    const commitMessage = createCommitMessage(
      input.problemNumber,
      input.problemTitle,
    );

    const fileResult = await createOrUpdateRepositoryFile(
      accessToken,
      connection.githubUsername,
      repository.name,
      filePath,
      markdown,
      commitMessage,
    );

    const githubSummary = await mongo.githubSummary.create({
      data: {
        userId,
        date: new Date(),
        summaryMarkdown: markdown,
        repositoryName: repository.name,
        commitMessage,
        commitHash: fileResult.commit.sha,
        branch: repository.default_branch,
        filesChanged: filePath,
        generatedBy: "llm",
        modelVersion: process.env.LLM_MODEL ?? "unknown",
      },
    });

    await markGithubSummaryJobCompleted(job.id);

    res.status(201).json({
      success: true,
      message: "Revision saved to your AlgoForge Revision Vault.",
      revision: {
        id: githubSummary.id,
        repository: repository.name,
        filePath,
        commitHash: fileResult.commit.sha,
        commitUrl: fileResult.commit.html_url,
        repositoryUrl: repository.html_url,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create revision.";

    await markGithubSummaryJobFailed(job.id, errorMessage);

    throw error;
  }
}