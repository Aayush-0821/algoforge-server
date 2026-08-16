export interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  revisionNotification: boolean;
  roadmapNotification: boolean;
  dailyGoalNotification: boolean;
  weeklyReportNotification: boolean;
  recommendationNotification: boolean;
  paymentNotification: boolean;
  marketingNotification: boolean;
  quietHoursStart: number | null;
  quietHoursEnd: number | null;
}

export interface AccountSettings {
  email: string;
  isEmailVerified: boolean;
}

export interface SettingsResponse {
  account: AccountSettings;
  notifications: NotificationPreferences;
}

export interface UpdateNotificationPreferencesInput {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  revisionNotification?: boolean;
  roadmapNotification?: boolean;
  dailyGoalNotification?: boolean;
  weeklyReportNotification?: boolean;
  recommendationNotification?: boolean;
  paymentNotification?: boolean;
  marketingNotification?: boolean;
  quietHoursStart?: number | null;
  quietHoursEnd?: number | null;
}

export interface DeleteAccountInput {
  confirmation: "DELETE";
}
