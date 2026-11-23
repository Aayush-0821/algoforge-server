import { nanoid } from "nanoid";

import { AppError } from "../../../errors/app.errors";
import { REFRESH_TOKEN_MAX_AGE } from "../auth.constants";
import { authRepository } from "../auth.repository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt";
import { hashToken } from "../utils/token.utils";

import type { GitHubProfile } from "./github.oauth";
import type { GoogleProfile } from "./google.oauth";

export type OAuthProvider = "GOOGLE" | "GITHUB";
export type OAuthMode = "login" | "signup";

export class OAuthService {
  async loginWithGoogle(profile: GoogleProfile, mode: OAuthMode) {
    return this.loginWithProvider(
      {
        provider: "GOOGLE",
        providerAccountId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.picture,
        emailVerified: profile.email_verified,
      },
      mode,
    );
  }

  async loginWithGitHub(profile: GitHubProfile, mode: OAuthMode) {
    return this.loginWithProvider(
      {
        provider: "GITHUB",
        providerAccountId: profile.id,
        email: profile.email,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
        emailVerified: profile.emailVerified,
      },
      mode,
    );
  }

  private async loginWithProvider(
    data: {
      provider: OAuthProvider;
      providerAccountId: string;
      email: string;
      name?: string;
      avatarUrl?: string;
      emailVerified: boolean;
    },
    mode: OAuthMode,
  ) {
    if (!data.emailVerified) {
      throw new AppError("OAuth email is not verified.", 401);
    }

    const oauthAccount = await authRepository.findOAuthAccount(
      data.provider,
      data.providerAccountId,
    );

    if (mode === "login") {
      if (oauthAccount) {
        return this.issueTokens(oauthAccount.user);
      }

      const existingUser = await authRepository.findUserByEmail(data.email);

      if (existingUser) {
        throw new AppError(
          "Account exists. Please login using your email/password or connect this provider from settings.",
          409,
        );
      }

      throw new AppError("No account found. Please sign up first.", 404);
    }

    if (oauthAccount) {
      throw new AppError("An account already exists. Please log in instead.", 409);
    }

    const existingUser = await authRepository.findUserByEmail(data.email);

    if (existingUser) {
      throw new AppError("An account with this email already exists. Please log in instead.", 409);
    }

    const user = await authRepository.createUser({
      email: data.email,
      password: null,
      isEmailVerified: true,
    });

    await authRepository.createOAuthAccount({
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return this.issueTokens(user);
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    isEmailVerified: boolean;
    onboardingCompleted: boolean;
  }) {
    const tokenId = nanoid();

    const accessToken = await generateAccessToken({
      type: "access",
      userId: user.id,
      email: user.email,
    });

    const refreshToken = await generateRefreshToken({
      type: "refresh",
      userId: user.id,
      tokenId,
    });

    const tokenHash = hashToken(refreshToken);

    await authRepository.createRefreshToken({
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
      user: {
        connect: {
          id: user.id,
        },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        onboardingCompleted: user.onboardingCompleted,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}

export const oauthService = new OAuthService();
