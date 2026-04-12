import { SubscriptionTier } from '@kanninja/shared';

type Interval = 'monthly' | 'yearly';

/**
 * Stripe price IDs for each paid tier × billing interval.
 * Created in Stripe test mode — replace with live IDs for production.
 */
export const STRIPE_PRICE_IDS: Record<
  Exclude<SubscriptionTier, 'free'>,
  Record<Interval, string>
> = {
  [SubscriptionTier.ESSENTIALS]: {
    monthly: 'price_1TKZHNDa5iGUonlx4DEbpvwV',
    yearly: 'price_1TKZHPDa5iGUonlxUdwuBycl',
  },
  [SubscriptionTier.PRO]: {
    monthly: 'price_1TKZHRDa5iGUonlxOvpdYJKc',
    yearly: 'price_1TKZHSDa5iGUonlx5pOsRFHq',
  },
  [SubscriptionTier.BUSINESS]: {
    monthly: 'price_1TKZHXDa5iGUonlxgvSzKTiP',
    yearly: 'price_1TKZHYDa5iGUonlxoOBNHovA',
  },
  [SubscriptionTier.ENTERPRISE]: {
    monthly: 'price_1TKZHZDa5iGUonlxaNDbNM6I',
    yearly: 'price_1TKZHaDa5iGUonlxUWDsLxyL',
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
