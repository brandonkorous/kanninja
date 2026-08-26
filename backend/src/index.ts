import Fastify from 'fastify';
import rawBody from 'fastify-raw-body';
import websocket from '@fastify/websocket';
import { env } from './config/env.js';
import { corsPlugin } from './plugins/cors.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { rateLimitPlugin } from './plugins/rate-limit.js';
import { authPlugin } from './plugins/auth.js';
import { betterAuthPlugin } from './plugins/better-auth.js';
import { auditMcpPlugin } from './plugins/audit-mcp.js';
import { healthRoutes } from './routes/health.js';
import { clerkWebhookRoutes } from './routes/auth/webhooks.js';
import { realtimeRoutes } from './routes/realtime/index.js';
import { boardRoutes } from './routes/boards/index.js';
import { boardClansRoutes } from './routes/boards/clans.js';
import { listRoutes } from './routes/lists/index.js';
import { cardRoutes } from './routes/cards/index.js';
import { commentRoutes } from './routes/cards/comments.js';
import { checklistRoutes } from './routes/cards/checklist.js';
import { timeEntryRoutes } from './routes/cards/time-entries.js';
import { attachmentRoutes } from './routes/cards/attachments.js';
import { labelRoutes } from './routes/labels/index.js';
import { customFieldRoutes } from './routes/custom-fields/index.js';
import { clanRoutes } from './routes/clans/index.js';
import { invitationRoutes } from './routes/invitations/index.js';
import { subscriptionRoutes } from './routes/subscriptions/index.js';
import { stripeWebhookRoutes } from './routes/webhooks/stripe.js';
import { transcriptionRoutes } from './routes/transcription/index.js';
import { analyticsRoutes } from './routes/analytics/index.js';
import { notificationRoutes } from './routes/notifications/index.js';
import { templateRoutes } from './routes/templates/index.js';
import { userRoutes } from './routes/users/index.js';
import { avatarRoutes } from './routes/users/avatar.js';
import { apiKeyRoutes } from './routes/auth/api-keys.js';
import { verifyKeyRoutes } from './routes/auth/verify-key.js';
import { myWorkRoutes } from './routes/cards/my-work.js';
import { scheduledCardRoutes } from './routes/cards/scheduled.js';
import { searchRoutes } from './routes/search/index.js';
import { integrationRoutes } from './routes/integrations/index.js';
import { integrationOAuthRoutes } from './routes/integrations/oauth.js';
import { integrationWebhookRoutes } from './routes/integrations/webhooks.js';
import { oauthRoutes } from './routes/oauth/index.js';
import { compositeRoutes } from './routes/composite/index.js';
import { registerProvider } from './integrations/registry.js';
import { startTokenRefreshJob } from './integrations/token-refresh.js';
// Integration providers
import { googleCalendarProvider } from './integrations/providers/google-calendar.js';
import { slackProvider } from './integrations/providers/slack.js';
import { githubProvider } from './integrations/providers/github.js';
import { microsoftTeamsProvider } from './integrations/providers/microsoft-teams.js';
import { outlookProvider } from './integrations/providers/outlook.js';
import { gmailProvider } from './integrations/providers/gmail.js';
import { notionProvider } from './integrations/providers/notion.js';
import { gitlabProvider } from './integrations/providers/gitlab.js';
import { bitbucketProvider } from './integrations/providers/bitbucket.js';
import { figmaProvider } from './integrations/providers/figma.js';
import { linearProvider } from './integrations/providers/linear.js';
import { jiraProvider } from './integrations/providers/jira.js';
import { zapierProvider } from './integrations/providers/zapier.js';
import { makeProvider } from './integrations/providers/make.js';
import { genericWebhooksProvider } from './integrations/providers/generic-webhooks.js';
import { discordProvider } from './integrations/providers/discord.js';
import { googleDriveProvider } from './integrations/providers/google-drive.js';
import { dropboxProvider } from './integrations/providers/dropbox.js';
import { onedriveProvider } from './integrations/providers/onedrive.js';
import { loomProvider } from './integrations/providers/loom.js';
import { togglProvider } from './integrations/providers/toggl.js';
import { zendeskProvider } from './integrations/providers/zendesk.js';
import { intercomProvider } from './integrations/providers/intercom.js';
import { hubspotProvider } from './integrations/providers/hubspot.js';
import { salesforceProvider } from './integrations/providers/salesforce.js';
import { confluenceProvider } from './integrations/providers/confluence.js';
import { googleDocsProvider } from './integrations/providers/google-docs.js';

