'use client';

import Link from 'next/link';
import { useConsent } from '@/providers/ConsentProvider';

// Bottom-of-viewport consent banner. Shown only after hydration and only if
// the visitor hasn't resolved consent yet (no stored choice, no GPC signal).
//
// Hanko surface stack: Snow card on Washi page, hairline border, e3
// elevation, generous p-6/p-8. One vermillion stamp (Accept all). The other
// two actions are ink and ghost so the seal stays scarce.
//
// Layout: anchored to bottom with a max width and side gutter so it never
// fills the entire viewport on desktop — it should feel like a notebook page
// laid on top of the screen, not a modal blocking the experience.

export function CookieBanner() {
    const {
        hydrated,
        isResolved,
        acceptAll,
        rejectNonEssential,
        openPreferences,
    } = useConsent();

    // Avoid hydration mismatch — render nothing until we've read storage and
    // applied any GPC signal. After that, render only when unresolved.
    if (!hydrated || isResolved) return null;

    return (
        <div
            role="region"
            aria-label="Cookie consent"
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-3xl"
        >
            <div className="bg-base-100 border border-base-300 rounded-xl shadow-e4 p-6 md:p-8">
                <div className="flex flex-col gap-6 md:gap-8">
                    <div>
                        <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                            Cookies
                        </p>
                        <p className="mt-3 text-base leading-relaxed text-base-content/80">
                            We use a few necessary cookies to keep the service
                            running. With your permission, we also use
                            anonymized analytics and session replay so we can
                            see what's broken. Your call.{' '}
                            <Link
                                href="/cookies"
                                className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary focus-visible:shadow-focus rounded-sm"
                            >
                                Read the cookie policy
                            </Link>
                            .
                        </p>
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                        <button
                            type="button"
                            onClick={openPreferences}
                            className="btn btn-ghost btn-sm self-start sm:self-auto focus-visible:shadow-focus"
                        >
                            Customize
                        </button>
                        <div className="flex flex-col-reverse sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => rejectNonEssential('banner')}
                                className="btn btn-secondary focus-visible:shadow-focus"
                            >
                                Necessary only
                            </button>
                            <button
                                type="button"
                                onClick={() => acceptAll('banner')}
                                className="btn btn-primary focus-visible:shadow-focus"
                            >
                                Accept all
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
