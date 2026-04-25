'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

// Single source of truth for cookie / tracking consent across the app.
//
// What it covers:
//   · necessary  — always on (auth, theme, billing fraud-prevention)
//   · analytics  — Google Analytics 4 (page views, events)
//   · sessionReplay — Microsoft Clarity (session recordings, heatmaps)
//
// Persistence:
//   · localStorage key `kanninja-consent-v1`. Bump VERSION to force re-prompt.
//   · `storage` event listener keeps multiple tabs in sync.
//
// CCPA compliance:
//   · `navigator.globalPrivacyControl` is honored as an opt-out signal — if a
//     visitor arrives with GPC enabled and no stored consent, we record both
//     optional categories as `rejected` and skip the banner entirely.
//   · The banner / preferences dialog / privacy-choices page each call into
//     this provider so opt-outs honored in one surface apply to all.

export type ConsentChoice = 'accepted' | 'rejected';

export type ConsentCategories = {
    analytics: ConsentChoice;
    sessionReplay: ConsentChoice;
};

export type ConsentReason = 'banner' | 'preferences' | 'page' | 'gpc';

export type ConsentState = ConsentCategories & {
    resolvedAt: string;
    version: number;
    reason: ConsentReason;
};

const STORAGE_KEY = 'kanninja-consent-v1';
const VERSION = 1;

type ConsentContextValue = {
    consent: ConsentCategories;
    isResolved: boolean;
    reason: ConsentReason | null;
    resolvedAt: string | null;
    setConsent: (next: Partial<ConsentCategories>, reason?: ConsentReason) => void;
    acceptAll: (reason?: ConsentReason) => void;
    rejectNonEssential: (reason?: ConsentReason) => void;
    openPreferences: () => void;
    closePreferences: () => void;
    preferencesOpen: boolean;
    hydrated: boolean;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readStorage(): ConsentState | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as ConsentState;
        if (parsed?.version !== VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeStorage(state: ConsentState) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage may be unavailable (private mode, quota). Treat as
        // session-only consent — the banner will reappear on next visit.
    }
}

function detectGPC(): boolean {
    if (typeof navigator === 'undefined') return false;
    return (navigator as unknown as { globalPrivacyControl?: boolean })
        .globalPrivacyControl === true;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ConsentState | null>(null);
    const [hydrated, setHydrated] = useState(false);
    const [preferencesOpen, setPreferencesOpen] = useState(false);

    // Hydrate from storage and apply GPC default. Runs once on the client.
    useEffect(() => {
        const stored = readStorage();
        if (stored) {
            setState(stored);
        } else if (detectGPC()) {
            const gpcState: ConsentState = {
                analytics: 'rejected',
                sessionReplay: 'rejected',
                resolvedAt: new Date().toISOString(),
                version: VERSION,
                reason: 'gpc',
            };
            writeStorage(gpcState);
            setState(gpcState);
        }
        setHydrated(true);
    }, []);

    // Cross-tab sync — react to consent changes made in another tab.
    useEffect(() => {
        function onStorage(e: StorageEvent) {
            if (e.key !== STORAGE_KEY) return;
            setState(readStorage());
        }
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const setConsent = useCallback(
        (next: Partial<ConsentCategories>, reason: ConsentReason = 'preferences') => {
            setState((prev) => {
                const merged: ConsentState = {
                    analytics: next.analytics ?? prev?.analytics ?? 'rejected',
                    sessionReplay:
                        next.sessionReplay ?? prev?.sessionReplay ?? 'rejected',
                    resolvedAt: new Date().toISOString(),
                    version: VERSION,
                    reason,
                };
                writeStorage(merged);
                return merged;
            });
        },
        [],
    );

    const acceptAll = useCallback(
        (reason: ConsentReason = 'banner') => {
            setConsent(
                { analytics: 'accepted', sessionReplay: 'accepted' },
                reason,
            );
        },
        [setConsent],
    );

    const rejectNonEssential = useCallback(
        (reason: ConsentReason = 'banner') => {
            setConsent(
                { analytics: 'rejected', sessionReplay: 'rejected' },
                reason,
            );
        },
        [setConsent],
    );

    const openPreferences = useCallback(() => setPreferencesOpen(true), []);
    const closePreferences = useCallback(() => setPreferencesOpen(false), []);

    const consent: ConsentCategories = {
        analytics: state?.analytics ?? 'rejected',
        sessionReplay: state?.sessionReplay ?? 'rejected',
    };

    const value: ConsentContextValue = {
        consent,
        isResolved: state !== null,
        reason: state?.reason ?? null,
        resolvedAt: state?.resolvedAt ?? null,
        setConsent,
        acceptAll,
        rejectNonEssential,
        openPreferences,
        closePreferences,
        preferencesOpen,
        hydrated,
    };

    return (
        <ConsentContext.Provider value={value}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent(): ConsentContextValue {
    const ctx = useContext(ConsentContext);
    if (!ctx) {
        throw new Error('useConsent must be used inside <ConsentProvider>');
    }
    return ctx;
}
