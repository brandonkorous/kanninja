import { JsonLd, faqLd, breadcrumbLd } from '@/components/seo/JsonLd';
import { SITE_URL } from '@/lib/seo';
import { PersonaHero } from './PersonaHero';
import { PersonaIntro } from './PersonaIntro';
import { PersonaSampleBoard } from './PersonaSampleBoard';
import { PersonaUseCases } from './PersonaUseCases';
import { PersonaFAQSection } from './PersonaFAQSection';
import { PersonaClose } from './PersonaClose';
import type { PersonaData } from './types';

interface Props {
    slug: string;
    data: PersonaData;
}

/**
 * Composed /for/<slug> page. Each persona file imports this and hands it a
 * single PersonaData object. The composer handles structured data, the order
 * of sections, and consistent spacing between them.
 */
export function PersonaPage({ slug, data }: Props) {
    const url = `${SITE_URL}/for/${slug}`;

    const webPageLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: `kanNINJA for ${data.label}`,
        description: data.hero.subtitle,
        about: { '@id': `${SITE_URL}/#software` },
    };

    return (
        <>
            <JsonLd data={webPageLd} />
            <JsonLd data={faqLd(data.faqs)} />
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'For', path: '/for' },
                    { name: data.label, path: `/for/${slug}` },
                ])}
            />
            <PersonaHero
                eyebrow={data.hero.eyebrow}
                headlineBefore={data.hero.headlineBefore}
                headlineItalic={data.hero.headlineItalic}
                subtitle={data.hero.subtitle}
            />
            <PersonaIntro intro={data.intro} />
            <PersonaSampleBoard
                title={data.sampleBoard.title}
                columns={data.sampleBoard.columns}
            />
            <PersonaUseCases label={data.label} useCases={data.useCases} />
            <PersonaFAQSection label={data.label} faqs={data.faqs} />
            <PersonaClose
                headlineBefore={data.close.headlineBefore}
                headlineItalic={data.close.headlineItalic}
            />
        </>
    );
}
