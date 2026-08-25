import { AzureOpenAI } from 'openai';
import { env } from './env.js';

// Transcription only.
//
// kanNINJA does not run its own reasoning models. Planning, summarising and
// drafting belong to the agent the user already pays for, reached over MCP —
// see the /agents page and mcp.kanninja.com. The one model we still call is
// Whisper, because turning speech into text on a phone is plumbing, not
// intelligence, and no MCP client can do it for us.
//
// Resource: oai-jotdojo-prod-eus2 (rg-sparx-prod-cus, eastus2)
// Deployment: jotdojo-speech -> whisper-001
export const azureOpenAI = new AzureOpenAI({
  endpoint: env.AZURE_OPENAI_ENDPOINT,
  apiKey: env.AZURE_OPENAI_API_KEY,
  apiVersion: env.AZURE_OPENAI_API_VERSION,
});

export const SPEECH_DEPLOYMENT = env.AZURE_OPENAI_SPEECH_DEPLOYMENT;
