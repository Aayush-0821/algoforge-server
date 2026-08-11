import { env } from "../../../config/env";
import { AppError } from "../../../errors/app.errors";

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export interface GitHubProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  emailVerified: boolean;
}

export function getGitHubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID!,
    redirect_uri: env.GITHUB_CALLBACK_URL!,
    scope: "read:user user:email",
    state,
  });

  return `${GITHUB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGitHubCode(code: string): Promise<GitHubProfile> {
  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID!,
      client_secret: env.GITHUB_CLIENT_SECRET!,
      code,
      redirect_uri: env.GITHUB_CALLBACK_URL!,
    }),
  });

  if (!tokenResponse.ok) {
    throw new AppError("Failed to exchange GitHub authorization code.", 500);
  }

  const tokens = (await tokenResponse.json()) as GitHubTokenResponse;

  const headers = {
    Authorization: `Bearer ${tokens.access_token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "AlgoForge",
  };

  const userResponse = await fetch(GITHUB_USER_URL, {
    headers,
  });

  if (!userResponse.ok) {
    throw new AppError("Failed to fetch GitHub user profile.", 500);
  }

  const user = (await userResponse.json()) as GitHubUser;

  const emailResponse = await fetch(GITHUB_EMAILS_URL, {
    headers,
  });

  if (!emailResponse.ok) {
    throw new AppError("Failed to fetch GitHub email.", 500);
  }

  const emails = (await emailResponse.json()) as GitHubEmail[];

  const primaryEmail = emails.find((email) => email.primary && email.verified);

  if (!primaryEmail) {
    throw new AppError("No verified primary GitHub email was found.", 500);
  }

  return {
    id: String(user.id),
    email: primaryEmail.email,
    name: user.name ?? user.login,
    avatarUrl: user.avatar_url,
    emailVerified: primaryEmail.verified,
  };
}
