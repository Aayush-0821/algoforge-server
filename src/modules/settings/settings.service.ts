import { AppError } from "../../errors/app.errors";

import { settingsRepository } from "./settings.repository";
import { NotificationPreferences, SettingsResponse } from "./settings.types";
import { DeleteAccountInput, UpdateNotificationPreferencesInput } from "./settings.validation";

export class SettingsService {
    async getSettings(userId: string): Promise<SettingsResponse>{
        const settings = await settingsRepository.getSettings(userId);

        if(!settings){
            throw new AppError("User not Found.",404);
        }

        if(!settings.notificationPreference){
            throw new AppError("Notification Preferences not Found.",404);
        }

        return {
            account:{
                email: settings.email,
                isEmailVerified: settings.isEmailVerified
            },
            notifications:{
                emailEnabled: settings.notificationPreference.emailEnabled,
                inAppEnabled: settings.notificationPreference.inAppEnabled,
                revisionNotification: settings.notificationPreference.revisionNotification,
                roadmapNotification: settings.notificationPreference.roadmapNotification,
                dailyGoalNotification: settings.notificationPreference.dailyGoalNotification,
                weeklyReportNotification: settings.notificationPreference.weeklyReportNotification,
                recommendationNotification: settings.notificationPreference.recommendationNotification,
                paymentNotification: settings.notificationPreference.paymentNotification,
                marketingNotification: settings.notificationPreference.marketingNotification,
                quietHoursStart: settings.notificationPreference.quietHoursStart,
                quietHoursEnd: settings.notificationPreference.quietHoursEnd
            }
        };
    }

    async updateNotificationPreferences(
        userId: string,
        input: UpdateNotificationPreferencesInput
    ): Promise<NotificationPreferences> {
        const preferences = await settingsRepository.updateNotificationPreferences(userId,input);

        return {
            emailEnabled: preferences.emailEnabled,
            inAppEnabled: preferences.inAppEnabled,
            revisionNotification: preferences.revisionNotification,
            roadmapNotification: preferences.roadmapNotification,
            dailyGoalNotification: preferences.dailyGoalNotification,
            weeklyReportNotification: preferences.weeklyReportNotification,
            recommendationNotification: preferences.recommendationNotification,
            paymentNotification: preferences.paymentNotification,
            marketingNotification: preferences.marketingNotification,
            quietHoursStart: preferences.quietHoursStart,
            quietHoursEnd: preferences.quietHoursEnd
        }
    }

    async deleteAccount(
        userId: string,
        input: DeleteAccountInput
    ): Promise<void> {
        if(input.confirmation !== "DELETE"){
            throw new AppError("Invalid Account Deletion Confirmation",400);
        }

        await settingsRepository.deleteAccount(userId);
    }
}

export const settingsService = new SettingsService();