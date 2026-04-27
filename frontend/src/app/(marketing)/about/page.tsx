import Link from 'next/link';
import type { Metadata } from 'next';
import { FourPrinciplesSection } from '@/components/marketing/FourPrinciplesSection';
import { buildPageMetadata } from '@/lib/seo';
import { JsonLd, breadcrumbLd } from '@/components/seo/JsonLd';

export const metadata: Metadata = buildPageMetadata({
    title: 'About',
    description:
        'We started kanNINJA because the boards we used at our last jobs were honest about everything except how much our work was hurting.',
    path: '/about',
    ogTitle: 'Built by people who needed it.',
    ogEyebrow: 'kanNINJA · About',
});

const TODAY_WORKING = [
    'The kanban itself, the way it should work',
    'Real-time presence and the clan system',
    'Twelve AI techniques, gated to the Pro tier',
    'The brand system, top to bottom',
];

const TODAY_NOT_YET = [
    'Import from Trello, Linear, Asana',
    'Native mobile apps (the web is mobile-friendly)',
    'Self-hosting',
    'A public API',
];

export default function AboutPage() {
    return (
        <>
            <JsonLd
                data={breadcrumbLd([
                    { name: 'Home', path: '/' },
                    { name: 'About', path: '/about' },
                ])}
            />
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-24 lg:pt-32 lg:pb-32">
                    <div className="max-w-4xl">
                        <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            About
                        </p>
                        <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                            Built by people who{' '}
                            <span className="hanko-brush italic text-primary">needed it.</span>
                        </h1>
                        <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                            kanNINJA started as a tool for our own work. It is still that — and
                            now yours.
                        </p>
                    </div>
                </div>
            </section>

            {/* Origin story — the full version of the founder paragraph that the
                landing page only teases. Body Inter at large size; Fraunces is
                reserved for the closing brand line. */}
            <section className="border-y border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="hanko-scroll-rise max-w-3xl space-y-8 text-xl md:text-2xl leading-snug text-base-content">
                        <p>
                            We started kanNINJA because the boards we used at our last jobs
                            were honest about everything except how much our work was hurting.
                        </p>
                        <p>
                            Every other tool we tried wanted to be the hero of the page. More
                            features. Bigger dashboards. AI that promised to do the thinking
                            for us. We wanted the opposite. A tool that watched, then helped,
                            then got out of the way.
                        </p>
                        <p>So we built one.</p>
                        <p>
                            kanNINJA is what happens when you treat productivity like a martial
                            art instead of a metric. You practice. You sharpen one technique at
                            a time. You finish the kata before you start the next one. The
                            wins compound — but quietly, the way real wins always do.
                        </p>
                        <p className="font-display text-3xl md:text-4xl font-medium tracking-tight pt-4">
                            <span className="italic text-primary">Discipline, made visible.</span>
                        </p>
                    </div>
                </div>
            </section>

            {/* The four principles — third quartet rhyme */}
            <FourPrinciplesSection />

            {/* Today — honest about where we are */}
            <section>
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-24 lg:py-32">
                    <div className="max-w-3xl">
                        <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                            Where we are
                        </p>
                        <h2 className="mt-8 font-display text-4xl md:text-5xl font-medium tracking-tight">
                            Early. <span className="italic text-primary">Honest about it.</span>
                        </h2>
                        <p className="mt-6 max-w-xl text-lg leading-relaxed text-base-content/70">
                            We say what works and what does not yet. We would want to know.
                        </p>
                    </div>
                    <div className="hanko-scroll-rise mt-20 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20 max-w-5xl">
                        <div>
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                Working today
                            </p>
                            <ul className="mt-8 space-y-5">
                                {TODAY_WORKING.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-baseline gap-4 text-base md:text-lg text-base-content"
                                    >
                                        <span className="text-primary text-xs leading-none mt-1">
                                            ●
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                Not yet
                            </p>
                            <ul className="mt-8 space-y-5">
                                {TODAY_NOT_YET.map((item) => (
                                    <li
                                        key={item}
                                        className="flex items-baseline gap-4 text-base md:text-lg text-base-content/60"
                                    >
                                        <span className="text-base-content/30 text-xs leading-none mt-1">
                                            ○
                                        </span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing — sumi panel with the seal */}
            <section className="bg-neutral text-neutral-content">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-32 lg:py-40">
                    <div className="hanko-scroll-rise grid grid-cols-1 md:grid-cols-[1fr_auto] gap-16 md:gap-24 lg:gap-32 items-center">
                        <div className="max-w-2xl">
                            <p className="hanko-eyebrow text-eyebrow font-mono uppercase text-primary">
                                Begin
                            </p>
                            <h2 className="mt-8 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight">
                                Use what we <span className="italic text-primary">use.</span>
                            </h2>
                            <p className="mt-8 max-w-xl text-lg leading-relaxed text-neutral-content/70">
                                Free until you outgrow it. Most people never do.
                            </p>
                            <Link
                                href="/sign-up"
                                className="mt-12 inline-flex btn btn-primary focus-visible:shadow-focus"
                            >
                                Start a kata
                            </Link>
                        </div>
                        <img
                            src="/brand/nin-icon.svg"
                            alt="kanNINJA vermillion 忍 seal — the brand stamp"
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
