import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(3002),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // The REST API the MCP server proxies tool calls to. Each request runs as
  // the user identified by the bearer token on the request — no shared
  // identity, no shared key.
  KANNINJA_API_URL: z.string().url().default('https://api.kanninja.com'),

  // Public-facing URL of this server (for OAuth metadata + the redirect this
  // server tells the consent page to send the browser to on consent).
  MCP_PUBLIC_URL: z.string().url().default('https://mcp.kanninja.com'),

  // Browser destination for the consent UI — a Clerk-protected Next.js route.
  CONSENT_BASE_URL: z.string().url().default('https://kanninja.com/oauth/consent'),

  // HMAC secret used to validate MCP-issued access tokens. Shared with the
  // backend so the same JWT validates both there (on REST API calls) and
  // here (on incoming MCP requests).
  MCP_JWT_SECRET: z.string().min(32),

  // Service-to-service token. This server presents it as a Bearer header to
  // the backend's /api/v1/oauth/* internal endpoints. Backend rejects calls
  // without it.
  MCP_S2S_TOKEN: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
}

export const env = loadEnv();
