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

export type Subscription = z.infer<typeof subscriptionSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
