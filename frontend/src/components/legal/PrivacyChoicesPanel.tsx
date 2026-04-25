'use client';

import { useEffect, useState } from 'react';
import { useConsent, type ConsentChoice } from '@/providers/ConsentProvider';
import { Checkbox } from '@/components/ui/checkbox';

// Inline opt-out panel for the /privacy-choices page. Same categories as the
// CookiePreferencesDialog but rendered as a card embedded in the page body —
// this is what the CCPA "Do Not Sell or Share" footer link surfaces.
//
// Working state mirrors the live consent on first paint and on every
// reconciliation, so the controls always reflect what is currently saved.
// Saving is explicit (button) rather than auto-apply on each click — keeps
// the user in control of when their settings change.

const dateFmt = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

export function PrivacyChoicesPanel() {
    const { consent, hydrated, isResolved, reason, resolvedAt, setConsent } =
        useConsent();
    const [analytics, setAnalytics] = useState<ConsentChoice>(consent.analytics);
    const [sessionReplay, setSessionReplay] = useState<ConsentChoice>(
        consent.sessionReplay,
    );
    const [savedAt, setSavedAt] = useState<string | null>(null);

    useEffect(() => {
        setAnalytics(consent.analytics);
        setSessionReplay(consent.sessionReplay);
    }, [consent.analytics, consent.sessionReplay]);

    function handleSave() {
        setConsent({ analytics, sessionReplay }, 'page');
        setSavedAt(new Date().toISOString());
    }

    const isDirty =
        analytics !== consent.analytics || sessionReplay !== consent.sessionReplay;

    return (
        <div className="bg-base-100 border border-base-300 rounded-lg shadow-e1 p-6 md:p-8">
            <div className="space-y-6">
                <Checkbox
                    checked
                    disabled
                    readOnly
                    label={
                        <span>
                            <span className="font-medium">Necessary</span>{' '}
                            <span className="text-base-content/60">
                                — always on
                            </span>
                        </span>
                    }
                    hint="Authentication, theme, billing fraud prevention. Required for the service to work."
                />
                <Checkbox
                    checked={analytics === 'accepted'}
                    onChange={(e) =>
                        setAnalytics(e.target.checked ? 'accepted' : 'rejected')
                    }
                    label={<span className="font-medium">Analytics</span>}
                    hint="Anonymized page views and events via Google Analytics 4."
                />
                <Checkbox
                    checked={sessionReplay === 'accepted'}
                    onChange={(e) =>
                        setSessionReplay(
                            e.target.checked ? 'accepted' : 'rejected',
                        )
                    }
                    label={<span className="font-medium">Session replay</span>}
                    hint="Anonymized session recordings via Microsoft Clarity. Form input, passwords, and card content are masked by default."
                />
            </div>

            <div className="mt-8 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-xs font-mono uppercase tracking-widest text-base-content/50 min-h-[1rem]">
                    {!hydrated
                        ? null
                        : reason === 'gpc'
                          ? 'Global Privacy Control honored'
                          : savedAt
                            ? `Saved · ${dateFmt.format(new Date(savedAt))}`
                            : isResolved && resolvedAt
                              ? `Last updated · ${dateFmt.format(new Date(resolvedAt))}`
                              : 'No choice on record'}
                </div>
                <button
                    type="button"
                    className="btn btn-primary focus-visible:shadow-focus"
                    onClick={handleSave}
                    disabled={!isDirty}
                >
                    Save my choices
                </button>
            </div>
        </div>
    );
}
