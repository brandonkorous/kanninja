import { AzureOpenAI } from 'openai';
import { ErrorCode } from '@kanninja/shared';
import { env } from './env.js';
import { AppError } from './../utils/errors.js';

// Transcription only.
//
// kanNINJA does not run its own reasoning models. Planning, summarising and
// drafting belong to the agent the user already pays for, reached over MCP —
// see the /agents page and mcp.kanninja.com. The one model we still call is
// Whisper, because turning speech into text on a phone is plumbing, not
// intelligence, and no MCP client can do it for us.
//
// Resource: oai-kanninja-prod-eus2 (rg-sparx-prod-cus, eastus2), deployment
// `kanninja-speech` -> whisper-001. Provisioned by
// sparx.works/terraform/envs/azure/kanninja.tf; the endpoint, key, api version
// and deployment name all arrive from Key Vault.
//
// IT USED TO BE jotDOJO'S. This pointed at `oai-jotdojo-prod-eus2` /
// `jotdojo-speech`, defaulted in env.ts, so kanNINJA transcribed on another
// product's account and inside its rate limit — and a key rotation over there
// broke voice capture here with nothing on this side to explain it.
//
// CONSTRUCTED LAZILY, which is the other half of that change. The client used
// to be built at module scope, so the values had to be non-empty at import or
// `new AzureOpenAI()` threw and the SERVER DID NOT BOOT. That is what made the
// jotDOJO defaults load-bearing: emptying them would have taken the whole API
// down rather than switching one feature off. Now an unconfigured deployment
// means voice capture returns a clear error and everything else serves
// normally — the same shape as config/azure-storage.ts.

let cached: AzureOpenAI | null = null;

/** True when Whisper is configured. Lets callers degrade instead of throwing. */
export function isTranscriptionConfigured(): boolean {
  return Boolean(env.AZURE_OPENAI_ENDPOINT && env.AZURE_OPENAI_API_KEY && SPEECH_DEPLOYMENT);
}

export function azureOpenAI(): AzureOpenAI {
  if (!isTranscriptionConfigured()) {
    // 503, not 500: the request was fine, the capability is switched off. The
    // message names the three variables so fixing it does not require reading
    // this file.
    //
    // Built from the constructor rather than a factory because AppError has no
    // `serviceUnavailable`, and `ErrorCode` has no SERVICE_UNAVAILABLE to give
    // it. Adding both to @kanninja/shared is the tidier fix and deliberately
    // not done here — the shared package is being edited right now, and a new
    // export landing mid-refactor is a merge conflict for no urgency.
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      'Voice capture is not configured on this deployment. ' +
        'AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY and ' +
        'AZURE_OPENAI_SPEECH_DEPLOYMENT must all be set.',
      503,
    );
  }

  cached ??= new AzureOpenAI({
    endpoint: env.AZURE_OPENAI_ENDPOINT,
    apiKey: env.AZURE_OPENAI_API_KEY,
    apiVersion: env.AZURE_OPENAI_API_VERSION,
  });
  return cached;
}

export const SPEECH_DEPLOYMENT = env.AZURE_OPENAI_SPEECH_DEPLOYMENT;
