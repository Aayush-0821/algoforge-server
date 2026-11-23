import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../../errors/app.errors";
import { setAuthCookies } from "../utils/cookie.utils";

import { env } from "../../../config/env";

import {
  getGitHubAuthUrl,
  exchangeGitHubCode,
} from "./github.oauth";

import {
  getGoogleAuthUrl,
  exchangeGoogleCode,
} from "./google.oauth";

import {
  oauthService,
} from "./oauth.service";

import type {
  OAuthMode as ServiceOAuthMode,
} from "./oauth.service";

import {
  createOAuthState,
  validateOAuthState,
} from "./oauth.state";

import {
  saveGitHubConnection,
} from "../../github/github.service";

// Use the same frontend URL your application already uses.
const CLIENT_URL = env.FRONTEND_URL;

export class OAuthController {
  async googleRedirect(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const mode = this.getOAuthMode(req);

      const state = await createOAuthState(
        "GOOGLE",
        mode,
      );

      const authUrl =
        getGoogleAuthUrl(state);

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { code, state } = req.query;

      if (typeof code !== "string") {
        throw new AppError(
          "Google authorization code is missing.",
          400,
        );
      }

      if (typeof state !== "string") {
        throw new AppError(
          "Google OAuth state is missing.",
          400,
        );
      }

      const { mode } =
        await validateOAuthState(
          "GOOGLE",
          state,
        );

      // Google only supports the existing
      // login/signup OAuth flow.
      if (
        mode !== "login" &&
        mode !== "signup"
      ) {
        throw new AppError(
          "Invalid Google OAuth mode.",
          400,
        );
      }

      const profile =
        await exchangeGoogleCode(code);

      const result =
        await oauthService.loginWithGoogle(
          profile,
          mode as ServiceOAuthMode,
        );

      setAuthCookies(
        res,
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );

      res.redirect(
        `${CLIENT_URL}/auth/callback?onboardingCompleted=${result.user.onboardingCompleted}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Google authentication failed.";

      res.redirect(
        `${CLIENT_URL}/login?error=${encodeURIComponent(
          message,
        )}`,
      );
    }
  }

  async githubRedirect(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const mode =
        this.getOAuthMode(req);

      const state =
        await createOAuthState(
          "GITHUB",
          mode,
        );

      const authUrl =
        getGitHubAuthUrl(state);

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async githubConnectRedirect(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(
          "You must be logged in to connect GitHub.",
          401,
        );
      }

      const state =
        await createOAuthState(
          "GITHUB",
          "connect",
          userId,
        );

      const authUrl =
        getGitHubAuthUrl(state);

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async githubCallback(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { code, state } = req.query;

      if (typeof code !== "string") {
        throw new AppError(
          "GitHub authorization code is missing.",
          400,
        );
      }

      if (typeof state !== "string") {
        throw new AppError(
          "GitHub OAuth state is missing.",
          400,
        );
      }

      const {
        mode,
        userId,
      } = await validateOAuthState(
        "GITHUB",
        state,
      );

      const {
        profile,
        token,
      } = await exchangeGitHubCode(code);

      // -----------------------------------------
      // CONNECT GITHUB TO EXISTING ALGOFORGE USER
      // -----------------------------------------
      if (mode === "connect") {
        if (!userId) {
          throw new AppError(
            "Invalid GitHub connection state.",
            400,
          );
        }

        await saveGitHubConnection(
          userId,
          profile,
          token,
        );

        res.redirect(
          `${CLIENT_URL}/github/connected`,
        );

        return;
      }

      // -----------------------------------------
      // EXISTING LOGIN / SIGNUP FLOW
      // -----------------------------------------

      const result =
        await oauthService.loginWithGitHub(
          profile,
          mode,
        );

      setAuthCookies(
        res,
        result.tokens.accessToken,
        result.tokens.refreshToken,
      );

      res.redirect(
        `${CLIENT_URL}/auth/callback?onboardingCompleted=${result.user.onboardingCompleted}`,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "GitHub authentication failed.";

      res.redirect(
        `${CLIENT_URL}/login?error=${encodeURIComponent(
          message,
        )}`,
      );
    }
  }

  private getOAuthMode(
    req: Request,
  ): ServiceOAuthMode {
    const { mode } = req.query;

    if (
      mode !== "login" &&
      mode !== "signup"
    ) {
      throw new AppError(
        "Invalid OAuth mode.",
        400,
      );
    }

    return mode;
  }
}

export const oauthController =
  new OAuthController();