import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),

  CLERK_SECRET_KEY: z.string().default(''),
  CLERK_PUBLISHABLE_KEY: z.string().default(''),
  CLERK_WEBHOOK_SECRET: z.string().default(''),

  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),

  OPENAI_API_KEY: z.string().default(''),

  // Integration system
  INTEGRATION_ENCRYPTION_KEY: z.string().default(''),

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