async function start() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Capture the raw request body on opt-in routes (config: { rawBody: true }).
  // Webhook signature verification (Stripe, Clerk/svix, integration HMACs) must
  // hash the exact bytes the sender signed — a re-serialized request.body won't
  // match. Registered before the routes; global:false keeps it off every other
  // route, runFirst captures before the JSON body parser runs.
  await fastify.register(rawBody, {
    field: 'rawBody',
    global: false,
    encoding: 'utf8',
    runFirst: true,
  });

  // Board presence + mutation broadcast. Replaces Supabase Realtime; see
  // services/realtime-hub.ts for the single-pod scaling limit.
  await fastify.register(websocket);

  // Plugins
  await fastify.register(corsPlugin);
  await fastify.register(errorHandlerPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(authPlugin);
  await fastify.register(auditMcpPlugin);

  // Better Auth owns /api/auth/*. Registered as its own encapsulated plugin
  // because it installs a catch-all content-type parser that must not leak
  // into the rest of the API.
  await fastify.register(betterAuthPlugin);

  // Routes
  await fastify.register(healthRoutes);
  await fastify.register(clerkWebhookRoutes);
  await fastify.register(realtimeRoutes);
  await fastify.register(boardRoutes);
  await fastify.register(boardClansRoutes);
  await fastify.register(listRoutes);
  await fastify.register(cardRoutes);
  await fastify.register(commentRoutes);
  await fastify.register(checklistRoutes);
  await fastify.register(timeEntryRoutes);
  await fastify.register(attachmentRoutes);
  await fastify.register(labelRoutes);
  await fastify.register(customFieldRoutes);
  await fastify.register(clanRoutes);
  await fastify.register(invitationRoutes);
  await fastify.register(subscriptionRoutes);
  await fastify.register(stripeWebhookRoutes);
  await fastify.register(transcriptionRoutes);
  await fastify.register(analyticsRoutes);
  await fastify.register(notificationRoutes);
  await fastify.register(templateRoutes);
  await fastify.register(userRoutes);
  // Encapsulated: it installs binary content-type parsers for image uploads.
  await fastify.register(avatarRoutes);
  await fastify.register(apiKeyRoutes);
  await fastify.register(verifyKeyRoutes);
  await fastify.register(myWorkRoutes);
  await fastify.register(scheduledCardRoutes);
  await fastify.register(searchRoutes);
  await fastify.register(integrationRoutes);
  await fastify.register(integrationOAuthRoutes);
  await fastify.register(integrationWebhookRoutes);
  await fastify.register(oauthRoutes);
  await fastify.register(compositeRoutes);

  // Register integration providers
  registerProvider(googleCalendarProvider);
  registerProvider(slackProvider);
  registerProvider(githubProvider);
  registerProvider(microsoftTeamsProvider);
  registerProvider(outlookProvider);
  registerProvider(gmailProvider);
  registerProvider(notionProvider);
  registerProvider(gitlabProvider);
  registerProvider(bitbucketProvider);
  registerProvider(figmaProvider);
  registerProvider(linearProvider);
  registerProvider(jiraProvider);
  registerProvider(zapierProvider);
  registerProvider(makeProvider);
  registerProvider(genericWebhooksProvider);
  registerProvider(discordProvider);
  registerProvider(googleDriveProvider);
  registerProvider(dropboxProvider);
  registerProvider(onedriveProvider);
  registerProvider(loomProvider);
  registerProvider(togglProvider);
  registerProvider(zendeskProvider);
  registerProvider(intercomProvider);
  registerProvider(hubspotProvider);
  registerProvider(salesforceProvider);
  registerProvider(confluenceProvider);
  registerProvider(googleDocsProvider);

  // Start
  try {
    await fastify.listen({ port: env.PORT, host: env.HOST });
    fastify.log.info(`Server running at http://${env.HOST}:${env.PORT}`);

    // Start background jobs after server is listening
    startTokenRefreshJob();
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
