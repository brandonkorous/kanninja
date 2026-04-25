'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { useConsent } from '@/providers/ConsentProvider';

// Google Analytics 4, gated on analytics consent. Same contract as
// ClarityScript — see that file for the full rationale. The summary:
//
//   1. gtag.js is NEVER loaded unless the visitor has explicitly granted
//      analytics consent.
//   2. On revoke, we set the documented `ga-disable-<id>` flag, push a
//      consent update of `analytics_storage: 'denied'`, and wipe the GA
//      cookies. The <Script> tag stays in the DOM so a re-grant can flip
//      the flag back without reloading the SDK.
//   3. We do NOT use Google Consent Mode v2's cookieless-pings feature —
//      that would send modeled-conversion data even when consent is
//      denied, which contradicts kanNINJA's "we don't track without
//      permission" stance.
//
// Measurement ID comes from NEXT_PUBLIC_GA_MEASUREMENT_ID. Format is
// G-XXXXXXXXXX (per analytics.google.com → Admin → Data Streams).

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

function sanitizeMeasurementId(raw: string | undefined): string | null {
    if (!raw) return null;
    const cleaned = raw.replace(/[^A-Za-z0-9_-]/g, '');
    return cleaned.startsWith('G-') && cleaned.length > 2 ? cleaned : null;
}

const MEASUREMENT_ID = sanitizeMeasurementId(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
);

// Cookie names GA4 sets. `_ga_<container-suffix>` is parameterized; the rest
// are constants. We clear all of them on revoke. Cookies are set on the
// effective TLD so we wipe both the current host and the eTLD+1 if present.
const GA_CONSTANT_COOKIES = [
    '_ga',
    '_gid',
    '_gat',
    '_gcl_au',
    '_gcl_aw',
    '_gcl_dc',
    '_gcl_gb',
];

function clearGaCookies(measurementId: string) {
    if (typeof document === 'undefined') return;
    const host = window.location.hostname;
    const domains = new Set<string>([host, `.${host}`]);
    const parts = host.split('.');
    if (parts.length > 2) {
        domains.add(`.${parts.slice(-2).join('.')}`);
    }
    const idSuffix = measurementId.replace(/^G-/, '');
    const names = [...GA_CONSTANT_COOKIES, `_ga_${idSuffix}`];
    for (const name of names) {
        document.cookie = `${name}=; Max-Age=0; path=/`;
        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}`;
        }
    }
}

function setGaDisableFlag(measurementId: string, disabled: boolean) {
    if (typeof window === 'undefined') return;
    const flag = `ga-disable-${measurementId}`;
    (window as unknown as Record<string, boolean>)[flag] = disabled;
}

export function GoogleAnalyticsScript() {
    const { consent, hydrated } = useConsent();
    const allow = consent.analytics === 'accepted';

    const [scriptMounted, setScriptMounted] = useState(false);
    const previousAllowRef = useRef<boolean | null>(null);

    useEffect(() => {
        if (!hydrated || !MEASUREMENT_ID) return;

        const previous = previousAllowRef.current;

        if (allow && !scriptMounted) {
            setScriptMounted(true);
        } else if (previous === true && !allow) {
            try {
                window.gtag?.('consent', 'update', {
                    analytics_storage: 'denied',
                });
                setGaDisableFlag(MEASUREMENT_ID, true);
            } catch {
                // gtag not loaded — nothing to update.
            }
            clearGaCookies(MEASUREMENT_ID);
        } else if (previous === false && allow && scriptMounted) {
            try {
                setGaDisableFlag(MEASUREMENT_ID, false);
                window.gtag?.('consent', 'update', {
                    analytics_storage: 'granted',
                });
            } catch {
                // gtag not loaded — should not happen if scriptMounted.
            }
        }

        previousAllowRef.current = allow;
    }, [allow, hydrated, scriptMounted]);

    if (!MEASUREMENT_ID || !scriptMounted) return null;

    return (
        <>
            <Script
                id="ga-loader"
                strategy="afterInteractive"
                src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
            />
            <Script id="ga-init" strategy="afterInteractive">
                {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${MEASUREMENT_ID}', { anonymize_ip: true });`}
            </Script>
        </>
    );
}
