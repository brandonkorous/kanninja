'use client';

import { WizeLensProvider } from '@wizeworks/lens-react';
import { useSyncExternalStore } from 'react';

// WizeLens in the browser: page loads, React renders, fetches and errors, sent
// to this app's own server, which forwards them with its traces.
//
//   1. On only when this page's server runs WizeLens. Such a server names its
//      trace in the document's Server-Timing header, so the check needs no
//      build flag and can never post spans to a server that does not take them.
//
//   2. Calls to the API (NEXT_PUBLIC_API_URL) carry a traceparent header, so
//      the browser's fetch and the API's request are one trace. The API allows
//      that header in its CORS list (backend/src/plugins/cors.ts).
//
//   3. The HUD shows in development only. In production nothing is drawn.

const DEVELOPMENT = process.env.NODE_ENV === 'development';
const API_ORIGIN = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001').origin;

// The navigation entry never changes after load, so there is nothing to subscribe to.
const noSubscribe = () => () => undefined;

/** True when the server that rendered this page traces it (`wl-trace` in Server-Timing). */
export function serverTraces(): boolean {
    const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
    return nav?.serverTiming?.some((entry) => entry.name === 'wl-trace') ?? false;
}

/** This app's own server and the API get a traceparent; third parties never do. */
function propagateTo(url: URL): boolean {
    return url.origin === window.location.origin || url.origin === API_ORIGIN;
}

export function WizeLens() {
    const enabled = useSyncExternalStore(noSubscribe, serverTraces, () => false);
    return <WizeLensProvider enabled={enabled} hud={DEVELOPMENT} propagateTo={propagateTo} />;
}
