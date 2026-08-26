import { SubscriptionTier } from '@kanninja/shared';

type Interval = 'monthly' | 'yearly';

/**
 * Stripe price IDs. Live mode, kanNINJA (acct_1RphRYRaK2z9gXUt).
 *
 * One paid tier, two prices. Both are recurring per-unit, so the seat count is
 * the subscription item's `quantity` — see seat-billing.service.ts.
 *
 * WHAT WAS ARCHIVED, AND WHY IT MUST NOT COME BACK. The flat prices these
 * replace (Pro $25, Business $99 and the $4/$6 seat-overage pair) are per-unit
 * too, so handing one a quantity of 5 does not fail — it bills five times the
 * BUNDLE. `price_1TRQ0nRaK2z9gXUtaGibjvlS` ($25 Pro monthly) is deliberately
 * still active because one live subscription sits on it; it is not a fallback.
 */
export const STRIPE_PRICE_IDS: Record<
    Exclude<SubscriptionTier, 'free'>,
    Record<Interval, string>
> = {
    [SubscriptionTier.CLAN]: {
        monthly: 'price_1U8ZnBRaK2z9gXUtashmvGZG', // $12 / seat / month
        yearly: 'price_1U8ZnHRaK2z9gXUtsUVh9Y3U', // $120 / seat / year
    },
};

/**
 * Prices we no longer sell but that live subscriptions may still sit on.
 * Recognised so the webhook can map such a subscription to a tier instead of
 * silently resolving it to Free and stripping the customer's seats.
 */
const LEGACY_PRICE_IDS: Record<string, SubscriptionTier> = {
    price_1TRQ0nRaK2z9gXUtaGibjvlS: SubscriptionTier.CLAN, // Pro $25/mo flat
    price_1TRQ8zRaK2z9gXUt8kjmWeC5: SubscriptionTier.CLAN, // Pro $250/yr flat
    price_1TRQ9HRaK2z9gXUtsiYrFFP2: SubscriptionTier.CLAN, // Business $99/mo flat
    price_1TRQ9ORaK2z9gXUttNmC5133: SubscriptionTier.CLAN, // Business $990/yr flat
    price_1TRQ0QRaK2z9gXUtZ6WxsjXJ: SubscriptionTier.CLAN, // Clan $10/mo flat
    price_1TRQ0WRaK2z9gXUtSoXKh7R0: SubscriptionTier.CLAN, // Clan $100/yr flat
};

const baseToTier = new Map<string, SubscriptionTier>();
for (const [tier, set] of Object.entries(STRIPE_PRICE_IDS)) {
    for (const id of Object.values(set)) {
        if (id) baseToTier.set(id, tier as SubscriptionTier);
    }
}

/** Reverse lookup, current prices and legacy ones. FREE for anything unknown. */
export function tierFromPriceId(priceId: string): SubscriptionTier {
    return baseToTier.get(priceId) ?? LEGACY_PRICE_IDS[priceId] ?? SubscriptionTier.FREE;
}

/** True for a price we currently sell. */
export function isBasePriceId(priceId: string): boolean {
    return baseToTier.has(priceId);
}

/** True for a price still billing someone but no longer sold. */
export function isLegacyPriceId(priceId: string): boolean {
    return priceId in LEGACY_PRICE_IDS;
}

/**
 * True when this price is billed per seat, so its quantity may be synced.
 *
 * The guard that matters: legacy flat prices return FALSE. Syncing a seat count
 * onto `price_1TRQ0nRaK2z9gXUtaGibjvlS` would bill $25 per seat rather than $25
 * for the bundle the customer actually bought.
 */
export function isPerSeatPriceId(priceId: string): boolean {
    return baseToTier.has(priceId);
}

/** Price ID for a checkout, or a thrown error naming the gap. */
export function getBasePriceId(
    tier: Exclude<SubscriptionTier, 'free'>,
    interval: Interval,
): string {
    const id = STRIPE_PRICE_IDS[tier]?.[interval];
    if (!id) {
        throw new Error(
            `No Stripe price configured for ${tier}/${interval}. Create a ` +
                `per-unit recurring price in Stripe and set it in config/stripe-prices.ts.`,
        );
    }
    return id;
}
