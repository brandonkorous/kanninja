// Inline JSON-LD script tag. Server-rendered (no hydration), so search
// engines and answer engines see structured data on first paint. Use one of
// the typed helpers below — they keep the schema strict without dragging in
// schema-dts.

import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, ORG_LEGAL_NAME, SUPPORT_EMAIL } from '@/lib/seo';
import { SUBSCRIPTION_TIERS, SubscriptionTier, FREE_SEAT_CAP } from '@kanninja/shared';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            // Safe: the argument is always an object we built here, run
            // through JSON.stringify — never user input, never a string
            // spliced together. (The old eslint-disable pointed at
            // react/no-danger, which this config does not enable.)
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

/**
 * One Offer per tier we actually sell.
 *
 * The paid tier needs a `priceSpecification` because a bare `price` reads as
 * the whole cost of kanNINJA rather than the cost of one seat. `referenceQuantity`
 * is what carries "per seat"; `unitText` spells out the billing period in words
 * rather than guessing at a UN/CEFACT code, which is easy to get subtly wrong.
 */
function tierOffers() {
    return Object.values(SubscriptionTier).map((key) => {
        const tier = SUBSCRIPTION_TIERS[key];
        const base = {
            '@type': 'Offer',
            name: tier.name,
            priceCurrency: 'USD',
            url: `${SITE_URL}/pricing`,
        };

        if (tier.pricing.model === 'free') {
            return {
                ...base,
                price: '0',
                description: `Free, up to ${FREE_SEAT_CAP} seats. No card.`,
            };
        }

        return {
            ...base,
            price: String(tier.pricing.monthly),
            description: 'Per seat, per month. Nothing is held back for a tier above.',
            priceSpecification: {
                '@type': 'UnitPriceSpecification',
                price: String(tier.pricing.monthly),
                priceCurrency: 'USD',
                unitText: 'per seat, per month',
                referenceQuantity: {
                    '@type': 'QuantitativeValue',
                    value: 1,
                    unitText: 'seat',
                },
            },
        };
    });
}

export function organizationLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        legalName: ORG_LEGAL_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/brand/nin-icon.svg`,
        email: SUPPORT_EMAIL,
        sameAs: [
            'https://github.com/wizeworks',
            'https://twitter.com/kanninja',
        ],
    };
}

export function softwareApplicationLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#software`,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: SITE_URL,
        applicationCategory: 'ProjectManagementApplication',
        operatingSystem: 'Web, iOS, Android',
        // Derived from SUBSCRIPTION_TIERS, not restated. This block used to
        // advertise a "Starter" tier and four paid tiers from $8 to $149 —
        // none of which exist. Search engines read this directly, so a stale
        // price here is a wrong price in someone's rich result.
        offers: tierOffers(),
        publisher: { '@id': `${SITE_URL}/#organization` },
    };
}

export function websiteLd() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
        },
    };
}

export function faqLd(items: { q: string; a: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: items.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
    };
}

export function breadcrumbLd(crumbs: { name: string; path: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: crumbs.map((crumb, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: crumb.name,
            item: `${SITE_URL}${crumb.path}`,
        })),
    };
}
