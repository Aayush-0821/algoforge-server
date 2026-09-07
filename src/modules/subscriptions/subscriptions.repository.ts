import { PrismaClient } from "../../../generated/postgres";

export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: {
        userId,
      },
      include: {
        plan: true,
        payments: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  }

  async getPlanById(planId: string) {
    return this.prisma.plan.findUnique({
      where: {
        id: planId,
      },
    });
  }

  async getActivePlans() {
    return this.prisma.plan.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          tier: "asc",
        },
        {
          durationMonths: "asc",
        },
      ],
    });
  }

  async getPromoCode(code: string) {
    return this.prisma.promoCode.findUnique({
      where: {
        code,
      },
    });
  }

  async getUserPromoRedemption(promoCodeId: string, userId: string) {
    return this.prisma.promoRedemption.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId,
          userId,
        },
      },
    });
  }

  async getPaymentByOrderId(razorpayOrderId: string) {
    return this.prisma.payment.findUnique({
      where: {
        razorpayOrderId,
      },
    });
  }

  async getPaymentByPaymentId(razorpayPaymentId: string) {
    return this.prisma.payment.findUnique({
      where: {
        razorpayPaymentId,
      },
    });
  }

  async getSubscriptionByRazorpayId(razorpaySubscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: {
        razorpaySubscriptionId,
      },
    });
  }

  async createSubscription(data: {
    userId: string;
    planId?: string;
    tier: "FREE" | "PRO";
    billingCycle?: "MONTHLY" | "YEARLY";
    status?: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
    razorpaySubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }) {
    return this.prisma.subscription.create({
      data,
    });
  }

  async updateSubscription(
    subscriptionId: string,
    data: {
      planId?: string | null;
      tier?: "FREE" | "PRO";
      billingCycle?: "MONTHLY" | "YEARLY" | null;
      status?: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
      razorpaySubscriptionId?: string | null;
      currentPeriodStart?: Date | null;
      currentPeriodEnd?: Date | null;
      cancelledAt?: Date | null;
    },
  ) {
    return this.prisma.subscription.update({
      where: {
        id: subscriptionId,
      },
      data,
    });
  }

  async createPayment(data: {
    userId: string;
    planId?: string;
    subscriptionId?: string;
    provider: "RAZORPAY";
    razorpayOrderId: string;
    originalAmount: string;
    discountAmount?: string;
    finalAmount: string;
    taxAmount: string;
    currency?: string;
    status: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
    paymentMethod: "CARD" | "UPI" | "NETBANKING";
  }) {
    return this.prisma.payment.create({
      data,
    });
  }

  async updatePayment(
    paymentId: string,
    data: {
      razorpayPaymentId?: string;
      razorpaySignature?: string;
      status?: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
      paymentMethod?: "CARD" | "UPI" | "NETBANKING";
      paidAt?: Date | null;
      refundedAt?: Date | null;
      failureReason?: string | null;
      invoiceNumber?: string | null;
      receiptId?: string | null;
    },
  ) {
    return this.prisma.payment.update({
      where: {
        id: paymentId,
      },
      data,
    });
  }

  async createPromoRedemption(data: {
    promoCodeId: string;
    paymentId: string;
    userId: string;
    discountAmount: string;
  }) {
    return this.prisma.promoRedemption.create({
      data,
    });
  }

  async incrementPromoUsage(promoCodeId: string) {
    return this.prisma.promoCode.update({
      where: {
        id: promoCodeId,
      },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  async getFeatureUsage(userId: string, featureKey: string) {
    return this.prisma.featureUsage.findUnique({
      where: {
        userId_featureKey: {
          userId,
          featureKey,
        },
      },
    });
  }

  async createFeatureUsage(data: {
    userId: string;
    featureKey: string;
    usageCount?: number;
    resetAt: Date;
    lastUsedAt?: Date;
  }) {
    return this.prisma.featureUsage.create({
      data,
    });
  }

  async updateFeatureUsage(
    userId: string,
    featureKey: string,
    data: {
      usageCount?: number;
      resetAt?: Date;
      lastUsedAt?: Date;
    },
  ) {
    return this.prisma.featureUsage.update({
      where: {
        userId_featureKey: {
          userId,
          featureKey,
        },
      },
      data,
    });
  }

  async incrementFeatureUsage(
    userId: string,
    featureKey: string,
  ){
    return this.prisma.featureUsage.update({
      where:{
        userId_featureKey:{
          userId,
          featureKey,
        }
      },
      data:{
        usageCount:{
          increment: 1
        },
        lastUsedAt: new Date()
      }
    });
  }
}
