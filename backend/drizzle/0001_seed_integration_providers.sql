-- Seeds the integration_providers reference table.
--
-- Merged from the two hand-written seed files that were applied to production
-- out-of-band via the Supabase SQL editor and never registered in
-- _journal.json (drizzle-legacy/0004_seed_integration_providers.sql and
-- drizzle-legacy/0006_seed_all_providers.sql). This one IS journaled, so a
-- fresh database gets the providers from db:migrate alone.
--
-- Both inserts are ON CONFLICT (id) DO NOTHING, so re-running against a
-- database that already has them is a no-op — which is what makes it safe to
-- mark this migration as already-applied on the existing production DB.

-- Seed the integration_providers reference table
INSERT INTO "integration_providers" ("id", "display_name", "description", "icon_url", "oauth_auth_url", "oauth_token_url", "required_tier", "category", "enabled")
VALUES
  ('google_calendar', 'Google Calendar', 'Sync tasks with due dates to Google Calendar events. Keep your schedule and board in sync.', NULL, 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'free', 'calendar', true),
  ('slack', 'Slack', 'Get card notifications in your Slack channels. Create tasks from slash commands.', NULL, 'https://slack.com/oauth/v2/authorize', 'https://slack.com/api/oauth.v2.access', 'pro', 'messaging', true),
  ('github', 'GitHub', 'Link pull requests and issues to cards. Auto-move cards when PRs are merged.', NULL, 'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token', 'pro', 'devtools', true)
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint
-- Seed all 24 new integration providers (enabled=false until implemented & tested)
INSERT INTO integration_providers (id, display_name, description, required_tier, category, enabled)
VALUES
  -- Tier 1: Table Stakes
  ('microsoft_teams', 'Microsoft Teams', 'Post card updates to Teams channels and create cards from bot commands.', 'pro', 'messaging', false),
  ('outlook', 'Outlook Calendar', 'Sync tasks with due dates to your Outlook calendar.', 'pro', 'calendar', false),
  ('gmail', 'Gmail', 'Create cards from emails and send card notifications via Gmail.', 'pro', 'email', false),
  ('notion', 'Notion', 'Link Notion pages to cards and sync content bidirectionally.', 'pro', 'knowledge', false),

  -- Tier 2: Dev Team Essentials
  ('gitlab', 'GitLab', 'Link merge requests and issues to cards. Supports self-hosted instances.', 'pro', 'devtools', false),
  ('bitbucket', 'Bitbucket', 'Link pull requests and issues to cards.', 'pro', 'devtools', false),
  ('figma', 'Figma', 'Embed design files in cards and get update notifications.', 'pro', 'design', false),
  ('linear', 'Linear', 'Import issues from Linear and keep projects in sync.', 'free', 'pm-import', false),
  ('jira', 'Jira', 'Import issues and migrate your Jira projects to kanNINJA.', 'free', 'pm-import', false),

  -- Tier 3: Workflow Multipliers
  ('zapier', 'Zapier', 'Connect kanNINJA to 5,000+ apps via automated Zaps.', 'pro', 'automation', false),
  ('make', 'Make', 'Build powerful automations with Make scenarios.', 'pro', 'automation', false),
  ('generic_webhooks', 'Webhooks', 'Send and receive custom webhook events for any workflow.', 'pro', 'automation', false),
  ('discord', 'Discord', 'Post card updates to Discord channels and create cards via slash commands.', 'pro', 'messaging', false),

  -- Tier 4: Files & Productivity
  ('google_drive', 'Google Drive', 'Attach Google Drive files to cards and create docs from cards.', 'clan', 'files', false),
  ('dropbox', 'Dropbox', 'Attach Dropbox files to cards.', 'pro', 'files', false),
  ('onedrive', 'OneDrive', 'Attach OneDrive and SharePoint files to cards.', 'business', 'files', false),
  ('loom', 'Loom', 'Embed Loom recordings in cards for async video updates.', 'pro', 'media', false),
  ('toggl', 'Toggl Track', 'Sync time entries between kanNINJA and Toggl Track.', 'pro', 'time-tracking', false),

  -- Tier 5: Business & Support
  ('zendesk', 'Zendesk', 'Create cards from support tickets and sync resolution status.', 'business', 'support', false),
  ('intercom', 'Intercom', 'Create cards from customer conversations and auto-close on completion.', 'business', 'support', false),
  ('hubspot', 'HubSpot', 'Sync deals and pipeline stages with your kanNINJA board.', 'business', 'crm', false),
  ('salesforce', 'Salesforce', 'Sync opportunities and cases with your board.', 'enterprise', 'crm', false),

  -- Tier 6: AI Amplifiers
  ('confluence', 'Confluence', 'Link Confluence pages to cards and create pages from card content.', 'business', 'knowledge', false),
  ('google_docs', 'Google Docs', 'Link and create Google Docs from cards.', 'pro', 'knowledge', false)
ON CONFLICT (id) DO NOTHING;
