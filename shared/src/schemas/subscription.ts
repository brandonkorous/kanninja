import { z } from 'zod';
import { SubscriptionTier } from '../enums.js';

const tierValues = Object.values(SubscriptionTier) as [string, ...string[]];

export const subscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  email: z.string().email(),
  stripeCustomerId: z.string().nullable(),
  subscribed: z.boolean(),
  subscriptionTier: z.enum(tierValues),
  subscriptionEnd: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createCheckoutSchema = z.object({
  tier: z.enum(tierValues),
  interval: z.enum(['monthly', 'yearly']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

/** Seat usage snapshot for the billing UI. seatsIncluded is null for
 *  Enterprise (custom). seatOveragePriceMonthly is null on tiers without
 *  overage (Free, Clan, Enterprise). */
export const subscriptionUsageSchema = z.object({
  seatsUsed: z.number().int().min(0),
  seatsIncluded: z.number().int().min(0).nullable(),
  seatOverage: z.number().int().min(0),
  seatOveragePriceMonthly: z.number().nullable(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type SubscriptionUsage = z.infer<typeof subscriptionUsageSchema>;
