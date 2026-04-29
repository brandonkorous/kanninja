import { SubscriptionTier } from '@kanninja/shared';

type Interval = 'monthly' | 'yearly';

/**
 * Stripe price IDs for each self-serve paid tier × billing interval.
 * Live mode, kanNINJA account (acct_1RphRYRaK2z9gXUt). Created 2026-04-28.
 *
 * Enterprise is sales-only (talk-to-us) — no Stripe price exists, and
 * createCheckoutSession will reject any attempt to check out as Enterprise.
 */
export const STRIPE_PRICE_IDS: Record<
  Exclude<SubscriptionTier, 'free' | 'enterprise'>,
  Record<Interval, string>
> = {
  [SubscriptionTier.CLAN]: {
    monthly: 'price_1TRQ0QRaK2z9gXUtZ6WxsjXJ',
    yearly: 'price_1TRQ0WRaK2z9gXUtSoXKh7R0',
  },
  [SubscriptionTier.PRO]: {
    monthly: 'price_1TRQ0nRaK2z9gXUtaGibjvlS',
    yearly: 'price_1TRQ8zRaK2z9gXUt8kjmWeC5',
  },
  [SubscriptionTier.BUSINESS]: {
    monthly: 'price_1TRQ9HRaK2z9gXUtsiYrFFP2',
    yearly: 'price_1TRQ9ORaK2z9gXUttNmC5133',
  },
};

/** Reverse lookup: Stripe price ID → subscription tier */
const priceToTierMap = new Map<string, SubscriptionTier>();
for (const [tier, intervals] of Object.entries(STRIPE_PRICE_IDS)) {
  priceToTierMap.set(intervals.monthly, tier as SubscriptionTier);
  priceToTierMap.set(intervals.yearly, tier as SubscriptionTier);
}

export function tierFromPriceId(priceId: string): SubscriptionTier {
  return priceToTierMap.get(priceId) ?? SubscriptionTier.FREE;
}
