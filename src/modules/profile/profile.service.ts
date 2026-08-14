import { AppError } from "../../errors/app.errors";

import { profileRepository, ProfileRepository } from "./profile.repository";
import {
  UpdateProfileInput,
  UpdateProfilePreferencesInput,
  ProfileResponse,
  ProfilePreferencesResponse,
} from "./profile.types";

export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.profileRepository.getProfile(userId);

    if (!user) {
      throw new AppError("User not Found", 404);
    }

    if (!user.profile || !user.preferences) {
      throw new AppError("User Profile is InComplete", 400);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        onboardingCompleted: user.onboardingCompleted,
        createdAt: user.createdAt,
      },
      profile: {
        displayName: user.profile.displayName,
        username: user.profile.username,
        avatarUrl: user.profile.avatarUrl,
        experienceLevel: user.profile.experienceLevel,
        leetcodeUsername: user.profile.leetcodeUsername,
        githubUsername: user.profile.githubUsername,
      },
      preferences: {
        targetCompany: user.preferences.targetCompany,
        targetRole: user.preferences.targetRole,
        dailyGoalMinutes: user.preferences.dailyGoalMinutes,
        weeklyGoalProblems: user.preferences.weeklyGoalProblems,
        preferredLanguageId: user.preferences.preferredLanguageId,
        preferredLanguage: user.preferences.preferredLanguage
          ? {
              id: user.preferences.preferredLanguage.id,
              name: user.preferences.preferredLanguage.name,
            }
          : null,
      },
    };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    if (input.username) {
      const existingUsername = await this.profileRepository.findUsername(input.username);

      if (existingUsername && existingUsername.userId !== userId) {
        throw new AppError("Username already taken", 409);
      }
    }
    await this.profileRepository.updateProfile(userId, input);

    return this.getProfile(userId);
  }

  async updateProfilePreferences(
    userId: string,
    input: UpdateProfilePreferencesInput,
  ): Promise<ProfilePreferencesResponse> {
    const profile = await this.profileRepository.getProfile(userId);

    if (!profile) {
      throw new AppError("User not Found", 404);
    }

    if (input.preferredLanguageId) {
      const programmingLanguage = await this.profileRepository.findProgrammingLanguage(
        input.preferredLanguageId,
      );

      if (!programmingLanguage) {
        throw new AppError("Programming Language not Found", 400);
      }
    }

    await this.profileRepository.updateProfilePreferences(userId, input);

    return (await this.getProfile(userId)).preferences;
  }
}

export const profileService = new ProfileService(profileRepository);
