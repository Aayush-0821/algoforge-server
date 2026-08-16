import { PrismaClient } from "../../../generated/postgres";
import { prisma } from "../../lib/postgres";

import { UpdateNotificationPreferencesInput } from "./settings.validation";

export class SettingsRepository {
    constructor(private readonly prisma: PrismaClient){}

    async getSettings(userId: string){
        return this.prisma.user.findUnique({
            where:{
                id: userId
            },
            select:{
                email: true,
                isEmailVerified: true,
                notificationPreference:{
                    select:{
                        emailEnabled: true,
                        inAppEnabled: true,
                        revisionNotification: true,
                        roadmapNotification: true,
                        dailyGoalNotification: true,
                        weeklyReportNotification: true,
                        recommendationNotification: true,
                        paymentNotification: true,
                        marketingNotification: true,
                        quietHoursStart: true,
                        quietHoursEnd: true
                    },
                },
            },
        });
    }

    async updateNotificationPreferences(
        userId: string,
        input: UpdateNotificationPreferencesInput
    ){
        return this.prisma.notificationPreference.upsert({
            where:{
                userId
            },
            update: input,
            create:{
                userId,
                ...input
            }
        });
    }

    async deleteAccount(userId: string){
        return this.prisma.user.delete({
            where:{
                id: userId
            }
        });
    }
}

export const settingsRepository = new SettingsRepository(prisma);