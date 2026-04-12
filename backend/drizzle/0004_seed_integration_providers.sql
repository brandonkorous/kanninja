-- Seed the integration_providers reference table
INSERT INTO "integration_providers" ("id", "display_name", "description", "icon_url", "oauth_auth_url", "oauth_token_url", "required_tier", "category", "enabled")
VALUES
  ('google_calendar', 'Google Calendar', 'Sync tasks with due dates to Google Calendar events. Keep your schedule and board in sync.', NULL, 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'free', 'calendar', true),
  ('slack', 'Slack', 'Get card notifications in your Slack channels. Create tasks from slash commands.', NULL, 'https://slack.com/oauth/v2/authorize', 'https://slack.com/api/oauth.v2.access', 'pro', 'messaging', true),
  ('github', 'GitHub', 'Link pull requests and issues to cards. Auto-move cards when PRs are merged.', NULL, 'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token', 'pro', 'devtools', true);
