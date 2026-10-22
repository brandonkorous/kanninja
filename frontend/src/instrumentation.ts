// Next runs register() once, when a server starts.
//
// WizeLens: traces each request to this Next.js server, with Next's own render,
// route handler, and fetch spans inside it; calls to the API join the same
// trace. On in development (dashboard at /_wizelens on this app). In production
// only with WIZELENS_ENABLED=true (k8s/configmap.yaml), and then SEND-ONLY:
// traces go to WIZELENS_HUB with WIZELENS_HUB_TOKEN, and `/_wizelens` serves
// nothing but the browser span intake.
//
// Node.js runtime only: the add-on needs node:http. A failure to start is
// logged and never stops the app: tracing is not worth an outage.

import type { Instrumentation } from 'next';

const ENABLED = process.env.NODE_ENV === 'development' || process.env.WIZELENS_ENABLED === 'true';

export async function register() {
    // The runtime check must WRAP the import: an early return would leave it in
    // the edge build, which has no node:http (the middleware makes one).
    if (process.env.NEXT_RUNTIME === 'nodejs' && ENABLED) {
        try {
            const { registerWizeLens } = await import('@wizeworks/lens-node/next');
            registerWizeLens({ serviceName: 'kanninja-frontend', enabled: true });
        } catch (err) {
            console.warn('[wizelens] tracing did not start', err);
        }
    }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
    if (process.env.NEXT_RUNTIME === 'nodejs' && ENABLED) {
        try {
            const { onRequestError } = await import('@wizeworks/lens-node/next');
            onRequestError(...args);
        } catch {
            // Tracing is optional: the error itself is still Next's to report.
        }
    }
};
