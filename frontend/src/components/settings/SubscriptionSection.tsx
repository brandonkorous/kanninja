'use client';

import Link from 'next/link';
import {
    useSubscription,
    useCustomerPortal,
    useSubscriptionUsage,
} from '@/hooks/use-subscription';
import type { SubscriptionUsage } from '@kanninja/shared';

export function SubscriptionSection() {
    const { data: subscription, isLoading, error, refetch, isFetching } = useSubscription();
    const { data: usage } = useSubscriptionUsage();
    const portal = useCustomerPortal();

    const tier = subscription?.subscriptionTier ?? 'free';
    const isFree = tier === 'free';

    const handleManageBilling = async () => {
        const result = await portal.mutateAsync(window.location.href);
        window.location.href = result.url;
    };

    return (
        <section
            id="subscription"
            className="bg-base-100 rounded-lg shadow-e1 p-8 scroll-mt-16"
        >
            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                Plan
            </p>
            <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">
                Your current <span className="italic text-primary">tier.</span>
            </h2>

            {isLoading && (
                <p
                    role="status"
                    aria-live="polite"
                    className="mt-8 text-eyebrow font-mono uppercase tracking-widest text-base-content/60"
                >
                    Reading your subscription…
                </p>
            )}

            {error && (
                <div role="alert" className="mt-8">
                    <p className="text-eyebrow font-mono uppercase tracking-widest text-error">
                        Something on our end
                    </p>
                    <h3 className="mt-3 font-display text-xl font-medium tracking-tight">
                        We couldn&rsquo;t read your subscription.
                    </h3>
                    <p className="mt-3 text-sm text-base-content/70">
                        {error.message || 'Try again in a moment.'}
                    </p>
                    <button
                        type="button"
                        className="btn btn-secondary mt-4"
                        onClick={() => refetch()}
                        disabled={isFetching}
                    >
                        {isFetching ? 'Trying…' : 'Try again'}
                    </button>
                </div>
            )}

            {subscription && !error && (
                <>
                    <div className="mt-8 flex items-baseline gap-3">
                        <span className="font-display text-4xl font-medium tracking-tight capitalize">
                            {tier}
                        </span>
                        {isFree && (
                            <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                                Free forever
                            </span>
                        )}
                    </div>
                    {subscription.subscriptionEnd && (
                        <p className="mt-3 text-sm text-base-content/70">
                            Renews{' '}
                            {new Date(subscription.subscriptionEnd).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    )}
                    {isFree && (
                        <p className="mt-3 text-sm text-base-content/70 max-w-md">
                            Free until you outgrow it. Most people never do.
                        </p>
                    )}

                    {usage && <SeatUsageBlock usage={usage} />}

                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link href="/pricing" className="btn btn-outline btn-secondary">
                            See the tiers
                        </Link>
                        {subscription.stripeCustomerId && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleManageBilling}
                                disabled={portal.isPending}
                            >
                                {portal.isPending ? 'Opening…' : 'Manage billing'}
                            </button>
                        )}
                    </div>
                </>
            )}
        </section>
    );
}

function SeatUsageBlock({ usage }: { usage: SubscriptionUsage }) {
    const { seatsUsed, seatCap, seatsBilled, minSeats, perSeatPriceMonthly } = usage;

    // Three shapes, and they are genuinely different questions:
    //   capped   (Free, Clan) — "how many left?"
    //   perSeat  (Pro, Business) — "what does this cost?"
    //   custom   (Enterprise) — neither; the contract answers it.
    const capped = seatCap !== null;
    const perSeat = perSeatPriceMonthly !== null;
    const atHardCap = capped && seatsUsed >= seatCap;
    const monthly = perSeat ? seatsBilled * perSeatPriceMonthly : 0;
    // Business bills five seats whether or not five people are using it, so a
    // team of three is already paying for the fourth and fifth.
    const paidAhead = perSeat && seatsBilled > seatsUsed;

    return (
        <div className="mt-10 pt-8 border-t border-base-300/60">
            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                Seats
            </p>
            <p className="mt-4 font-display text-2xl font-medium tracking-tight">
                <span className="font-mono">{seatsUsed}</span>
                {capped ? (
                    <>
                        <span className="text-base-content/40"> of </span>
                        <span className="font-mono">{seatCap}</span>
                    </>
                ) : (
                    <span className="text-base-content/40">
                        {seatsUsed === 1 ? ' seat' : ' seats'}
                    </span>
                )}
                {!capped && !perSeat && (
                    <span className="ml-2 text-eyebrow font-mono uppercase tracking-widest text-base-content/60">
                        Custom
                    </span>
                )}
                {atHardCap && (
                    <span className="ml-3 text-eyebrow font-mono uppercase tracking-widest text-primary">
                        At limit
                    </span>
                )}
            </p>

            {perSeat && (
                <p className="mt-3 text-sm text-base-content/70">
                    <span className="font-mono">{seatsBilled}</span> billed at{' '}
                    <span className="font-mono">${perSeatPriceMonthly}</span> ={' '}
                    <span className="font-mono">${monthly}</span>/mo
                </p>
            )}
            {paidAhead && (
                <p className="mt-2 text-sm text-base-content/70 max-w-md">
                    Your plan bills a {minSeats}-seat minimum, so the next{' '}
                    {seatsBilled - seatsUsed === 1
                        ? 'seat is'
                        : `${seatsBilled - seatsUsed} seats are`}{' '}
                    already paid for.
                </p>
            )}
            {atHardCap && (
                <p className="mt-3 text-sm text-base-content/70 max-w-md">
                    Upgrade to add more seats. Your boards stay where they are.
                </p>
            )}
        </div>
    );
}
