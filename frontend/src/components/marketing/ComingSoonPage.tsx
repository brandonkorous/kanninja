import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

// Reusable "coming soon" page for marketing stubs that aren't built yet.
// Pages that have real content (changelog, status, brand) don't use this —
// they ship actual content. This is only for the real "not yet" pages where
// the honest answer is "we haven't built this."
//
// The Hanko voice version of "coming soon" is restrained: one eyebrow, one
// display headline, one short body, and a way back. No countdown timers,
// no newsletter signups, no "stay tuned!"

export function ComingSoonPage({
    eyebrow,
    headlineBefore,
    headlineItalic,
    body,
}: {
    eyebrow: string;
    headlineBefore: string;
    headlineItalic: string;
    body: string;
}) {
    return (
        <section className="container mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-32 lg:pt-32 lg:pb-40">
            <div className="max-w-3xl">
                <p className="hanko-rise hanko-eyebrow text-eyebrow font-mono uppercase tracking-widest text-primary">
                    {eyebrow}
                </p>
                <h1 className="hanko-rise hanko-rise-1 mt-12 font-display text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-base-content">
                    {headlineBefore}{' '}
                    <span className="hanko-brush italic text-primary">{headlineItalic}</span>
                </h1>
                <p className="hanko-rise hanko-rise-2 mt-10 max-w-2xl text-lg leading-relaxed text-base-content/70">
                    {body}
                </p>
                <div className="hanko-rise hanko-rise-3 mt-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-base-content/60 hover:text-base-content focus-visible:shadow-focus rounded-sm px-2 py-2 transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
                        Back home
                    </Link>
                </div>
            </div>
        </section>
    );
}
