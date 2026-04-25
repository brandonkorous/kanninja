'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useConsent, type ConsentChoice } from '@/providers/ConsentProvider';
import { Checkbox } from '@/components/ui/checkbox';

// Granular consent dialog. Mirrors the categories in /cookies §02 — necessary
// is shown disabled-on so the user understands it's not optional, and the two
// optional categories use Hanko Checkbox primitives.
//
// Mirrors the native <dialog> pattern from confirm-dialog.tsx so the browser
// provides focus trap, Escape-to-cancel, body scroll lock, and focus return.
//
// "Save preferences" applies the working state. "Accept all" overrides the
// working state and applies analytics+sessionReplay = accepted in one click,
// matching the banner shortcut.

export function CookiePreferencesDialog() {
    const {
        consent,
        preferencesOpen,
        closePreferences,
        setConsent,
        acceptAll,
    } = useConsent();
    const titleId = useId();
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [analytics, setAnalytics] = useState<ConsentChoice>(consent.analytics);
    const [sessionReplay, setSessionReplay] = useState<ConsentChoice>(
        consent.sessionReplay,
    );

    // Reset working state to the live consent every time the dialog opens so
    // a previous unsaved fiddle doesn't leak into the next session.
    useEffect(() => {
        if (preferencesOpen) {
            setAnalytics(consent.analytics);
            setSessionReplay(consent.sessionReplay);
        }
    }, [preferencesOpen, consent.analytics, consent.sessionReplay]);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (preferencesOpen && !dialog.open) {
            dialog.showModal();
        } else if (!preferencesOpen && dialog.open) {
            dialog.close();
        }
    }, [preferencesOpen]);

    function handleSave() {
        setConsent({ analytics, sessionReplay }, 'preferences');
        closePreferences();
    }

    function handleAcceptAll() {
        acceptAll('preferences');
        closePreferences();
    }

    return (
        <dialog
            ref={dialogRef}
            className="modal"
            aria-labelledby={titleId}
            onClose={closePreferences}
        >
            <div className="modal-box max-w-xl">
                <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                    Cookie preferences
                </p>
                <h2
                    id={titleId}
                    className="font-display text-2xl font-medium tracking-tight mt-2"
                >
                    Decide what we can use.
                </h2>
                <p className="mt-3 text-sm text-base-content/70 leading-relaxed">
                    Necessary cookies stay on so the service can run. The
                    other two are yours to choose.
                </p>

                <div className="mt-8 space-y-6">
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
                        hint="Anonymized page views and events via Google Analytics 4. Helps us see which features matter."
                    />
                    <Checkbox
                        checked={sessionReplay === 'accepted'}
                        onChange={(e) =>
                            setSessionReplay(
                                e.target.checked ? 'accepted' : 'rejected',
                            )
                        }
                        label={<span className="font-medium">Session replay</span>}
                        hint="Anonymized recordings via Microsoft Clarity. Form input, passwords, and card content are masked by default."
                    />
                </div>

                <div className="modal-action flex flex-col-reverse gap-2 sm:flex-row sm:justify-between sm:items-center mt-10">
                    <button
                        type="button"
                        className="btn btn-ghost focus-visible:shadow-focus"
                        onClick={closePreferences}
                    >
                        Cancel
                    </button>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                        <button
                            type="button"
                            className="btn btn-secondary focus-visible:shadow-focus"
                            onClick={handleSave}
                        >
                            Save preferences
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary focus-visible:shadow-focus"
                            onClick={handleAcceptAll}
                        >
                            Accept all
                        </button>
                    </div>
                </div>
            </div>
            <form method="dialog" className="modal-backdrop">
                <button type="submit" aria-label="Close">
                    close
                </button>
            </form>
        </dialog>
    );
}
