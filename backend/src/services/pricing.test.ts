import { describe, it, expect } from 'vitest';
import {
  SubscriptionTier,
  SUBSCRIPTION_TIERS,
  STORAGE_ADD_ON,
  FREE_SEAT_CAP,
  YEARLY_MONTHS_CHARGED,
  normalizeTier,
  isPerSeat,
  getSeatCap,
  billableSeats,
  subscriptionCost,
  costOfNextSeat,
  displayPrice,
  storageAllowanceMb,
  formatStorage,
} from '@kanninja/shared';
import {
  isBasePriceId,
  isLegacyPriceId,
  isPerSeatPriceId,
  getBasePriceId,
  tierFromPriceId,
} from '../config/stripe-prices.js';

/** These decide what customers are charged. Pure functions — no db, no Stripe. */

describe('normalizeTier', () => {
  it('passes through live tiers', () => {
    expect(normalizeTier('free')).toBe(SubscriptionTier.FREE);
    expect(normalizeTier('clan')).toBe(SubscriptionTier.CLAN);
  });

  it('maps retired PAID tiers to Clan, not Free', () => {
    // subscription_tier is TEXT and rows predating the collapse still say
    // these. Resolving a paying customer to Free would strip their seats.
    expect(normalizeTier('pro')).toBe(SubscriptionTier.CLAN);
    expect(normalizeTier('business')).toBe(SubscriptionTier.CLAN);
    expect(normalizeTier('enterprise')).toBe(SubscriptionTier.CLAN);
  });

  it('fails closed on garbage', () => {
    expect(normalizeTier(null)).toBe(SubscriptionTier.FREE);
    expect(normalizeTier(undefined)).toBe(SubscriptionTier.FREE);
    expect(normalizeTier('platinum')).toBe(SubscriptionTier.FREE);
  });
});

describe('seats', () => {
  it('caps Free and leaves the paid tier uncapped', () => {
    expect(getSeatCap(SubscriptionTier.FREE)).toBe(FREE_SEAT_CAP);
    // A cap here would make the invite flow refuse a seat we are happy to sell.
    expect(getSeatCap(SubscriptionTier.CLAN)).toBeNull();
  });

  it('bills every seat on Clan and none on Free', () => {
    expect(isPerSeat(SubscriptionTier.CLAN)).toBe(true);
    expect(billableSeats(SubscriptionTier.CLAN, 1)).toBe(1);
    expect(billableSeats(SubscriptionTier.CLAN, 12)).toBe(12);
    // Non-zero on Free would invent a charge for a plan that has no price.
    expect(billableSeats(SubscriptionTier.FREE, 8)).toBe(0);
  });
});

describe('cost', () => {
  it('multiplies seats by the per-seat rate', () => {
    expect(subscriptionCost(SubscriptionTier.CLAN, 'monthly', 1)).toBe(12);
    expect(subscriptionCost(SubscriptionTier.CLAN, 'monthly', 6)).toBe(72);
    expect(subscriptionCost(SubscriptionTier.CLAN, 'yearly', 6)).toBe(720);
  });

  it('is free on Free regardless of head count', () => {
    expect(subscriptionCost(SubscriptionTier.FREE, 'monthly', 10)).toBe(0);
  });

  it('quotes the next seat at the monthly rate', () => {
    expect(costOfNextSeat(SubscriptionTier.CLAN)).toBe(12);
    expect(costOfNextSeat(SubscriptionTier.FREE)).toBe(0);
  });

  it('gives two months free on the yearly rate', () => {
    const { pricing } = SUBSCRIPTION_TIERS[SubscriptionTier.CLAN];
    if (pricing.model !== 'per_seat') throw new Error('Clan must be per-seat');
    expect(pricing.yearly).toBe(pricing.monthly * YEARLY_MONTHS_CHARGED);
  });

  it('flags only the paid tier for a /seat suffix', () => {
    expect(displayPrice(SubscriptionTier.CLAN, 'monthly')).toEqual({ amount: 12, perSeat: true });
    expect(displayPrice(SubscriptionTier.FREE, 'monthly')).toEqual({ amount: 0, perSeat: false });
  });
});

describe('stripe price identity', () => {
  it('resolves configured prices for both intervals', () => {
    expect(getBasePriceId(SubscriptionTier.CLAN, 'monthly')).toMatch(/^price_/);
    expect(getBasePriceId(SubscriptionTier.CLAN, 'yearly')).toMatch(/^price_/);
  });

  it('treats the archived flat prices as legacy, never per-seat', () => {
    // The live $25 Pro price. Syncing a seat quantity onto it would bill $25
    // PER HEAD rather than $25 for the bundle the customer bought — the single
    // most expensive mistake available in this codebase.
    const oldProMonthly = 'price_1TRQ0nRaK2z9gXUtaGibjvlS';
    expect(isLegacyPriceId(oldProMonthly)).toBe(true);
    expect(isPerSeatPriceId(oldProMonthly)).toBe(false);
    expect(isBasePriceId(oldProMonthly)).toBe(false);
  });

  it('still maps a legacy price to a paid tier', () => {
    // Falling through to Free here would downgrade a live subscriber on the
    // next webhook.
    expect(tierFromPriceId('price_1TRQ0nRaK2z9gXUtaGibjvlS')).toBe(SubscriptionTier.CLAN);
    expect(tierFromPriceId('price_nonsense')).toBe(SubscriptionTier.FREE);
  });
});

describe('storage', () => {
  it('adds purchased blocks on the paid tier only', () => {
    const base = SUBSCRIPTION_TIERS[SubscriptionTier.CLAN].storageIncludedMb;
    expect(storageAllowanceMb(SubscriptionTier.CLAN, 2)).toBe(
      base + 2 * STORAGE_ADD_ON.blockGb * 1000,
    );
    const free = SUBSCRIPTION_TIERS[SubscriptionTier.FREE].storageIncludedMb;
    expect(storageAllowanceMb(SubscriptionTier.FREE, 5)).toBe(free);
  });

  it('formats MB below a gigabyte and GB above', () => {
    expect(formatStorage(500)).toBe('500 MB');
    expect(formatStorage(2_000)).toBe('2 GB');
  });
});
