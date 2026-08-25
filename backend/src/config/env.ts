import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DATABASE_URL: z.string().min(1),
  // Per-process connection pool size. Total connections against the server is
  // this × replicas, plus the reconcile-seats CronJob and any manual
  // db:migrate. See src/db/index.ts.
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  // Azure Blob Storage — card attachments. Defaults to '' so the server still
  // boots without them; the attachment routes throw if they're missing rather
  // than taking the whole API down.
  AZURE_STORAGE_ACCOUNT: z.string().default(''),
  AZURE_STORAGE_KEY: z.string().default(''),
  AZURE_STORAGE_CONTAINER: z.string().default('card-attachments'),


  // Clerk — OUTGOING. Kept only so the legacy verification branch in
  // require-auth.ts stays live through the Better Auth rollback window.
  // Removing these vars is what disables that branch. Delete at T+7d.
  CLERK_SECRET_KEY: z.string().default(''),
  CLERK_PUBLISHABLE_KEY: z.string().default(''),
  CLERK_WEBHOOK_SECRET: z.string().default(''),

  // Better Auth — signs session cookies and the cookie cache. Rotating this
  // signs every user out, so treat it as long-lived. Defaults to '' rather
  // than being required so the existing Clerk-only deploy keeps booting;
  // src/lib/auth.ts fails loudly if it's empty in production.
  BETTER_AUTH_SECRET: z.string().default(''),
  // Public origin of the API itself (where /api/auth/* is served from), e.g.
  // https://api.kanninja.com. Better Auth builds OAuth callback URLs from it.
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),
  // Parent domain for the session cookie so kanninja.com can send it to
  // api.kanninja.com. Leave empty in local dev — localhost can't take a
  // dot-prefixed domain, and host-only cookies work fine there.
  AUTH_COOKIE_DOMAIN: z.string().default(''),

  // Google sign-in. Distinct from GOOGLE_CLIENT_ID below, which is the
  // Calendar/Gmail/Drive data integration — different consent scopes, and
  // sharing one client would entangle "sign in" with "grant Drive access".
  GOOGLE_AUTH_CLIENT_ID: z.string().default(''),
  GOOGLE_AUTH_CLIENT_SECRET: z.string().default(''),

  // Transactional email (verification codes, password resets). There was no
  // email infrastructure before Better Auth — Clerk was sending these.
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('kanNINJA <noreply@kanninja.com>'),

  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),

  // Azure OpenAI — Whisper transcription only. kanNINJA runs no reasoning
  // models of its own; agents bring their own via MCP. See config/azure-openai.ts.
  AZURE_OPENAI_ENDPOINT: z.string().default('https://oai-jotdojo-prod-eus2.openai.azure.com/'),
  AZURE_OPENAI_API_KEY: z.string().default(''),
  AZURE_OPENAI_API_VERSION: z.string().default('2024-06-01'),
  AZURE_OPENAI_SPEECH_DEPLOYMENT: z.string().default('jotdojo-speech'),

  // Integration system
  INTEGRATION_ENCRYPTION_KEY: z.string().default(''),

  // MCP OAuth — HMAC secret used to sign and verify MCP-issued access tokens.
  // Shared with mcp-remote (which mints) and validated here (which both mints
  // — via the consent S2S flow — and validates on every API request).
  MCP_JWT_SECRET: z.string().default(''),

  // Service-to-service token. mcp-remote sends this on the internal
  // /authorize/issue-code endpoint to prove it's allowed to call back.
  MCP_S2S_TOKEN: z.string().default(''),

  // Google (Calendar, Gmail, Drive, Docs — shared OAuth app)
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),

  // Slack
  SLACK_CLIENT_ID: z.string().default(''),
  SLACK_CLIENT_SECRET: z.string().default(''),
  SLACK_SIGNING_SECRET: z.string().default(''),

  // GitHub
  GITHUB_CLIENT_ID: z.string().default(''),
  GITHUB_CLIENT_SECRET: z.string().default(''),
  GITHUB_WEBHOOK_SECRET: z.string().default(''),

  // Microsoft (Teams, Outlook, OneDrive — shared Azure AD app)
  MICROSOFT_CLIENT_ID: z.string().default(''),
  MICROSOFT_CLIENT_SECRET: z.string().default(''),
  MICROSOFT_TENANT_ID: z.string().default(''),

  // Atlassian (Jira, Bitbucket, Confluence — shared OAuth app)
  ATLASSIAN_CLIENT_ID: z.string().default(''),
  ATLASSIAN_CLIENT_SECRET: z.string().default(''),

  // GitLab
  GITLAB_CLIENT_ID: z.string().default(''),
  GITLAB_CLIENT_SECRET: z.string().default(''),
  GITLAB_INSTANCE_URL: z.string().default(''),

  // Discord
  DISCORD_CLIENT_ID: z.string().default(''),
  DISCORD_CLIENT_SECRET: z.string().default(''),
  DISCORD_BOT_TOKEN: z.string().default(''),
  DISCORD_PUBLIC_KEY: z.string().default(''),

  // Notion
  NOTION_CLIENT_ID: z.string().default(''),
  NOTION_CLIENT_SECRET: z.string().default(''),

  // Figma
  FIGMA_CLIENT_ID: z.string().default(''),
  FIGMA_CLIENT_SECRET: z.string().default(''),

  // Linear
  LINEAR_CLIENT_ID: z.string().default(''),
  LINEAR_CLIENT_SECRET: z.string().default(''),

  // Dropbox
  DROPBOX_CLIENT_ID: z.string().default(''),
  DROPBOX_CLIENT_SECRET: z.string().default(''),

  // Loom
  LOOM_CLIENT_ID: z.string().default(''),
  LOOM_CLIENT_SECRET: z.string().default(''),

  // Zendesk
  ZENDESK_CLIENT_ID: z.string().default(''),
  ZENDESK_CLIENT_SECRET: z.string().default(''),

  // Intercom
  INTERCOM_CLIENT_ID: z.string().default(''),
  INTERCOM_CLIENT_SECRET: z.string().default(''),

  // HubSpot
  HUBSPOT_CLIENT_ID: z.string().default(''),
  HUBSPOT_CLIENT_SECRET: z.string().default(''),

  // Salesforce
  SALESFORCE_CLIENT_ID: z.string().default(''),
  SALESFORCE_CLIENT_SECRET: z.string().default(''),

  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
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
