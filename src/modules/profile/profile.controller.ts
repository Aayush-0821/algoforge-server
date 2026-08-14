import { Request, Response, NextFunction } from "express";

import { profileService, ProfileService } from "./profile.service";

export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const userProfile = await this.profileService.getProfile(userId);

      res.status(200).json({
        message: "Profile Fetched SuccessFully",
        userProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const data = req.body;

      const updatedProfile = await this.profileService.updateProfile(userId, data);

      res.status(200).json({
        message: "User Profile updated Successfully",
        updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfilePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user.id;

      const data = req.body;

      const updatedProfilePreferences = await this.profileService.updateProfilePreferences(
        userId,
        data,
      );

      res.status(200).json({
        message: "User Profile Preferences Updated SuccessFully",
        updatedProfilePreferences,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController(profileService);
