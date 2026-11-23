import { Prisma } from "../../../generated/postgres";
import { AppError } from "../../errors/app.errors";
import { GST_RATE } from "./subscriptions.constants";
import { SubscriptionRepository } from "./subscriptions.repository";
import { FeatureAccess, PlanFeatures, FeaturePeriod } from "./subscriptions.types";
import { CreateSubscriptionInput } from "./subscriptions.validation";

export class SubscriptionService {
  constructor(private readonly subscriptionRepository: SubscriptionRepository) {}

  async getSubscription(userId: string) {
    return this.subscriptionRepository.getUserSubscription(userId);
  }

  async getAvailablePlans() {
    return this.subscriptionRepository.getActivePlans();
  }

  async getPlan(planId: string) {
    const plan = await this.subscriptionRepository.getPlanById(planId);

    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    if (!plan.isActive) {
      throw new AppError("Plan is not active", 400);
    }

    return plan;
  }

  async validatePromoCode(userId: string, code: string, planId: string) {
    const promoCode = await this.subscriptionRepository.getPromoCode(code);

    if (!promoCode) {
      throw new AppError("Invalid promo code", 400);
    }

    if (!promoCode.isActive) {
      throw new AppError("Promo code is not active", 400);
    }

    const now = new Date();

    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      throw new AppError("Promo code has expired or is not yet valid", 400);
    }

    if (promoCode.usageLimit !== null && promoCode.usageCount >= promoCode.usageLimit) {
      throw new AppError("Promo code usage limit has been reached", 400);
    }

    const userRedemption = await this.subscriptionRepository.getUserPromoRedemption(
      promoCode.id,
      userId,
    );

    if (userRedemption) {
      throw new AppError("You have already used this promo code", 400);
    }

    const plan = await this.subscriptionRepository.getPlanById(planId);

    if (!plan) {
      throw new AppError("Plan not found", 404);
    }

    if (!plan.isActive) {
      throw new AppError("Plan is not active", 400);
    }

    if (promoCode.minimumPurchase !== null && plan.price.lessThan(promoCode.minimumPurchase)) {
      throw new AppError("Plan price does not meet the minimum purchase requirement", 400);
    }

    const discountAmount = this.calculateDiscount(plan.price, promoCode);

    const finalAmount = plan.price.minus(discountAmount);

