import Link from 'next/link';
import type { Metadata } from 'next';
import { COMPARISON_ROUTES } from '@/config/marketing-routes';
import { buildPageMetadata } from '@/lib/seo';
import { JsonLd, breadcrumbLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildPageMetadata({
    title: 'Compare kanNINJA',
    description:
        'Honest comparisons of kanNINJA against the tools you might already use — Trello, Asana, Monday, ClickUp, Notion, Linear.',
    path: '/vs',
    ogTitle: 'Compare kanNINJA',
    ogEyebrow: 'Comparisons',
    keywords: ['kanban comparison', 'project management comparison', 'kanNINJA alternatives'],
});

export default function VsIndexPage() {
    return (
        <>
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'Compare', path: '/vs' },
                ])}
            />
            <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
                <div className="max-w-3xl">
                    <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        Compare
                    </p>
                    <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                        Honest about{' '}
                        <span className="hanko-brush italic text-primary">where each tool wins.</span>
                    </h1>
                    <p className="hanko-rise hanko-rise-2 mt-10 text-lg leading-relaxed text-base-content/70">
                        We would rather you use the right tool than the one we sell. Each
                        comparison is honest about what the other tool does better — and
                        where kanNINJA earns its place.
                    </p>
                </div>

                <ul className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                    {COMPARISON_ROUTES.map((route) => (
                        <li key={route.slug}>
                            <Link
                                href={`/vs/${route.slug}`}
                                className="block bg-base-100 rounded-lg shadow-e1 hover:shadow-e2 p-8 transition-shadow focus-visible:shadow-focus"
                            >
                                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                    Comparison
                                </p>
                                <h2 className="mt-4 font-display text-2xl md:text-3xl font-medium tracking-tight">
                                    kanNINJA{' '}
                                    <span className="italic text-primary">vs {route.competitor}</span>
                                </h2>
                                <p className="mt-3 text-sm font-mono uppercase tracking-widest text-base-content/40">
                                    Read the comparison &rarr;
                                </p>
                            </Link>
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}
