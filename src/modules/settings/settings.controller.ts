import { Request, Response, NextFunction } from "express";

import { settingsService } from "./settings.service";
import { deleteAccountSchema } from "./settings.validation";

export class SettingsController {
  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const settings = await settingsService.getSettings(userId);

      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateNotificationPreferences(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user.id;

      const preferences = await settingsService.updateNotificationPreferences(userId, req.body);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const input = deleteAccountSchema.parse(req.body);

      await settingsService.deleteAccount(userId, input);

      res.status(200).json({
        success: true,
        message: "Account Deleted SuccessFully.",
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
