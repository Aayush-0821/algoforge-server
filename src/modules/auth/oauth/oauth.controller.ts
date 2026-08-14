import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../../errors/app.errors";

import { getGitHubAuthUrl, exchangeGitHubCode } from "./github.oauth";
import { getGoogleAuthUrl, exchangeGoogleCode } from "./google.oauth";
import { oauthService } from "./oauth.service";
import { createOAuthState, validateOAuthState } from "./oauth.state";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

export class OAuthController {
  async googleRedirect(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = await createOAuthState("GOOGLE");

      const authUrl = getGoogleAuthUrl(state);

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state } = req.query;

      if (typeof code !== "string") {
        throw new AppError("Google authorization code is missing.", 400);
      }

      if (typeof state !== "string") {
        throw new AppError("Google OAuth state is missing.", 400);
      }

      await validateOAuthState("GOOGLE", state);

      const profile = await exchangeGoogleCode(code);

      const result = await oauthService.loginWithGoogle(profile);

      const params = new URLSearchParams({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        onboardingCompleted: String(result.user.onboardingCompleted),
      });

      res.redirect(`${CLIENT_URL}/auth/callback?${params.toString()}`);
    } catch (error) {
      next(error);
    }
  }

  async githubRedirect(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const state = await createOAuthState("GITHUB");

      const authUrl = getGitHubAuthUrl(state);

      res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  async githubCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, state } = req.query;

      if (typeof code !== "string") {
        throw new AppError("GitHub authorization code is missing.", 400);
      }

      if (typeof state !== "string") {
        throw new AppError("GitHub OAuth state is missing.", 400);
      }

      await validateOAuthState("GITHUB", state);

      const profile = await exchangeGitHubCode(code);

      const result = await oauthService.loginWithGitHub(profile);

      const params = new URLSearchParams({
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        onboardingCompleted: String(result.user.onboardingCompleted),
      });

      res.redirect(`${CLIENT_URL}/auth/callback?${params.toString()}`);
    } catch (error) {
      next(error);
    }
  }
}

export const oauthController = new OAuthController();
