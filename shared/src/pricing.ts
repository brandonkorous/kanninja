import { SubscriptionTier } from './enums.js';
import {
  SUBSCRIPTION_TIERS,
  STORAGE_ADD_ON,
  FREE_SEAT_CAP,
  type TierConfig,
} from './constants.js';

export type BillingInterval = 'monthly' | 'yearly';

/**
 * Everything that needs to know "what does this cost" goes through here, so no
 * call site branches on the pricing union by hand.
 */

/**
 * Map any tier string — including ones no longer sold — onto a live tier.
 *
 * `subscription_tier` is a TEXT column, so rows predating the collapse to two
 * tiers still say 'pro', 'business' or 'enterprise'. Those were all PAID, so
 * they normalize to CLAN: an unknown-but-paid tier resolving to Free would
 * quietly strip a paying customer of their seats. Anything unrecognised is
 * Free, which fails closed for garbage input.
 */
export function normalizeTier(tier: string | null | undefined): SubscriptionTier {
  if (tier === SubscriptionTier.FREE || tier === SubscriptionTier.CLAN) return tier;
  if (tier === 'pro' || tier === 'business' || tier === 'enterprise') {
    return SubscriptionTier.CLAN;
  }
  return SubscriptionTier.FREE;
}

export function isPerSeat(tier: SubscriptionTier): boolean {
  return SUBSCRIPTION_TIERS[tier].pricing.model === 'per_seat';
}

/**
 * Hard seat ceiling, or null when there isn't one.
 *
 * Only Free has one. On the Clan plan another seat is another line on the
 * invoice, not a wall — so a caller must not read null as "unlimited and free".
 */
export function getSeatCap(tier: SubscriptionTier): number | null {
  return SUBSCRIPTION_TIERS[tier].pricing.model === 'free' ? FREE_SEAT_CAP : null;
}

/** Seats a per-seat tier bills for at minimum; 0 elsewhere. */
export function getMinSeats(tier: SubscriptionTier): number {
  const { pricing } = SUBSCRIPTION_TIERS[tier];
  return pricing.model === 'per_seat' ? pricing.minSeats : 0;
}

/** Seats actually charged — never fewer than the tier's minimum. */
export function billableSeats(tier: SubscriptionTier, seatsUsed: number): number {
  return isPerSeat(tier) ? Math.max(seatsUsed, getMinSeats(tier)) : 0;
}

/** Recurring cost in whole dollars for one interval, before storage blocks. */
export function subscriptionCost(
  tier: SubscriptionTier,
  interval: BillingInterval,
  seatsUsed: number,
): number {
  const { pricing } = SUBSCRIPTION_TIERS[tier];
  if (pricing.model === 'free') return 0;
  const rate = interval === 'yearly' ? pricing.yearly : pricing.monthly;
  return rate * billableSeats(tier, seatsUsed);
}

/** What one more person costs per month. 0 on Free (they hit the cap instead). */
export function costOfNextSeat(tier: SubscriptionTier): number {
  const { pricing } = SUBSCRIPTION_TIERS[tier];
  return pricing.model === 'per_seat' ? pricing.monthly : 0;
}

/** Headline rate for the pricing grid, and whether to print "/seat". */
export function displayPrice(
  tier: SubscriptionTier,
  interval: BillingInterval,
): { amount: number; perSeat: boolean } {
  const { pricing } = SUBSCRIPTION_TIERS[tier];
  if (pricing.model === 'free') return { amount: 0, perSeat: false };
  return {
    amount: interval === 'yearly' ? pricing.yearly : pricing.monthly,
    perSeat: true,
  };
}

export function canBuyStorageBlocks(tier: SubscriptionTier): boolean {
  return isPerSeat(tier);
}

/** Included storage plus any purchased blocks, in MB. */
export function storageAllowanceMb(tier: SubscriptionTier, blocksPurchased = 0): number {
  const included = SUBSCRIPTION_TIERS[tier].storageIncludedMb;
  if (!canBuyStorageBlocks(tier)) return included;
  return included + blocksPurchased * STORAGE_ADD_ON.blockGb * 1000;
}

/** "2 GB" / "1000 GB" — one formatter so the grid can't drift. */
export function formatStorage(mb: number): string {
  if (mb < 1000) return `${mb} MB`;
  return `${mb / 1000} GB`;
}

export function tierConfig(tier: SubscriptionTier): TierConfig {
  return SUBSCRIPTION_TIERS[tier];
}
