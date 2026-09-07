import { z } from "zod";

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid(),
  promoCode: z.string().trim().min(1).max(50).optional(),
});

export const applyPromoCodeSchema = z.object({
    code: z.string().trim().min(1).max(50),
    planId: z.string().uuid()
});

export const verifyPaymentSchema = z.object({
    razorpayOrderId: z.string().trim().min(1),
    razorpayPaymentId: z.string().trim().min(1),
    razorpaySignature: z.string().trim().min(1)
});

export const razorpayWebhookSchema = z.object({
    event: z.string().trim().min(1),
    payload: z.record(z.string(), z.unknown())
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type ApplyPromoCodeInput = z.infer<typeof applyPromoCodeSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type RazorpayWebhookPayload = z.infer<typeof razorpayWebhookSchema>;