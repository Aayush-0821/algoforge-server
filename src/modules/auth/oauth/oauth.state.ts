import { randomBytes } from "crypto";

import { redisClient } from "../../../database/redis";
import { AppError } from "../../../errors/app.errors";

const OAUTH_STATE_TTL = 10 * 60;

export type OAuthProvider = "GOOGLE" | "GITHUB";
export type OAuthMode = "login" | "signup";

function getStateKey(provider: OAuthProvider, state: string): string {
  return `oauth:state:${provider}:${state}`;
}

export async function createOAuthState(
  provider: OAuthProvider,
  mode: OAuthMode,
): Promise<string> {
  const state = randomBytes(32).toString("hex");

  const key = getStateKey(provider, state);

  await redisClient.setEx(
    key,
    OAUTH_STATE_TTL,
    JSON.stringify({ mode }),
  );

  return state;
}

export async function validateOAuthState(
  provider: OAuthProvider,
  state: string,
): Promise<{ mode: OAuthMode }> {
  const key = getStateKey(provider, state);

  const storedState = await redisClient.get(key);

  if (!storedState) {
    throw new AppError("Invalid or Expired OAuth State.", 400);
  }

  await redisClient.del(key);

  let parsedState: unknown;

  try {
    parsedState = JSON.parse(storedState);
  } catch {
    throw new AppError("Invalid OAuth State.", 400);
  }

  if (
    typeof parsedState !== "object" ||
    parsedState === null ||
    !("mode" in parsedState) ||
    (parsedState.mode !== "login" && parsedState.mode !== "signup")
  ) {
    throw new AppError("Invalid OAuth State.", 400);
  }

  return {
    mode: parsedState.mode,
  };
}