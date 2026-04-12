import Link from 'next/link';
import type { Metadata } from 'next';
import { TierCardsSection } from '@/components/marketing/TierCardsSection';
import { FeatureComparisonTable } from '@/components/marketing/FeatureComparisonTable';
import { PricingFAQ } from '@/components/marketing/PricingFAQ';

export const metadata: Metadata = {
    title: 'kanNINJA — Pricing',
    description:
        'Five tiers. The first is free, forever. The others wait until the work earns them.',
    openGraph: {
        title: 'kanNINJA — Pricing',
        description: 'Free until you outgrow it. Most people never do.',
        type: 'website',
    },
};

export default function PricingPage() {
    return (
        <>
            {/* Hero — left-aligned, generous breathing room */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                    <div className="max-w-4xl">
                        <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            Pricing
                        </p>
                        <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                            Pay when it{' '}
                            <span className="hanko-brush italic text-primary">earns it.</span>
                        </h1>
                        <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            Five tiers. The first is free, forever. The others wait until
                            the work earns them.
                        </p>
                    </div>
                </div>
            </section>

            {/* Tier cards with monthly/yearly toggle (client component) */}
            <TierCardsSection />

            {/* Full feature comparison */}
            <FeatureComparisonTable />

            {/* FAQ */}
            <PricingFAQ />

            {/* Closing — sumi panel with the canonical line + 忍 seal */}
            <section className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                    <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                        <div className="max-w-2xl">
                            <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                Begin
                            </p>
                            <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                                Free until you{' '}
                                <span className="italic text-primary">outgrow it.</span>
                            </h2>
                            <p className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-content/70">
                                Most people never do.
                            </p>
                            <Link
                                href="/sign-up"
                                className="mt-12 inline-flex btn btn-primary focus-visible:shadow-focus"
                            >
                                Start free
                            </Link>
                        </div>
                        <img
                            src="/brand/nin-icon.svg"
                            alt=""
                            width={288}
                            height={288}
                            className="hidden md:block h-48 w-48 lg:h-64 lg:w-64 xl:h-72 xl:w-72"
                        />
                    </div>
                </div>
            </section>
        </>
    );
}
