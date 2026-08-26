'use client';

import { useState } from 'react';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useCreateCheckout } from '@/hooks/use-subscription';
import { SUBSCRIPTION_TIERS, SubscriptionTier, displayPrice } from '@kanninja/shared';

// Audience-led tier copy. The constants in @kanninja/shared own the source-of-truth
// pricing data; this owns the voice. Each tier targets a *who*, not a feature checklist.
//
// "Agent calls" are MCP tool calls — the per-minute rate limit in
// SUBSCRIPTION_TIERS.features.mcpRequestsPerMinute. There is no monthly cap:
// kanNINJA runs no models, so the agent's own LLM bill is the only meter.
//
// The headline "/seat" suffix comes from displayPrice(), not from this copy.
const TIERS = [
    {
        key: SubscriptionTier.FREE,
        label: 'For the group that is never going to expense a tool. Weddings, soccer teams, households, one person keeping their own life straight.',
        cta: 'Start free',
        features: [
            'Up to 10 seats',
            'Unlimited boards',
            'Your own agent, over MCP',
            '2 GB of files',
        ],
    },
    {
        key: SubscriptionTier.CLAN,
        label: 'For the clan that works together. One price per seat, and nothing held back behind a tier above it.',
        cta: 'Pick the Clan plan',
        features: [
            'Unlimited seats, billed per seat',
            '600 agent calls/min',
            'Everything, with nothing gated',
            '1 TB of files',
        ],
    },
] as const;

export function TierCardsSection() {
    const [interval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
    const { data: session } = useSession();
    const isSignedIn = Boolean(session);
    const router = useRouter();
    const checkout = useCreateCheckout();

    const handleCheckout = async (tier: SubscriptionTier) => {
        if (!isSignedIn) {
            router.push('/sign-up');
            return;
        }
        if (tier === SubscriptionTier.FREE) {
            router.push('/dashboard');
            return;
        }
        const result = await checkout.mutateAsync({
            tier: 'clan',
            interval,
            successUrl: `${window.location.origin}/dashboard?checkout=success`,
            cancelUrl: `${window.location.origin}/pricing?checkout=cancel`,
        });
        window.location.href = result.url;
    };

    return (
        <section className="border-y border-base-300">
            <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                {/* Section header + monthly/yearly pill toggle */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-12 mb-20">
                    <div className="max-w-2xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            Two tiers
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                            One price, and{' '}
                            <span className="italic text-primary">nothing above it.</span>
                        </h2>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-base-content/70">
                            There used to be five tiers. Four of the things they sold you
                            were never enforced, so we stopped selling them. What is left
                            is free, or twelve dollars a seat.
                        </p>
                    </div>
                    <div className="inline-flex self-start md:self-end rounded-full bg-base-300/40 p-1">
                        {(['monthly', 'yearly'] as const).map((opt) => {
                            const active = interval === opt;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setBillingInterval(opt)}
                                    className={`px-5 py-2 rounded-full text-sm font-mono uppercase tracking-widest transition-all flex items-center gap-2 ${
                                        active
                                            ? 'bg-base-100 text-base-content shadow-e1'
                                            : 'text-base-content/60 hover:text-base-content'
                                    }`}
                                >
                                    {opt}
                                    {opt === 'yearly' && (
                                        <span className="text-eyebrow text-primary">2 mo free</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Two tier cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {TIERS.map((t) => {
                        const tier = SUBSCRIPTION_TIERS[t.key];
                        const { amount: price, perSeat } = displayPrice(t.key, interval);
                        // The Clan plan carries the vermillion seal — one stamp
                        // per section, and it is the only thing being sold.
                        const isPaid = t.key === SubscriptionTier.CLAN;
                        return (
                            <article
                                key={t.key}
                                className="hanko-scroll-rise hanko-lift bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 p-8 flex flex-col"
                            >
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                    {tier.name}
                                </p>
                                <p className="mt-6 font-display text-4xl font-medium tracking-tight">
                                    {price === null ? (
                                        <span className="text-3xl">Custom</span>
                                    ) : price === 0 ? (
                                        'Free'
                                    ) : (
                                        <>
                                            <span className="font-mono text-base-content/40 text-xl">
                                                $
                                            </span>
                                            {price}
                                            <span className="ml-1 text-sm font-sans font-normal text-base-content/40">
                                                /{perSeat ? 'seat/' : ''}
                                                {interval === 'yearly' ? 'yr' : 'mo'}
                                            </span>
                                        </>
                                    )}
                                </p>
                                <p className="mt-6 text-sm text-base-content/70 leading-relaxed min-h-[64px]">
                                    {t.label}
                                </p>
                                <ul className="mt-6 space-y-3 flex-1">
                                    {t.features.map((f) => (
                                        <li
                                            key={f}
                                            className="text-sm text-base-content/80 flex items-baseline gap-3"
                                        >
                                            <span className="text-primary text-xs leading-none">●</span>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    type="button"
                                    onClick={() => handleCheckout(t.key)}
                                    disabled={checkout.isPending}
                                    className={`mt-10 btn ${isPaid ? 'btn-primary' : 'btn-outline btn-secondary'}`}
                                >
                                    {t.cta}
                                </button>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
