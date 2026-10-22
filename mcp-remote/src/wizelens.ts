// WizeLens: request tracing for the hosted MCP server. Each POST /mcp is one
// trace, with the tool's calls to the REST API inside it; the backend joins the
// same trace through the traceparent header fetch carries.
//
// On in development, with its dashboard at http://localhost:3002/_wizelens.
// In production it runs only with WIZELENS_ENABLED=true (k8s/configmap.yaml),
// and then it is SEND-ONLY: traces go to WIZELENS_HUB (WizeLens Cloud) with
// WIZELENS_HUB_TOKEN, sampled by WIZELENS_SAMPLE_RATE, and `/_wizelens` serves
// no dashboard or read API. Off in tests and everywhere else.
//
// index.ts imports this module FIRST, so fetch is hooked before anything uses it.

import { createWizeLens, wizelensFastify, type WizeLens } from '@wizeworks/lens-node';
import { env } from './config/env.js';

const enabled = env.NODE_ENV === 'development' || process.env.WIZELENS_ENABLED === 'true';

function start(): WizeLens {
  try {
    return createWizeLens({ serviceName: 'kanninja-mcp', enabled });
  } catch (err) {
    // Tracing is not worth an outage: log it and run untraced.
    console.warn('[wizelens] tracing did not start', err);
    return createWizeLens({ serviceName: 'kanninja-mcp', enabled: false });
  }
}

export const wizelens = start();

/** Fastify plugin. Register before every other plugin so its span wraps them all. */
export const wizelensPlugin = wizelensFastify(wizelens);
