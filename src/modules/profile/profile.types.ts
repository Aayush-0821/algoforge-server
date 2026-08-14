import { ExperienceLevel } from "../../../generated/postgres";

export interface UpdateProfileInput{
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    experienceLevel?: ExperienceLevel;
    leetcodeUsername?: string;
    githubUsername?: string;
}

export interface ProfileResponse{
    user:{
        id: string;
        email: string;
        isEmailVerified: boolean;
        onboardingCompleted: boolean;
        createdAt: Date;
    };
    profile:{
        displayName: string;
        username: string;
        avatarUrl: string | null;
        experienceLevel: ExperienceLevel;
        leetcodeUsername: string | null;
        githubUsername: string | null;
    };
    preferences:{
        targetCompany: string[];
        targetRole: string | null;
        preferredLanguageId: string | null;
        preferredLanguage:{
            id: string;
            name: string;
        } | null;
        dailyGoalMinutes: number | null;
        weeklyGoalProblems: number | null;
    }
}

export interface UpdateProfilePreferencesInput{
    targetCompany?: string[];
    targetRole?: string;
    preferredLanguageId?: string;
    dailyGoalMinutes?: number;
    weeklyGoalProblems?: number;
}

export interface ProfilePreferencesResponse{
    targetCompany: string[];
    targetRole: string | null;
    preferredLanguageId: string | null;
    preferredLanguage:{
        id: string;
        name: string;
    } | null;
    dailyGoalMinutes: number | null;
    weeklyGoalProblems: number | null;
}