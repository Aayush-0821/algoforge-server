import { Request, Response } from "express";
import { AppError } from "../../errors/app.errors";
import { SubscriptionService } from "./subscriptions.service";
import { SubscriptionRepository } from "./subscriptions.repository";
import { applyPromoCodeSchema, createSubscriptionSchema } from "./subscriptions.validation";
import { prisma } from "../../lib/postgres";

export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async getSubscription(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const subscription = await this.subscriptionService.getSubscription(userId);

    if (!subscription) {
      throw new AppError("Subscription not found", 404);
    }

    return res.status(200).json({
      success: true,
      data: subscription,
    });
  }

  async getAvailablePlans(_req: Request, res: Response) {
    const plans = await this.subscriptionService.getAvailablePlans();

    return res.status(200).json({
      success: true,
      data: plans,
    });
  }

  async getPlan(req: Request, res: Response) {
    const planId = req.params.planId;

    if (!planId || Array.isArray(planId)) {
      throw new AppError("Plan ID is required", 400);
    }

    const plan = await this.subscriptionService.getPlan(planId);

    return res.status(200).json({
      success: true,
      data: plan,
    });
  }

  async calculateSubscriptionPrice(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parsed = createSubscriptionSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid subscription input", 400);
    }

    const result = await this.subscriptionService.createSubscription(userId, parsed.data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async validatePromoCode(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const parsed = applyPromoCodeSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new AppError("Invalid promo code input", 400);
    }

    const result = await this.subscriptionService.validatePromoCode(
      userId,
      parsed.data.code,
      parsed.data.planId,
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  }

  async checkFeatureAccess(req: Request, res: Response) {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const featureKey = req.params.featureKey;

    if (!featureKey || Array.isArray(featureKey)) {
      throw new AppError("Feature key is required", 400);
    }

    const result = await this.subscriptionService.checkFeatureAccess(userId, featureKey);

    return res.status(200).json({
      success: true,
      data: result,
    });
  }
}

const subscriptionRepository = new SubscriptionRepository(prisma);

const subscriptionService = new SubscriptionService(subscriptionRepository);

export const subscriptionController = new SubscriptionController(subscriptionService);
