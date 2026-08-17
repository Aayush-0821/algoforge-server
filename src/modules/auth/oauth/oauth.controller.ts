import type { Request, Response, NextFunction } from "express";

import { AppError } from "../../../errors/app.errors";
import { setAuthCookies } from "../utils/cookie.utils";

import { getGitHubAuthUrl, exchangeGitHubCode } from "./github.oauth";
import { getGoogleAuthUrl, exchangeGoogleCode } from "./google.oauth";
import { oauthService } from "./oauth.service";
import { createOAuthState, validateOAuthState } from "./oauth.state";

import type { OAuthMode } from "./oauth.service";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

export class OAuthController {
  async googleRedirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mode = this.getOAuthMode(req);

      const state = await createOAuthState("GOOGLE", mode);

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

      const { mode } = await validateOAuthState("GOOGLE", state);

      const profile = await exchangeGoogleCode(code);

      const result = await oauthService.loginWithGoogle(profile, mode);

      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      res.redirect(
        `${CLIENT_URL}/auth/callback?onboardingCompleted=${result.user.onboardingCompleted}`,
      );
    } catch (error) {
      next(error);
    }
  }

  async githubRedirect(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const mode = this.getOAuthMode(req);

      const state = await createOAuthState("GITHUB", mode);

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

      const { mode } = await validateOAuthState("GITHUB", state);

      const profile = await exchangeGitHubCode(code);

      const result = await oauthService.loginWithGitHub(profile, mode);

      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);

      res.redirect(
        `${CLIENT_URL}/auth/callback?onboardingCompleted=${result.user.onboardingCompleted}`,
      );
    } catch (error) {
      next(error);
    }
  }

  private getOAuthMode(req: Request): OAuthMode {
    const { mode } = req.query;

    if (mode !== "login" && mode !== "signup") {
      throw new AppError("Invalid OAuth mode.", 400);
    }

    return mode;
  }
}

export const oauthController = new OAuthController();