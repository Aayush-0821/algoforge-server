import { PrismaClient } from "../../../generated/postgres";
import { prisma } from "../../lib/postgres";

import { UpdateProfileInput, UpdateProfilePreferencesInput } from "./profile.types";

export class ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        isEmailVerified: true,
        onboardingCompleted: true,
        createdAt: true,

        profile: {
          select: {
            displayName: true,
            username: true,
            avatarUrl: true,
            experienceLevel: true,
            leetcodeUsername: true,
            githubUsername: true,
          },
        },

        preferences: {
          select: {
            targetCompany: true,
            targetRole: true,
            preferredLanguageId: true,
            dailyGoalMinutes: true,
            weeklyGoalProblems: true,

            preferredLanguage: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    if (!user.profile || !user.preferences) {
      return null;
    }

    return user;
  }

  async findUsername(username: string) {
    return this.prisma.userProfile.findUnique({
      where: {
        username,
      },
      select: {
        userId: true,
      },
    });
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: input,
    });
  }

  async updateProfilePreferences(userId: string, input: UpdateProfilePreferencesInput) {
    return this.prisma.userPreference.update({
      where: { userId },
      data: input,
    });
  }

  async findProgrammingLanguage(languageId: string) {
    return this.prisma.programmingLanguage.findUnique({
      where: {
        id: languageId,
      },
    });
  }
}

export const profileRepository = new ProfileRepository(prisma);
