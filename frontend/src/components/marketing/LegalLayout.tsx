import Link from 'next/link';
import type { ReactNode } from 'react';

// Shared shell for legal pages (privacy, terms, cookies, dpa, aup, subprocessors,
// refund). Hanko voice: calm, plain English, hairlines, generous breathing room.
// Page chrome lives here; per-page content is passed in as `sections`.
//
// Visual rhythm:
//   1. Eyebrow + display hero (matches About / ComingSoon hero pattern)
//   2. Intro paragraph + mono "last updated" token
//   3. Numbered TOC — internal anchors only
//   4. Sections — eyebrow numeral + Fraunces title + Inter body
//   5. Footer strip with contact mailto + back-home link
//
// Each section renders its `body` inside a styled prose container so individual
// page files can drop in plain JSX without re-deriving link/list/strong styles.

export type LegalSectionData = {
    id: string;
    number: string;
    title: string;
    body: ReactNode;
};

export type LegalLayoutProps = {
    eyebrow: string;
    headlineBefore: string;
    headlineItalic: string;
    lastUpdatedISO: string;
    effectiveISO?: string;
    intro: ReactNode;
    sections: LegalSectionData[];
    contactEmail?: string;
};

// Parse the ISO date as UTC then format in UTC so a YYYY-MM-DD value renders
// the same calendar day everywhere — without this, `new Date('2026-04-24')`
// is treated as UTC midnight and shifts to the previous day in any negative-
// offset timezone (e.g. April 23 in California).
const dateFmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
});

function formatDate(iso: string): string {
    return dateFmt.format(new Date(iso));
}

export function LegalLayout({
    eyebrow,
    headlineBefore,
    headlineItalic,
    lastUpdatedISO,
    effectiveISO,
    intro,
    sections,
    contactEmail = 'legal@kanninja.com',
}: LegalLayoutProps) {
    return (
        <>
            {/* Hero */}
            <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-16 lg:pt-32 lg:pb-20">
                <div className="max-w-3xl">
                    <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                        {eyebrow}
                    </p>
                    <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                        {headlineBefore}{' '}
                        <span className="hanko-brush italic text-primary">
                            {headlineItalic}
                        </span>
                    </h1>
                    <div className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                        {intro}
                    </div>
                    <p className="hanko-rise hanko-rise-3 mt-12 text-eyebrow font-mono uppercase tracking-widest text-base-content/50">
                        Last updated · {formatDate(lastUpdatedISO)}
                        {effectiveISO ? (
                            <>
                                <span className="mx-3 text-base-content/30">·</span>
                                Effective · {formatDate(effectiveISO)}
                            </>
                        ) : null}
                    </p>
                </div>
            </section>

            {/* TOC + Sections */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)] gap-12 lg:gap-20 max-w-5xl">
                        {/* TOC — sticky on desktop */}
                        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
                            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                Contents
                            </p>
                            <ol className="mt-6 space-y-3">
                                {sections.map((s) => (
                                    <li key={s.id} className="flex items-baseline gap-3 text-sm">
                                        <span className="font-mono text-base-content/40 tabular-nums">
                                            {s.number}
                                        </span>
                                        <Link
                                            href={`#${s.id}`}
                                            className="text-base-content/70 hover:text-base-content focus-visible:shadow-focus rounded-sm transition-colors"
                                        >
                                            {s.title}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </nav>

                        {/* Sections */}
                        <div className="space-y-16 lg:space-y-20">
                            {sections.map((s) => (
                                <article key={s.id} id={s.id} className="scroll-mt-24">
                                    <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                                        {s.number}
                                    </p>
                                    <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight text-base-content">
                                        {s.title}
                                    </h2>
                                    <div className="legal-prose mt-8 max-w-2xl text-base leading-relaxed text-base-content/80 space-y-5">
                                        {s.body}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer strip — contact + back home */}
            <section className="border-t border-base-300">
                <div className="container mx-auto px-6 md:px-12 lg:px-16 py-16 lg:py-20">
                    <div className="max-w-3xl">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Questions
                        </p>
                        <p className="mt-6 text-lg leading-relaxed text-base-content/80">
                            Email{' '}
                            <a
                                href={`mailto:${contactEmail}`}
                                className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary focus-visible:shadow-focus rounded-sm"
                            >
                                {contactEmail}
                            </a>
                            . A human reads it.
                        </p>
                        <Link
                            href="/"
                            className="mt-10 inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                        >
                            ← Back home
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
