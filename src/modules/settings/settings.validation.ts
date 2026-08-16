import { z } from "zod";

export const updateNotificationPreferencesSchema = z
.object({
    emailEnabled: z.boolean().optional(),
    inAppEnabled: z.boolean().optional(),
    revisionNotification: z.boolean().optional(),
    roadmapNotification: z.boolean().optional(),
    dailyGoalNotification: z.boolean().optional(),
    weeklyReportNotification: z.boolean().optional(),
    recommendationNotification: z.boolean().optional(),
    paymentNotification: z.boolean().optional(),
    marketingNotification: z.boolean().optional(),
    quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
    quietHoursEnd: z.number().int().min(0).max(23).nullable().optional()
})
.refine(
    (data)=>{
        if(
            data.quietHoursStart === undefined ||
            data.quietHoursEnd === undefined
        ){
            return true;
        }
        if(data.quietHoursStart === null || data.quietHoursEnd === null){
            return true;
        }
        return data.quietHoursStart !== data.quietHoursEnd;
    },
    {
        message: "Quiet hours start and end cannot be the same.",
        path: ["quietHoursEnd"]
    },
);

export const deleteAccountSchema = z.object({
    confirmation: z.literal("DELETE")
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;