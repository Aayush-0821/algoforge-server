import { randomBytes } from "crypto";

import { redisClient } from "../../../database/redis";
import { AppError } from "../../../errors/app.errors";

const OAUTH_STATE_TTL = 10 * 60;

type OAuthProvider = "GOOGLE" | "GITHUB";

function getStateKey(provider: OAuthProvider, state: string): string {
  return `oauth:state:${provider}:${state}`;
}

export async function createOAuthState(provider: OAuthProvider): Promise<string> {
  const state = randomBytes(32).toString("hex");

  const key = getStateKey(provider, state);

  await redisClient.setEx(key, OAUTH_STATE_TTL, "valid");

  return state;
}

export async function validateOAuthState(provider: OAuthProvider, state: string): Promise<void> {
  const key = getStateKey(provider, state);

  const storedState = await redisClient.get(key);

  if (!storedState) {
    throw new AppError("Invalid or Expired OAuth State.", 400);
  }

  await redisClient.del(key);
}
