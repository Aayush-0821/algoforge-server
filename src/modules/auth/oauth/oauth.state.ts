import { randomBytes } from "crypto";

import { redisClient } from "../../../database/redis";
import { AppError } from "../../../errors/app.errors";

const OAUTH_STATE_TTL = 10 * 60;

export type OAuthProvider = "GOOGLE" | "GITHUB";
export type OAuthMode = "login" | "signup" | "connect";

interface OAuthStateData {
  mode: OAuthMode;
  userId?: string;
}

function getStateKey(provider: OAuthProvider, state: string): string {
  return `oauth:state:${provider}:${state}`;
}

export async function createOAuthState(
  provider: OAuthProvider,
  mode: OAuthMode,
  userId?: string,
): Promise<string> {
  if (mode === "connect" && !userId) {
    throw new AppError("Authenticated user is required to connect GitHub.", 401);
  }

  const state = randomBytes(32).toString("hex");

  const stateData: OAuthStateData = {
    mode,
    ...(userId ? { userId } : {}),
  };

  const key = getStateKey(provider, state);

  await redisClient.setEx(key, OAUTH_STATE_TTL, JSON.stringify(stateData));

  return state;
}

export async function validateOAuthState(
  provider: OAuthProvider,
  state: string,
): Promise<OAuthStateData> {
  const key = getStateKey(provider, state);

  const storedState = await redisClient.get(key);

  if (!storedState) {
    throw new AppError("Invalid or Expired OAuth State.", 400);
  }

  // OAuth states are single-use.
  await redisClient.del(key);

  let parsedState: unknown;

  try {
    parsedState = JSON.parse(storedState);
  } catch {
    throw new AppError("Invalid OAuth State.", 400);
  }

  if (typeof parsedState !== "object" || parsedState === null || !("mode" in parsedState)) {
    throw new AppError("Invalid OAuth State.", 400);
  }

  const stateData = parsedState as OAuthStateData;

  if (stateData.mode !== "login" && stateData.mode !== "signup" && stateData.mode !== "connect") {
    throw new AppError("Invalid OAuth State.", 400);
  }

  if (stateData.mode === "connect" && !stateData.userId) {
    throw new AppError("Invalid GitHub connection state.", 400);
  }

  return stateData;
}
