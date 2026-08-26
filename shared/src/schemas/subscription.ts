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

/** Seat snapshot for the billing UI.
 *
 *  `seatCap` is non-null ONLY on the tiers that still refuse the next person
 *  (Free, Clan). Per-seat tiers have no cap, so a UI that reads a null cap as
 *  "unlimited" and says nothing is wrong — the next seat costs
 *  `perSeatPriceMonthly` and the invite flow has to say so.
 *
 *  `seatsBilled` is what Stripe's quantity should be. It can exceed `seatsUsed`
 *  because Business bills a 5-seat minimum. */
export const subscriptionUsageSchema = z.object({
  seatsUsed: z.number().int().min(0),
  seatCap: z.number().int().min(0).nullable(),
  seatsBilled: z.number().int().min(0),
  minSeats: z.number().int().min(0),
  perSeatPriceMonthly: z.number().nullable(),
});

export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type SubscriptionUsage = z.infer<typeof subscriptionUsageSchema>;
