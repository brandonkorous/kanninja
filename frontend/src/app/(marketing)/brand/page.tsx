import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faDownload } from '@fortawesome/free-solid-svg-icons';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Brand',
    description: 'The kanNINJA brand kit: one vermillion stamp, three fonts, warm neutrals, a few rules.',
    path: '/brand',
    ogTitle: 'One stamp. One thousand uses.',
    ogEyebrow: 'kanNINJA · Brand',
});

// Quick-reference brand page. Not the full Hanko design system — that lives
// in Paper and in the SKILL.md. This is the public-facing version: the seal,
// the core colors, the fonts, and the rules we won't bend.
const COLORS = [
    { name: 'Vermillion', hex: '#E0432F', role: 'The seal. One per screen.' },
    { name: 'Sumi', hex: '#0E0F12', role: 'Primary text. The ink.' },
    { name: 'Washi', hex: '#F8F4EC', role: 'Cream paper. The page.' },
    { name: 'Snow', hex: '#FBFAF6', role: 'Elevated surfaces. Cards, modals.' },
];

export default function BrandPage() {
    return (
        <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
                <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Brand · Hanko
                </p>
                <h1 className="mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                    One stamp.{' '}
                    <span className="hanko-brush italic text-primary">One thousand uses.</span>
                </h1>
                <p className="mt-10 text-lg leading-relaxed text-base-content/70">
                    The short version of our brand system. For the full thing, the source
                    files live in our repo.
                </p>
            </div>

            {/* The seal */}
            <div className="mt-20 max-w-3xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    The seal
                </p>
                <h2 className="mt-6 font-display text-3xl md:text-4xl font-medium tracking-tight">
                    忍 — nin.
                </h2>
                <p className="mt-4 text-base text-base-content/70 max-w-2xl">
                    The character means endure, persevere, patience — the same character
                    that gives 忍者 (ninja) its name. 心 (heart) beneath 刃 (blade):
                    discipline as the act of holding steady.
                </p>
                <div className="mt-10 flex flex-wrap gap-6 items-center">
                    <img
                        src="/brand/nin-icon.svg"
                        alt="kanNINJA seal"
                        width={128}
                        height={128}
                        className="h-32 w-32"
                    />
                    <img
                        src="/brand/nin-icon-night.svg"
                        alt="kanNINJA seal, night variant"
                        width={128}
                        height={128}
                        className="h-32 w-32"
                    />
                    <a
                        href="/brand/nin-icon.svg"
                        download
                        className="btn btn-outline btn-secondary btn-sm"
                    >
                        <FontAwesomeIcon icon={faDownload} aria-hidden="true" className="mr-2" />
                        Download SVG
                    </a>
                </div>
            </div>

            {/* Colors */}
            <div className="mt-20 max-w-3xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Colors
                </p>
                <h2 className="mt-6 font-display text-3xl md:text-4xl font-medium tracking-tight">
                    Four core{' '}
                    <span className="italic text-primary">pigments.</span>
                </h2>
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {COLORS.map((c) => (
                        <div
                            key={c.name}
                            className="bg-base-100 rounded-lg shadow-e1 p-6 flex items-start gap-4"
                        >
                            <div
                                className="w-16 h-16 rounded-md shrink-0 border border-base-300"
                                style={{ backgroundColor: c.hex }}
                            />
                            <div className="min-w-0">
                                <p className="font-display text-lg font-medium tracking-tight">
                                    {c.name}
                                </p>
                                <p className="font-mono text-xs text-base-content/50 mt-1">
                                    {c.hex}
                                </p>
                                <p className="text-sm text-base-content/70 mt-2 leading-relaxed">
                                    {c.role}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Type */}
            <div className="mt-20 max-w-3xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Type
                </p>
                <h2 className="mt-6 font-display text-3xl md:text-4xl font-medium tracking-tight">
                    Three families.{' '}
                    <span className="italic text-primary">Never more.</span>
                </h2>
                <div className="mt-10 space-y-6">
                    <div className="bg-base-100 rounded-lg shadow-e1 p-8">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                            Display · Fraunces
                        </p>
                        <p className="mt-4 font-display text-5xl font-medium tracking-tight">
                            Discipline, <span className="italic text-primary">made visible.</span>
                        </p>
                    </div>
                    <div className="bg-base-100 rounded-lg shadow-e1 p-8">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                            Body · Inter
                        </p>
                        <p className="mt-4 text-lg text-base-content/80 leading-relaxed">
                            The quick brown fox jumps over the lazy dog. Inter carries the
                            weight of everything the reader needs to understand.
                        </p>
                    </div>
                    <div className="bg-base-100 rounded-lg shadow-e1 p-8">
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                            Mono · JetBrains Mono
                        </p>
                        <p className="mt-4 font-mono text-sm text-base-content/80">
                            const kata = practice.sharpen();
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-20">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                >
                    <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                    Back home
                </Link>
            </div>
        </section>
    );
}
