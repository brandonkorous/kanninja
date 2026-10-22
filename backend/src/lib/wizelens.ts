// WizeLens: request tracing (timeline, SQL, outgoing fetches to Stripe, Azure
// and Resend, errors, logs).
//
// On in development, with its dashboard at http://localhost:3001/_wizelens.
// In production it runs only with WIZELENS_ENABLED=true (k8s/configmap.yaml),
// and then it is SEND-ONLY: traces go to WIZELENS_HUB (WizeLens Cloud) with
// WIZELENS_HUB_TOKEN, sampled by WIZELENS_SAMPLE_RATE, and `/_wizelens` serves
// no dashboard or read API. Off in tests and everywhere else.
//
// SQL: every query of the app's Drizzle client (src/db/index.ts, on postgres.js),
// Better Auth's included, as "drizzle" spans inside the request that ran it.
// Queries outside a request are not traced. Only the API server imports this
// module, so scripts and the reconcile-seats CronJob share the client untraced.
//
// index.ts imports this module FIRST, so the HTTP and fetch hooks are in place
// before any other module makes a client.

import { createWizeLens, instrumentDrizzle, wizelensFastify, type WizeLens } from '@wizeworks/lens-node';
import { env } from '../config/env.js';
import { db } from '../db/index.js';

const enabled = env.NODE_ENV === 'development' || process.env.WIZELENS_ENABLED === 'true';

function start(): WizeLens {
  try {
    return createWizeLens({ serviceName: 'kanninja-backend', enabled });
  } catch (err) {
    // Tracing is not worth an outage: log it and run untraced.
    console.warn('[wizelens] tracing did not start', err);
    return createWizeLens({ serviceName: 'kanninja-backend', enabled: false });
  }
}

/** Trace the app client's SQL. Off means nothing is patched; a failure leaves queries untraced. */
function traceDb(wizelens: WizeLens): void {
  if (!wizelens.enabled) return;
  try {
    if (!instrumentDrizzle(wizelens, db)) console.warn('[wizelens] SQL is not traced: unknown Drizzle driver');
  } catch (err) {
    console.warn('[wizelens] SQL is not traced', err);
  }
}

export const wizelens = start();
traceDb(wizelens);

/** Fastify plugin. Register before every other plugin so its span wraps them all. */
export const wizelensPlugin = wizelensFastify(wizelens);
