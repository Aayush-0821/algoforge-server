import {
  BillingCycle,
  DiscountType,
  PaymentMethod,
  PaymentStatus,
  SubscriptionStatus,
  SubscriptionTier,
} from "../../../generated/postgres";

export interface SubscriptionDetails {
  id: string;
  planId: string | null;
  tier: SubscriptionTier;
  billingCycle: BillingCycle | null;
  status: SubscriptionStatus;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelledAt: Date | null;
}

export type FeaturePeriod = "DAILY" | "MONTHLY" | "UNLIMITED";

export interface PlanFeatureConfig {
  enabled: boolean;
  limit: number | null;
  period: FeaturePeriod;
}

export type PlanFeatures = Record<string, PlanFeatureConfig>;

export interface PlanDetails {
  id: string;
  name: string;
  description: string | null;
  tier: SubscriptionTier;
  billingCycle: BillingCycle | null;
  price: string;
  currency: string;
  durationMonths: number;
  features: PlanFeatures;
}

export interface CreateSubscriptionInput {
  planId: string;
  promoCode?: string;
}

export interface ApplyPromoCodeInput {
  code: string;
  planId: string;
}

export interface PromoCodeDetails {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  discountValue: string;
  maxDiscount: string | null;
  minimumPurchase: string | null;
  validFrom: Date;
  validUntil: Date;
}

export interface PaymentDetails {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  originalAmount: string;
  discountAmount: string;
  finalAmount: string;
  taxAmount: string;
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paidAt: Date | null;
}

export interface VerifyPaymentInput {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface FeatureAccess {
  featureKey: string;
  allowed: boolean;
  usageCount: number;
  limit: number | null;
  resetAt: Date | null;
}

export interface SubscriptionResponse {
  subscription: SubscriptionDetails;
  plan: PlanDetails | null;
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: Record<string, unknown>;
}
