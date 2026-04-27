import { createRouter } from 'llm-harness';
import { env } from './env.js';

// Friendly name → provider/model mapping. Call sites reference 'primary' (etc.),
// never raw model IDs, so swapping models is a one-line change here.
//
// To add Claude as a fallback later:
//   1. Set ANTHROPIC_API_KEY in env (already declared in env.ts)
//   2. Uncomment the `anthropic` provider entry below
//   3. Uncomment the `'fallback'` model entry below
//   4. Uncomment `fallbacks: ['anthropic']` below
// No changes to ai.service.ts or any other file are required.
export const llm = createRouter({
  providers: {
    openai: { apiKey: env.OPENAI_API_KEY },
    // anthropic: { apiKey: env.ANTHROPIC_API_KEY },
  },
  models: {
    primary: { provider: 'openai', modelId: 'gpt-5.4-nano' },
    // fallback: { provider: 'anthropic', modelId: 'claude-haiku-4-5' },
  },
  // fallbacks: ['anthropic'],
});
