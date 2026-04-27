import type { Metadata } from 'next';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Changelog',
    description: 'What changed in kanNINJA, when, and why. Honest about the slope.',
    path: '/changelog',
    ogTitle: 'What changed, when, and why.',
    ogEyebrow: 'kanNINJA · Changelog',
});

// Each entry is a real release — date, version, a short title, and a few
// bullet changes. We write the "why" plainly. No marketing-speak, no
// "exciting new features". If there is nothing worth mentioning, we don't
// cut a release.
const ENTRIES: {
    version: string;
    date: string;
    title: string;
    changes: string[];
}[] = [
    {
        version: 'v0.1.0',
        date: '2026-04-09',
        title: 'The first public shape.',
        changes: [
            'Four marketing pages in the new Hanko voice and visual language.',
            'Custom auth surfaces — sign-in, sign-up, forgot-password, invite.',
            'The full kanban board with drag-and-drop, cards, lists, comments, checklists, labels, time tracking, and attachments.',
            'Twelve AI techniques gated to the Pro tier and above.',
            'Clans, presence, notifications, analytics, audit log.',
        ],
    },
];

export default function ChangelogPage() {
    return (
        <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
                <p className="hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Changelog
                </p>
                <h1 className="mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                    What we{' '}
                    <span className="hanko-brush italic text-primary">changed.</span>
                </h1>
                <p className="mt-10 text-lg leading-relaxed text-base-content/70">
                    We don't cut a release unless there is something worth telling you.
                </p>
            </div>

            <div className="mt-20 max-w-3xl space-y-16">
                {ENTRIES.map((entry) => (
                    <article
                        key={entry.version}
                        className="border-l-2 border-base-300 pl-8 relative"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-primary"
                        />
                        <div className="flex items-baseline gap-4">
                            <span className="font-mono text-sm text-primary tracking-tight">
                                {entry.version}
                            </span>
                            <span className="text-eyebrow font-mono uppercase tracking-widest text-base-content/40">
                                {entry.date}
                            </span>
                        </div>
                        <h2 className="mt-4 font-display text-3xl md:text-4xl font-medium tracking-tight">
                            {entry.title}
                        </h2>
                        <ul className="mt-6 space-y-3">
                            {entry.changes.map((change, i) => (
                                <li
                                    key={i}
                                    className="flex items-baseline gap-3 text-base leading-relaxed text-base-content/70"
                                >
                                    <span className="text-primary text-xs leading-none mt-1.5 shrink-0">
                                        ●
                                    </span>
                                    <span>{change}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                ))}
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
