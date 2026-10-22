// WizeLens: request tracing (timeline, outgoing fetches to Stripe, Azure and
// Resend, errors, logs).
//
// On in development, with its dashboard at http://localhost:3001/_wizelens.
// In production it runs only with WIZELENS_ENABLED=true (k8s/configmap.yaml),
// and then it is SEND-ONLY: traces go to WIZELENS_HUB (WizeLens Cloud) with
// WIZELENS_HUB_TOKEN, sampled by WIZELENS_SAMPLE_RATE, and `/_wizelens` serves
// no dashboard or read API. Off in tests and everywhere else.
//
// Database calls are NOT traced yet: src/db/index.ts runs Drizzle on postgres.js,
// which WizeLens does not support. Drizzle on `pg` would be one instrumentDrizzle call.
//
// index.ts imports this module FIRST, so the HTTP and fetch hooks are in place
// before any other module makes a client.

import { createWizeLens, wizelensFastify, type WizeLens } from '@wizeworks/lens-node';
import { env } from '../config/env.js';

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

export const wizelens = start();

/** Fastify plugin. Register before every other plugin so its span wraps them all. */
export const wizelensPlugin = wizelensFastify(wizelens);
