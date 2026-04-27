// Inline JSON-LD script tag. Server-rendered (no hydration), so search
// engines and answer engines see structured data on first paint. Use one of
// the typed helpers below — they keep the schema strict without dragging in
// schema-dts.

import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, ORG_LEGAL_NAME, SUPPORT_EMAIL } from '@/lib/seo';

export function JsonLd({ data }: { data: Record<string, unknown> }) {
    return (
        <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
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
        offers: [
            {
                '@type': 'Offer',
                name: 'Starter',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free, forever. The first tier of kanNINJA.',
            },
            {
                '@type': 'AggregateOffer',
                name: 'Paid tiers',
                priceCurrency: 'USD',
                lowPrice: '8',
                highPrice: '149',
                offerCount: 4,
                url: `${SITE_URL}/pricing`,
            },
        ],
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
