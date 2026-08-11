import type { Request, Response, NextFunction } from "express";

import { authService } from "./auth.service";

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

      res.status(200).json({
        message: "LoggedIn SuccessFully.",
        user: result.user,
        tokens: result.tokens,
      });
    } catch (error) {
      next(error);
    }
  }
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.refresh(req.body);

      res.status(200).json({
        message: "Tokens Refreshed!",
        tokens: result,
      });
    } catch (error) {
      next(error);
    }
  }
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logout(req.body);

      res.status(200).json({
        message: "Logged Out SuccessFully!",
      });
    } catch (error) {
      next(error);
    }
  }
  async verifyEmail(req:Request, res:Response, next: NextFunction): Promise<void>{
    try {
        await authService.verifyEmail(req.body);

        res.status(200).json({
            message: "Email Verified SuccessFully!"
        });
    } catch (error) {
        next(error);
    }
  }
  async forgotPassword(req:Request, res:Response, next: NextFunction):Promise<void>{
    try {
        await authService.forgotPassword(req.body);

        res.status(200).json({
            message: "Frogot Password request SuccessFul."
        });
    } catch (error) {
        next(error);
    }
  }
  async resetPassword(req:Request, res: Response, next: NextFunction):Promise<void>{
    try {
        await authService.resetPassword(req.body);

        res.status(200).json({
            message: "Password Reset SuccessFul."
        });
    } catch (error) {
        next(error);
    }
  }
}

export const authController = new AuthController();