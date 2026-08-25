'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useCreateCheckout } from '@/hooks/use-subscription';
import { SUBSCRIPTION_TIERS, SubscriptionTier } from '@kanninja/shared';

// Audience-led tier copy. The constants in @kanninja/shared own the source-of-truth
// pricing data; this owns the voice. Each tier targets a *who*, not a feature checklist.
//
// "Agent calls" are MCP tool calls — the per-minute rate limit in
// SUBSCRIPTION_TIERS.features.mcpRequestsPerMinute. There is no monthly cap:
// kanNINJA runs no models, so the agent's own LLM bill is the only meter.
const TIERS = [
    {
        key: SubscriptionTier.FREE,
        label: 'Solo practice. Three seats, unlimited boards, your own agent.',
        cta: 'Start free',
        features: [
            'Up to 3 seats',
            'Unlimited boards',
            '10 agent calls/min',
            '100 MB of files',
        ],
    },
    {
        key: SubscriptionTier.CLAN,
        label: 'For the people you live and play with. Weddings, soccer teams, clubs, families.',
        cta: 'Pick Clan',
        features: [
            'Up to 15 seats',
            '30 agent calls/min',
            'Project templates',
            '5 GB of files',
        ],
    },
    {
        key: SubscriptionTier.PRO,
        label: 'For the work you do. Startups, builders, agencies. Your agent, at speed.',
        cta: 'Pick Pro',
        features: [
            '15 seats included, $4 each after',
            '120 agent calls/min',
            'Project templates',
            '10 GB of files',
        ],
    },
    {
        key: SubscriptionTier.BUSINESS,
        label: 'When work needs guardrails. SSO, audit log, the things IT signs off on.',
        cta: 'Pick Business',
        features: [
            '50 seats included, $6 each after',
            '600 agent calls/min',
            'Single sign-on + audit log',
            'Priority support',
        ],
    },
    {
        key: SubscriptionTier.ENTERPRISE,
        label: 'For when there is a contract, a CSM, and a procurement team in the room.',
        cta: 'Talk to us',
        features: [
            'Custom seats',
            'Unmetered agent calls',
            'Dedicated CSM + SLA',
            'SCIM, dedicated infra',
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
        if (tier === SubscriptionTier.ENTERPRISE) {
            router.push('/contact?topic=enterprise');
            return;
        }
        if (!isSignedIn) {
            router.push('/sign-up');
            return;
        }
        if (tier === SubscriptionTier.FREE) {
            router.push('/dashboard');
            return;
        }
        const result = await checkout.mutateAsync({
            tier: tier as 'clan' | 'pro' | 'business' | 'enterprise',
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
                            The five tiers
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                            Pick where you <span className="italic text-primary">start.</span>
                        </h2>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-base-content/70">
                            Move when the work earns the move. Not before.
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

                {/* Five tier cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {TIERS.map((t) => {
                        const tier = SUBSCRIPTION_TIERS[t.key];
                        const price = interval === 'yearly' ? tier.price.yearly : tier.price.monthly;
                        const isPro = t.key === SubscriptionTier.PRO;
                        const isEnterprise = t.key === SubscriptionTier.ENTERPRISE;
                        return (
                            <article
                                key={t.key}
                                className="hanko-scroll-rise hanko-lift bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 p-8 flex flex-col"
                            >
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                    {tier.name}
                                </p>
                                <p className="mt-6 font-display text-4xl font-medium tracking-tight">
                                    {isEnterprise ? (
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
                                                /{interval === 'yearly' ? 'yr' : 'mo'}
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
                                {isEnterprise ? (
                                    <Link
                                        href="/contact?topic=enterprise"
                                        className="mt-10 btn btn-outline btn-secondary"
                                    >
                                        {t.cta}
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleCheckout(t.key)}
                                        disabled={checkout.isPending}
                                        className={`mt-10 btn ${isPro ? 'btn-primary' : 'btn-outline btn-secondary'}`}
                                    >
                                        {t.cta}
                                    </button>
                                )}
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
