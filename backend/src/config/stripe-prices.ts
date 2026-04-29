import { SubscriptionTier } from '@kanninja/shared';

type Interval = 'monthly' | 'yearly';

interface TierPriceSet {
  /** The base flat-rate subscription price for this tier × interval. */
  base: Record<Interval, string>;
  /** The seat-overage per-seat price, applied as a separate subscription item
   *  with quantity = max(0, seats - includedSeats). Null if the tier has a
   *  hard seat cap and no overage is allowed. */
  seatOverage: Record<Interval, string> | null;
}

/**
 * Stripe price IDs for each self-serve paid tier × billing interval.
 * Live mode, kanNINJA account (acct_1RphRYRaK2z9gXUt). Created 2026-04-28.
 *
 * Enterprise is sales-only (talk-to-us) — no Stripe price exists, and
 * createCheckoutSession will reject any attempt to check out as Enterprise.
 *
 * Clan has no overage — at-cap users must upgrade to Pro to keep adding seats.
 * Pro and Business get a separate per-seat-overage subscription item; the
 * webhook handler must pick the base item out of items.data when mapping
 * tiers (see isBasePriceId / isOveragePriceId below).
 */
export const STRIPE_PRICE_IDS: Record<
  Exclude<SubscriptionTier, 'free' | 'enterprise'>,
  TierPriceSet
> = {
  [SubscriptionTier.CLAN]: {
    base: {
      monthly: 'price_1TRQ0QRaK2z9gXUtZ6WxsjXJ',
      yearly: 'price_1TRQ0WRaK2z9gXUtSoXKh7R0',
    },
    seatOverage: null,
  },
  [SubscriptionTier.PRO]: {
    base: {
      monthly: 'price_1TRQ0nRaK2z9gXUtaGibjvlS',
      yearly: 'price_1TRQ8zRaK2z9gXUt8kjmWeC5',
    },
    seatOverage: {
      monthly: 'price_1TRRlLRaK2z9gXUtMeFrnm8M',
      yearly: 'price_1TRRlTRaK2z9gXUt2bmzJ4YS',
    },
  },
  [SubscriptionTier.BUSINESS]: {
    base: {
      monthly: 'price_1TRQ9HRaK2z9gXUtsiYrFFP2',
      yearly: 'price_1TRQ9ORaK2z9gXUttNmC5133',
    },
    seatOverage: {
      monthly: 'price_1TRRlhRaK2z9gXUtKFeXucva',
      yearly: 'price_1TRRlnRaK2z9gXUtWBx4DCjM',
    },
  },
};

const baseToTier = new Map<string, SubscriptionTier>();
const overageToTier = new Map<string, SubscriptionTier>();
for (const [tier, set] of Object.entries(STRIPE_PRICE_IDS)) {
  baseToTier.set(set.base.monthly, tier as SubscriptionTier);
  baseToTier.set(set.base.yearly, tier as SubscriptionTier);
  if (set.seatOverage) {
    overageToTier.set(set.seatOverage.monthly, tier as SubscriptionTier);
    overageToTier.set(set.seatOverage.yearly, tier as SubscriptionTier);
  }
}

/** Reverse lookup for BASE prices only. Returns FREE for unknown or overage IDs. */
export function tierFromPriceId(priceId: string): SubscriptionTier {
  return baseToTier.get(priceId) ?? SubscriptionTier.FREE;
}

/** True when the price ID is one of our base (flat-rate) tier prices. */
export function isBasePriceId(priceId: string): boolean {
  return baseToTier.has(priceId);
}

/** True when the price ID is one of our seat-overage prices. */
export function isOveragePriceId(priceId: string): boolean {
  return overageToTier.has(priceId);
}

/** Given a tier and billing interval, return the seat-overage price ID, or
 *  null if this tier doesn't support overage (Clan: hard cap, Enterprise: custom). */
export function getOveragePriceId(
  tier: SubscriptionTier,
  interval: Interval,
): string | null {
  if (tier === SubscriptionTier.FREE || tier === SubscriptionTier.ENTERPRISE) {
    return null;
  }
  return STRIPE_PRICE_IDS[tier]?.seatOverage?.[interval] ?? null;
}
