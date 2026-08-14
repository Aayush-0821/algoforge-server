import { ExperienceLevel } from "../../../generated/postgres";

export interface CompleteOnBoardingInput{
    displayName: string;
    username: string;
    preferredLanguageId: string;
    experienceLevel: ExperienceLevel;
    avatarUrl?: string;
}

export interface OnBoardingResult{
    onboardingCompleted: boolean;
}