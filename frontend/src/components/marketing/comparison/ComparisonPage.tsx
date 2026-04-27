import { JsonLd, faqLd, breadcrumbLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/seo';
import { ComparisonHero } from './ComparisonHero';
import { ComparisonHonesty } from './ComparisonHonesty';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonFAQSection } from './ComparisonFAQSection';
import { ComparisonClose } from './ComparisonClose';
import type { ComparisonData } from './types';

interface Props {
    slug: string;
    data: ComparisonData;
}

/**
 * The composed /vs/<slug> page. Each comparison file imports this and hands
 * it a single ComparisonData object — no markup duplication, every comparison
 * gets the same FAQPage + BreadcrumbList + Comparison structured data.
 */
export function ComparisonPage({ slug, data }: Props) {
    const url = `${SITE_URL}/vs/${slug}`;

    // Schema.org doesn't have a great "comparison page" type; the cleanest
    // play is FAQPage (the questions are real Q&A) + BreadcrumbList + a
    // WebPage that mentions both products.
    const webPageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `kanNINJA vs ${data.competitor}`,
        description: data.heroSubtitle,
        about: [
            { '@type': 'SoftwareApplication', name: 'kanNINJA' },
            { '@type': 'SoftwareApplication', name: data.competitor },
        ],
        mainEntity: { '@id': `${SITE_URL}/#software` },
    };

    return (
        <>
            <JsonLd data={webPageLd} />
            <JsonLd data={faqLd(data.faqs)} />
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'Compare', path: '/vs' },
                    { name: data.competitor, path: `/vs/${slug}` },
                ])}
            />
            <ComparisonHero
                competitor={data.competitor}
                competitorPositioning={data.competitorPositioning}
                heroSubtitle={data.heroSubtitle}
            />
            <ComparisonHonesty
                competitor={data.competitorShort}
                pickThemIf={data.pickThemIf}
                pickUsIf={data.pickUsIf}
            />
            <ComparisonTable
                competitor={data.competitorShort}
                rows={data.rows}
                coreDifference={data.coreDifference}
            />
            <ComparisonFAQSection
                competitor={data.competitorShort}
                faqs={data.faqs}
            />
            <ComparisonClose competitor={data.competitorShort} />
        </>
    );
}
