'use client';

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbtack, faXmark } from '@fortawesome/free-solid-svg-icons';
import { usePinnedHighlights } from '@/hooks/use-pinned-highlights';

// Lives on the dashboard. Empty until the user pins a highlight from a
// daily briefing. Stays out of the way when there's nothing to show.

export function PinnedHighlights() {
    const { pins, unpin } = usePinnedHighlights();

    if (pins.length === 0) return null;

    return (
        <section
            aria-label="Pinned highlights"
            className="bg-base-100 rounded-lg shadow-e1 p-8 mb-12"
        >
            <div className="flex items-baseline justify-between gap-4 mb-6">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    <FontAwesomeIcon
                        icon={faThumbtack}
                        aria-hidden="true"
                        className="mr-2"
                    />
                    Pinned from briefings
                </p>
                <Link
                    href="/ai-hub"
                    className="text-eyebrow font-mono uppercase tracking-widest text-base-content/50 hover:text-primary transition-colors"
                >
                    Run a briefing →
                </Link>
            </div>
            <ul className="space-y-4">
                {pins.map((pin, i) => (
                    <li
                        key={pin.id}
                        className="flex items-start gap-4 group"
                    >
                        <span className="font-mono text-xs text-base-content/30 mt-1 tabular-nums">
                            {String(i + 1).padStart(2, '0')}
                        </span>
                        <p className="flex-1 text-base text-base-content/80 leading-relaxed">
                            {pin.text}
                        </p>
                        <button
                            type="button"
                            onClick={() => unpin(pin.id)}
                            aria-label="Unpin highlight"
                            className="text-base-content/30 hover:text-error transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:shadow-focus rounded p-1"
                        >
                            <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
