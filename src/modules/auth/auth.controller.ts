import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service";
import { clearAuthCookies, setAuthCookies } from "./utils/cookie.utils";
import { COOKIE_NAMES } from "./auth.constants";
import { AppError } from "../../errors/app.errors";
import { logger } from "../../config/logger";

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.register(req.body);

      res.status(201).json({
        message: "Registration SuccessFul.",
      });
    } catch (error) {
      next(error);
    }
  }
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      setAuthCookies(
        res,
        result.tokens.accessToken,
        result.tokens.refreshToken
      );

      res.status(200).json({
        message: "LoggedIn SuccessFully.",
        user: result.user,
      });
    } catch (error) {
      next(error);
    }
  }
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

      if(!refreshToken){
        throw new AppError("Refresh Token is Missing.",401);
      }

      const result = await authService.refresh(refreshToken);

      setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken
      );

      res.status(200).json({
        message: "Tokens Refreshed SuccessFully.",
      });
    } catch (error) {
      next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

      if(refreshToken){
        try {
          await authService.logout(refreshToken);
        } catch (error) {
          logger.warn({error},"Failed to revoke Refresh Token during logout.");
        }
      }

      clearAuthCookies(res);

      res.status(200).json({
        message: "Logged Out SuccessFully!",
      });
    } catch (error) {
      next(error);
    }
  }
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.verifyEmail(req.body);

      res.status(200).json({
        message: "Email Verified SuccessFully!",
      });
    } catch (error) {
      next(error);
    }
  }
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body);

      res.status(200).json({
        message: "Frogot Password request SuccessFul.",
      });
    } catch (error) {
      next(error);
    }
  }
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body);

      res.status(200).json({
        message: "Password Reset SuccessFul.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
