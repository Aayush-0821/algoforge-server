import { nanoid } from "nanoid";

import { AppError } from "../../../errors/app.errors";
import { REFRESH_TOKEN_MAX_AGE } from "../auth.constants";
import { authRepository } from "../auth.repository";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt";
import { hashToken } from "../utils/token.utils";

import type { GitHubProfile } from "./github.oauth";
import type { GoogleProfile } from "./google.oauth";

export type OAuthProvider = "GOOGLE" | "GITHUB";

export class OAuthService {
  async loginWithGoogle(profile: GoogleProfile) {
    return this.loginWithProvider({
      provider: "GOOGLE",
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
      emailVerified: profile.email_verified,
    });
  }

  async loginWithGitHub(profile: GitHubProfile) {
    return this.loginWithProvider({
      provider: "GITHUB",
      providerAccountId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
      emailVerified: profile.emailVerified,
    });
  }

  private async loginWithProvider(data: {
    provider: OAuthProvider;
    providerAccountId: string;
    email: string;
    name?: string;
    avatarUrl?: string;
    emailVerified: boolean;
  }) {
    if (!data.emailVerified) {
      throw new AppError(
        "OAuth email is not verified.",
        401,
      );
    }
    const oauthAccount =
      await authRepository.findOAuthAccount(
        data.provider,
        data.providerAccountId,
      );

    let user;

    if (oauthAccount) {
      user = oauthAccount.user;
    } else {
      user = await authRepository.findUserByEmail(
        data.email,
      );

      if (!user) {
        user = await authRepository.createUser({
          email: data.email,
          password: null,
          isEmailVerified: true,
        });
      } else if (!user.isEmailVerified) {
        user = await authRepository.updateUser(
          user.id,
          {
            isEmailVerified: true,
          },
        );
      }

      await authRepository.createOAuthAccount({
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        user: {
          connect: {
            id: user.id,
          },
        },
      });
    }

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
      expiresAt: new Date(
        Date.now() + REFRESH_TOKEN_MAX_AGE,
      ),
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
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }
}

export const oauthService = new OAuthService();