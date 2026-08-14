import { PrismaClient } from "../../../generated/postgres";
import { prisma } from "../../lib/postgres";

import { CompleteOnBoardingInput } from "./onboarding.types";

export class OnboardingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getProgrammingLanguages() {
    return this.prisma.programmingLanguage.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  async findUsername(username: string) {
    return this.prisma.userProfile.findUnique({
      where: { username },
      select: { userId: true },
    });
  }

  async findProgrammingLanguage(languageId: string) {
    return this.prisma.programmingLanguage.findUnique({
      where: {
        id: languageId,
      },
      select: {
        id: true,
      },
    });
  }

  async completeOnboarding(userId: string, input: CompleteOnBoardingInput) {
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.userProfile.upsert({
        where: { userId },
        create: {
          userId,
          displayName: input.displayName,
          username: input.username,
          experienceLevel: input.experienceLevel,
          avatarUrl: input.avatarUrl,
        },
        update: {
          displayName: input.displayName,
          username: input.username,
          experienceLevel: input.experienceLevel,
          avatarUrl: input.avatarUrl,
        },
      });
      const preferences = await tx.userPreference.upsert({
        where: { userId },
        create: {
          userId,
          targetCompany: [],
          preferredLanguageId: input.preferredLanguageId,
        },
        update: {
          preferredLanguageId: input.preferredLanguageId,
        },
      });

      const user = await tx.user.update({
        where: {
          id: userId,
        },
        data: {
          onboardingCompleted: true,
        },
        select: {
          onboardingCompleted: true,
        },
      });

      return {
        profile,
        preferences,
        user,
      };
    });
  }
}

export const onboardingRepository = new OnboardingRepository(prisma);
