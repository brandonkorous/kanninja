import Link from 'next/link';
import type { Metadata } from 'next';
import { PERSONA_ROUTES } from '@/config/marketing-routes';
import { buildPageMetadata } from '@/lib/seo';
import { JsonLd, breadcrumbLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA — for everyone',
    description:
        'kanNINJA is built for moms, dads, freelancers, students, agencies, weddings, moves, renovations, and the many ways the work shows up in real life.',
    path: '/for',
    ogTitle: 'A board for everyone',
    ogEyebrow: 'For',
    keywords: ['kanban for everyone', 'kanban use cases', 'kanban personal use', 'kanban for life'],
});

const SECTION_LABELS: Record<string, string> = {
    personal: 'For your life',
    creator: 'For solo and creator work',
    business: 'For teams and business',
};

const SECTION_ORDER: ('personal' | 'creator' | 'business')[] = [
    'personal',
    'creator',
    'business',
];

export default function ForIndexPage() {
    return (
        <>
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'For', path: '/for' },
                ])}
            />
            <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-16 lg:pt-32 lg:pb-24">
                <div className="max-w-3xl">
                    <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        For
                    </p>
                    <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                        A board for{' '}
                        <span className="hanko-brush italic text-primary">how you live.</span>
                    </h1>
                    <p className="hanko-rise hanko-rise-2 mt-10 text-lg leading-relaxed text-base-content/70">
                        Kanban started in software. We think the same shape — the work in
                        front of you, in the order you will finish it — fits almost everything
                        else, too. The household, the wedding, the freelance month, the
                        startup quarter.
                    </p>
                </div>
            </section>

            {SECTION_ORDER.map((category) => {
                const personasInCategory = PERSONA_ROUTES.filter(
                    (p) => p.category === category
                );
                if (personasInCategory.length === 0) return null;
                return (
                    <section key={category} className="border-t border-base-300">
                        <div className="container mx-auto px-6 md:px-12 lg:px-16 py-20 lg:py-24">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                {SECTION_LABELS[category]}
                            </p>
                            <ul className="hanko-scroll-rise mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
                                {personasInCategory.map((p) => (
                                    <li key={p.slug}>
                                        <Link
                                            href={`/for/${p.slug}`}
                                            className="block bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 p-6 transition-shadow focus-visible:shadow-focus"
                                        >
                                            <h2 className="font-display text-xl md:text-2xl font-medium tracking-tight">
                                                For{' '}
                                                <span className="italic text-primary">
                                                    {p.label.toLowerCase()}
                                                </span>
                                            </h2>
                                            <p className="mt-3 text-sm font-mono uppercase tracking-widest text-base-content/40">
                                                Read the page &rarr;
                                            </p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                );
            })}
        </>
    );
}