    return {
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        description: promoCode.description,
        discountType: promoCode.discountType,
        discountValue: promoCode.discountValue.toString(),
        maxDiscount: promoCode.maxDiscount?.toString() ?? null,
        minimumPurchase: promoCode.minimumPurchase?.toString() ?? null,
        validFrom: promoCode.validFrom,
        validUntil: promoCode.validUntil,
      },
      originalAmount: plan.price.toString(),
      discountAmount: discountAmount.toString(),
      finalAmount: finalAmount.toString(),
    };
  }

  private calculateDiscount(
    amount: Prisma.Decimal,
    promoCode: {
      discountType: "PERCENTAGE" | "FIXED";
      discountValue: Prisma.Decimal;
      maxDiscount: Prisma.Decimal | null;
    },
  ): Prisma.Decimal {
    let discount: Prisma.Decimal;

    if (promoCode.discountType === "PERCENTAGE") {
      discount = amount.mul(promoCode.discountValue).div(100);

      if (promoCode.maxDiscount !== null && discount.greaterThan(promoCode.maxDiscount)) {
        discount = promoCode.maxDiscount;
      }
    } else {
      discount = promoCode.discountValue;
    }

    if (discount.greaterThan(amount)) {
      discount = amount;
    }

    return discount;
  }

  async createSubscription(userId: string, input: CreateSubscriptionInput) {
    const plan = await this.getPlan(input.planId);
    const userPlan = await this.subscriptionRepository.getUserSubscription(userId);

    if (userPlan?.tier === "PRO") {
      throw new AppError("You already have a Pro tier Plan", 409);
    }

    const promoCode = input.promoCode
      ? await this.validatePromoCode(userId, input.promoCode, input.planId)
      : null;

    const originalAmount = plan.price;
    const discount = promoCode
      ? new Prisma.Decimal(promoCode.discountAmount)
      : new Prisma.Decimal(0);
    const taxableAmount = originalAmount.minus(discount);
    const tax = this.calculateTax(taxableAmount, GST_RATE);
    const finalAmount = taxableAmount.plus(tax);

    return {
      plan,
      originalAmount: originalAmount.toString(),
      discountAmount: discount.toString(),
      taxableAmount: taxableAmount.toString(),
      taxAmount: tax.toString(),
      finalAmount: finalAmount.toString(),
    };
  }

  private calculateTax(amount: Prisma.Decimal, taxRate: Prisma.Decimal) {
    return amount.mul(taxRate).div(100);
  }

  private getNextResetAt(period: FeaturePeriod): Date {
    const now = new Date();

    if (period === "DAILY") {
      const reset = new Date(now);
      reset.setHours(24, 0, 0, 0);
      return reset;
    }

    if (period === "MONTHLY") {
      const reset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return reset;
    }

    return now;
  }

  async checkFeatureAccess(userId: string, featureKey: string): Promise<FeatureAccess> {
    const subscription = await this.subscriptionRepository.getUserSubscription(userId);

    if (!subscription) {
      throw new AppError("User does not have a subscription", 404);
    }

    if (subscription.status !== "ACTIVE") {
      throw new AppError("Subscription is not active", 403);
    }

    if (!subscription.plan) {
      throw new AppError("Subscription plan not found", 404);
    }

    const features = subscription.plan.features as unknown as PlanFeatures;

    const feature = features[featureKey];

    if (!feature || !feature.enabled) {
      return {
        featureKey,
        allowed: false,
        usageCount: 0,
        limit: null,
        resetAt: null,
      };
    }

    if (feature.period === "UNLIMITED") {
      return {
        featureKey,
        allowed: true,
        usageCount: 0,
        limit: null,
        resetAt: null,
      };
    }

    const usage = await this.subscriptionRepository.getFeatureUsage(userId, featureKey);

    const now = new Date();

    // No usage record yet
    if (!usage) {
      return {
        featureKey,
        allowed: true,
        usageCount: 0,
        limit: feature.limit,
        resetAt: this.getNextResetAt(feature.period),
      };
    }

    if (usage.resetAt <= now) {
      const resetAt = this.getNextResetAt(feature.period);

      await this.subscriptionRepository.updateFeatureUsage(userId, featureKey, {
        usageCount: 0,
        resetAt,
      });

      return {
        featureKey,
        allowed: true,
        usageCount: 0,
        limit: feature.limit,
        resetAt,
      };
    }

    return {
      featureKey,
      allowed: feature.limit === null || usage.usageCount < feature.limit,
      usageCount: usage.usageCount,
      limit: feature.limit,
      resetAt: usage.resetAt,
    };
  }

  async consumeFeature(userId: string, featureKey: string): Promise<FeatureAccess> {
    const access = await this.checkFeatureAccess(userId, featureKey);

    if (!access.allowed) {
      throw new AppError(`Feature limit reached for ${featureKey}`, 403);
    }

    // Unlimited features don't need usage tracking
    if (access.limit === null) {
      return access;
    }

    const usage = await this.subscriptionRepository.getFeatureUsage(userId, featureKey);

    if (!usage) {
      const resetAt = access.resetAt ?? this.getNextResetAt("DAILY");

      await this.subscriptionRepository.createFeatureUsage({
        userId,
        featureKey,
        usageCount: 1,
        resetAt,
        lastUsedAt: new Date(),
      });
    } else {
      await this.subscriptionRepository.incrementFeatureUsage(userId, featureKey);
    }

    return {
      ...access,
      usageCount: access.usageCount + 1,
    };
  }
}
