import { createPrivateRepository, getRepository } from "./github.client.js";

import { REVISION_VAULT_REPOSITORY } from "./github.constants.js";

import type { GitHubRepository } from "./github.types.js";

import { AppError } from "../../errors/app.errors.js";

export async function ensureRevisionVaultRepository(
  accessToken: string,
  githubUsername: string,
): Promise<GitHubRepository> {
  const existingRepository = await getRepository(
    accessToken,
    githubUsername,
    REVISION_VAULT_REPOSITORY,
  );

  if (existingRepository) {
    if (!existingRepository.private) {
      throw new AppError("AlgoForge-Revision-Vault exists but is not private.", 409);
    }

    return existingRepository;
  }

  return createPrivateRepository(
    accessToken,
    REVISION_VAULT_REPOSITORY,
  ) as Promise<GitHubRepository>;
}
