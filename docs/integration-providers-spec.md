# Integration Providers — Full Specification

> 27 providers across 6 priority tiers. 3 built, 24 to implement.
> Last updated: 2026-04-10

## Legend

| Symbol | Meaning |
|--------|---------|
| **Complexity** | `L` = Low (1–2 days), `M` = Medium (3–5 days), `H` = High (5–10 days) |
| **Auth** | `OAuth` = OAuth 2.0, `API` = API Key, `None` = No auth (webhook-only) |
| **Direction** | `→` = Outbound (kanNINJA → external), `←` = Inbound (external → kanNINJA), `↔` = Bidirectional |

---

## Summary Table

| # | Provider | Category | Tier | Auth | Complexity | Direction | Status |
|---|----------|----------|------|------|-----------|-----------|--------|
| 1 | Google Calendar | calendar | Free | OAuth | M | ↔ | **Built** |
| 2 | Slack | messaging | Pro | OAuth | H | ↔ | **Built** |
| 3 | GitHub | devtools | Pro | OAuth | H | ↔ | **Built** |
| 4 | Microsoft Teams | messaging | Pro | OAuth | H | ↔ | — |
| 5 | Outlook / M365 | calendar | Pro | OAuth | M | ↔ | — |
| 6 | Gmail | email | Pro | OAuth | M | → | — |
| 7 | Notion | knowledge | Pro | OAuth | M | ↔ | — |
| 8 | GitLab | devtools | Pro | OAuth | L | ↔ | — |
| 9 | Bitbucket | devtools | Pro | OAuth | L | ↔ | — |
| 10 | Figma | design | Pro | OAuth | M | ← | — |
| 11 | Linear | pm-import | Free | OAuth | M | ← | — |
| 12 | Jira | pm-import | Free | OAuth | H | ← | — |
| 13 | Zapier | automation | Pro | API | M | ↔ | — |
| 14 | Make | automation | Pro | API | M | ↔ | — |
| 15 | Generic Webhooks | automation | Pro | None | L | ↔ | — |
| 16 | Discord | messaging | Pro | OAuth | M | → | — |
| 17 | Google Drive | files | Clan | OAuth | M | ← | — |
| 18 | Dropbox | files | Pro | OAuth | M | ← | — |
| 19 | OneDrive | files | Business | OAuth | M | ← | — |
| 20 | Loom | media | Pro | OAuth | L | ← | — |
| 21 | Toggl Track | time-tracking | Pro | API | M | ↔ | — |
| 22 | Zendesk | support | Business | OAuth | M | ← | — |
| 23 | Intercom | support | Business | OAuth | M | ← | — |
| 24 | HubSpot | crm | Business | OAuth | H | ↔ | — |
| 25 | Salesforce | crm | Enterprise | OAuth | H | ↔ | — |
| 26 | Confluence | knowledge | Business | OAuth | M | ← | — |
| 27 | Google Docs | knowledge | Pro | OAuth | L | ← | — |

**Total remaining effort:** ~70–95 dev-days (solo), ~35–50 days (2 devs parallel)

---

## New Categories Required

Current categories: `calendar`, `messaging`, `devtools`

Add: `email`, `knowledge`, `pm-import`, `automation`, `design`, `files`, `media`, `time-tracking`, `support`, `crm`

Update `CATEGORY_LABELS` in `ProviderGrid.tsx` and add FontAwesome icons in `ProviderCard.tsx`.

---

## Tier 1 — Table Stakes

### 4. Microsoft Teams

| Field | Value |
|-------|-------|
| **ID** | `microsoft_teams` |
| **Category** | messaging |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 (Microsoft Identity Platform / Azure AD) |
| **Complexity** | High (5–7 days) |
| **Direction** | Bidirectional |

**Why it's high complexity:** Microsoft Graph API requires Azure AD app registration with tenant-aware OAuth. Teams-specific APIs (chat, channels, activities) layer on top of Graph. Webhook subscriptions require renewal every 60 min (short-lived).

**Scopes:** `ChannelMessage.Send`, `Channel.ReadBasic.All`, `Team.ReadBasic.All`, `offline_access`

**Outbound (kanNINJA → Teams):**
- Card created/updated/moved → post message to configured Teams channel
- Message format: Adaptive Card (JSON) with card title, status, assignee, link back

**Inbound (Teams → kanNINJA):**
- Bot mention `@kanNINJA create <title>` → create card
- Bot mention `@kanNINJA status` → reply with board summary

**Config fields:**
- Team ID (dropdown populated via Graph API)
- Channel ID (dropdown filtered by team)
- Notification events (checkboxes: created, updated, moved, completed)

**Env vars:** `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`

**Token refresh:** Yes — Microsoft tokens expire in 1hr, refresh tokens in 90 days. Standard OAuth refresh flow.

**Implementation notes:**
- Azure AD app registration is manual (portal.azure.com), document in setup guide
- Adaptive Cards have a JSON schema — store templates in provider
- Webhook subscriptions (change notifications) need a subscription renewal background job
- Consider using the Bot Framework SDK for rich interactions, or raw Graph API for simplicity

---

### 5. Outlook / Microsoft 365

| Field | Value |
|-------|-------|
| **ID** | `outlook` |
| **Category** | calendar |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 (Microsoft Identity Platform) |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Bidirectional |

**Why medium:** Shares Azure AD auth with Teams — if Teams is built first, the OAuth app already exists. Calendar API (Graph) is well-documented and similar to Google Calendar.

**Scopes:** `Calendars.ReadWrite`, `Mail.Read`, `offline_access`

**Outbound (kanNINJA → Outlook):**
- Cards with due dates → Outlook calendar events (1hr duration, `[kanNINJA]` prefix)
- Same pattern as Google Calendar provider

**Inbound (Outlook → kanNINJA):**
- Calendar event changes → update card due dates (via Graph change notifications)
- Email-to-task: forward emails to a kanNINJA address → create card (Phase 2)

**Config fields:**
- Calendar ID (default: primary)
- Sync direction (outbound only, inbound only, bidirectional)
- Email-to-task toggle (when available)

**Env vars:** Shares `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` with Teams

**Token refresh:** Yes — same Microsoft OAuth refresh flow

**Implementation notes:**
- Can share the Azure AD app with Teams (just add calendar scopes)
- Graph change notifications for calendar use the same subscription model as Teams
- Email-to-task is a stretch goal — requires `Mail.Read` scope and a polling job

---

### 6. Gmail

| Field | Value |
|-------|-------|
| **ID** | `gmail` |
| **Category** | email |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 (Google) |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily outbound + email-to-task |

**Why medium:** Shares Google OAuth with Calendar — the OAuth app already exists. Gmail API is well-documented. Email-to-task parsing adds complexity.

**Scopes:** `gmail.readonly`, `gmail.labels` (or `gmail.modify` for label management)

**Outbound (kanNINJA → Gmail):**
- Card completed → send summary email to configured address
- Daily/weekly digest emails (scheduled, uses card data)

**Inbound (Gmail → kanNINJA):**
- Forward-to-task: user labels an email with `kanNINJA` label → create card with email subject as title, body as description
- Uses Gmail push notifications (Cloud Pub/Sub) or polling

**Config fields:**
- Notification email address
- Auto-label toggle
- Digest frequency (none, daily, weekly)

**Env vars:** Shares `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` with Calendar

**Token refresh:** Yes — same Google OAuth refresh flow

**Implementation notes:**
- Gmail push notifications require a Google Cloud Pub/Sub topic — document in setup guide
- Alternatively, poll with `history.list()` API (simpler, 1-min interval)
- Email parsing: extract subject → card title, body → card description (strip HTML)
- Share OAuth tokens with Google Calendar if user connects both (same Google account)

---

### 7. Notion

| Field | Value |
|-------|-------|
| **ID** | `notion` |
| **Category** | knowledge |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 (Notion) |
| **Complexity** | Medium (4–5 days) |
| **Direction** | Bidirectional |

**Why medium:** Notion's API has rich block types (paragraphs, headings, to-dos, etc.) that require careful mapping. OAuth flow is standard.

**Scopes:** Notion OAuth doesn't use granular scopes — user selects which pages/databases to share during authorization.

**Outbound (kanNINJA → Notion):**
- Card created → create linked Notion page (title + link back to card)
- Card description updated → sync to Notion page body
- Card completed → update linked Notion page status

**Inbound (Notion → kanNINJA):**
- Notion page updated → update linked card description
- Notion database item status change → move card to matching list

**Config fields:**
- Linked Notion workspace (auto-populated from OAuth)
- Default database for new pages (dropdown)
- Sync direction per field (title, description, status)

**Env vars:** `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET`

**Token refresh:** Notion access tokens don't expire (indefinite until user revokes). No refresh needed.

**Implementation notes:**
- Notion block types are rich — for v1, sync title + plain text description only
- Notion webhooks are not publicly available — use polling (search API with `last_edited_time` filter)
- Store Notion page ID in card's `providerConfig` for linking
- Rate limit: 3 requests/second — implement request queue

---

## Tier 2 — Dev Team Essentials

### 8. GitLab

| Field | Value |
|-------|-------|
| **ID** | `gitlab` |
| **Category** | devtools |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 |
| **Complexity** | Low (1–2 days) |
| **Direction** | Bidirectional |

**Why low complexity:** Near-clone of GitHub provider. GitLab's API mirrors GitHub's concepts (MRs ≈ PRs, issues, webhooks). Same `[card:uuid]` linking pattern.

**Scopes:** `api` (full API access — GitLab doesn't have fine-grained OAuth scopes)

**Outbound (kanNINJA → GitLab):**
- Card completed → create GitLab issue with `[kanninja]` label
- Same pattern as GitHub

**Inbound (GitLab → kanNINJA):**
- MR merged → add comment to linked card
- MR opened → add comment to linked card
- Issue closed → update card (mark completed)
- Linking via `[card:uuid]` in MR/issue description

**Config fields:**
- GitLab instance URL (support self-hosted: `https://gitlab.example.com`)
- Project path (`namespace/project`)
- Event filters (MR events, issue events, pipeline events)

**Env vars:** `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`

**Token refresh:** Yes — GitLab OAuth tokens expire in 2 hours. Standard refresh flow.

**Webhook verification:** `X-Gitlab-Token` header (shared secret, not HMAC — simpler than GitHub)

**Implementation notes:**
- Self-hosted GitLab support: OAuth app registration is per-instance, so `GITLAB_INSTANCE_URL` env var needed
- Fork the GitHub provider, rename PR→MR, adjust API endpoints
- GitLab webhooks use a simple secret token header, not HMAC signatures

---

### 9. Bitbucket

| Field | Value |
|-------|-------|
| **ID** | `bitbucket` |
| **Category** | devtools |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 (Atlassian) |
| **Complexity** | Low (1–2 days) |
| **Direction** | Bidirectional |

**Why low complexity:** Same concept as GitHub/GitLab. Bitbucket's API is slightly different but the mapping is 1:1.

**Scopes:** `repository`, `pullrequest`, `issue`, `webhook`

**Outbound (kanNINJA → Bitbucket):**
- Card completed → create Bitbucket issue

**Inbound (Bitbucket → kanNINJA):**
- PR merged/declined → add comment to linked card
- Issue resolved → update card
- Linking via `[card:uuid]` in PR description

**Config fields:**
- Workspace slug
- Repository slug
- Event filters

**Env vars:** `BITBUCKET_CLIENT_ID`, `BITBUCKET_CLIENT_SECRET`

**Token refresh:** Yes — Bitbucket tokens expire in 2 hours

**Webhook verification:** Bitbucket Cloud doesn't support webhook signatures — verify by IP allowlist or use Atlassian Connect (more complex). For v1, accept all and validate event structure.

**Implementation notes:**
- Bitbucket Cloud vs Server — only support Cloud initially
- Atlassian OAuth uses `https://auth.atlassian.com` — can share with Jira if user connects both
- No webhook HMAC — consider IP-based verification or event UUID dedup

---

### 10. Figma

| Field | Value |
|-------|-------|
| **ID** | `figma` |
| **Category** | design |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound |

**Scopes:** `files:read`

**Outbound (kanNINJA → Figma):**
- Not applicable — Figma is read-only for external apps

**Inbound (Figma → kanNINJA):**
- Figma webhook: file updated → add comment to linked cards with thumbnail
- Design handoff: user pastes Figma URL in card → auto-embed preview (via oEmbed)
- Comment on Figma file → create or update linked kanNINJA card

**Config fields:**
- Figma team ID
- File key(s) to watch
- Auto-embed toggle

**Env vars:** `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET`

**Token refresh:** Yes — Figma tokens expire (standard refresh)

**Webhook verification:** Figma webhooks include a `passcode` field set during subscription creation

**Implementation notes:**
- Figma's REST API returns file thumbnails — store thumbnail URL in card attachment
- Webhook events: `FILE_UPDATE`, `FILE_COMMENT`, `FILE_VERSION_UPDATE`
- Rate limit: 30 requests/min — implement queue
- Figma embed URLs can be rendered as iframes (oEmbed endpoint available)

---

### 11. Linear

| Field | Value |
|-------|-------|
| **ID** | `linear` |
| **Category** | pm-import |
| **Tier** | Free |
| **Auth** | OAuth 2.0 |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound (migration + ongoing sync) |

**Why free tier:** Migration tool — the goal is acquisition. Users importing from Linear become kanNINJA users.

**Scopes:** `read`, `write` (Linear uses simple scope names)

**Outbound (kanNINJA → Linear):**
- Optional: sync card status back to Linear issue (for gradual migration)

**Inbound (Linear → kanNINJA):**
- **One-click import:** Fetch all issues from a Linear project → create kanNINJA cards
  - Map Linear states (Backlog, Todo, In Progress, Done) → kanNINJA lists
  - Map Linear labels → kanNINJA labels
  - Map Linear assignees → kanNINJA assignees (by email match)
  - Map Linear priorities → kanNINJA priorities
  - Preserve Linear comments → kanNINJA card comments
- **Ongoing sync:** Linear issue updated → update linked kanNINJA card

**Config fields:**
- Linear team to import from (dropdown)
- Target kanNINJA board (dropdown)
- Import mode: one-time or continuous sync
- Field mapping overrides

**Env vars:** `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET`

**Token refresh:** Linear tokens don't expire (indefinite)

**Webhook verification:** Linear webhooks use HMAC-SHA256 with a signing secret

**Implementation notes:**
- Linear's GraphQL API is clean — batch import via `issues` query with pagination
- Import could be large (1000+ issues) — use background job with progress reporting
- Linear webhooks: `Issue`, `Comment`, `IssueLabel` event types
- Map Linear's workflow states to kanNINJA list positions intelligently

---

### 12. Jira

| Field | Value |
|-------|-------|
| **ID** | `jira` |
| **Category** | pm-import |
| **Tier** | Free |
| **Auth** | OAuth 2.0 (Atlassian) |
| **Complexity** | High (5–7 days) |
| **Direction** | Primarily inbound (migration) |

**Why free tier:** Same acquisition play as Linear. Jira refugees are a huge market.

**Why high complexity:** Jira's data model is deeply nested (projects → boards → sprints → issues → subtasks → custom fields). The REST API is verbose. Atlassian OAuth (3LO) has quirks.

**Scopes:** `read:jira-work`, `read:jira-user`, `write:jira-work`

**Outbound (kanNINJA → Jira):**
- Optional: sync card status back to Jira issue

**Inbound (Jira → kanNINJA):**
- **Import wizard:**
  - Select Jira project → fetch all issues (paginated, JQL)
  - Map Jira statuses → kanNINJA lists
  - Map Jira priorities → kanNINJA priorities
  - Map Jira labels/components → kanNINJA labels
  - Map Jira assignees → kanNINJA members (by email)
  - Import descriptions (Atlassian Document Format → markdown)
  - Import comments
  - Import attachments (download + reupload to kanNINJA storage)
- **Ongoing sync:** Jira webhook → update linked card

**Config fields:**
- Jira Cloud site URL (e.g., `mycompany.atlassian.net`)
- Project key (dropdown)
- Target board (dropdown)
- Import mode: one-time or continuous

**Env vars:** Shares `BITBUCKET_CLIENT_ID`, `BITBUCKET_CLIENT_SECRET` (same Atlassian OAuth app), or separate `JIRA_CLIENT_ID`, `JIRA_CLIENT_SECRET`

**Token refresh:** Yes — Atlassian tokens expire in 1 hour

**Webhook verification:** Atlassian Connect webhooks include a JWT in the `Authorization` header — verify with shared secret

**Implementation notes:**
- Atlassian Document Format (ADF) → Markdown conversion is non-trivial — use a library or build a simple converter for common block types
- Jira Cloud vs Server: only support Cloud initially (Server uses different auth)
- Import can be very large — background job with progress bar, batch processing (50 issues at a time)
- Consider a "preview" step in the import wizard showing what will be created before executing
- Jira custom fields are a rabbit hole — import standard fields only for v1

---

## Tier 3 — Workflow Multipliers

### 13. Zapier

| Field | Value |
|-------|-------|
| **ID** | `zapier` |
| **Category** | automation |
| **Tier** | Pro |
| **Auth** | API Key (user generates in kanNINJA settings) |
| **Complexity** | Medium (4–5 days) |
| **Direction** | Bidirectional |

**Why this is a force multiplier:** Zapier connects to 5,000+ apps. Building one Zapier integration gives users access to all of them. This is the highest-leverage integration after the core 3.

**Outbound (kanNINJA → Zapier = "Triggers"):**
kanNINJA events that trigger Zaps:
- `card.created` — new card created
- `card.updated` — card fields changed
- `card.moved` — card moved between lists
- `card.completed` — card marked done
- `card.commented` — new comment added
- `board.created` — new board created

Zapier uses REST Hook subscriptions (not polling):
1. Zapier sends `POST /api/v1/integrations/zapier/hooks` with `{ hookUrl, event }`
2. kanNINJA stores the subscription
3. When event fires, POST the event payload to `hookUrl`
4. Zapier sends `DELETE /api/v1/integrations/zapier/hooks/:id` to unsubscribe

**Inbound (Zapier → kanNINJA = "Actions"):**
Zap actions that create/modify kanNINJA data:
- `Create Card` — POST /api/v1/cards with title, description, boardId, listId
- `Update Card` — PATCH /api/v1/cards/:id
- `Move Card` — POST /api/v1/cards/:id/move
- `Add Comment` — POST /api/v1/cards/:id/comments
- `Create Board` — POST /api/v1/boards
- `Find Card` — GET /api/v1/cards?search=query (for "Search" step)

These use the existing API endpoints with an API key for auth.

**Config fields:**
- API key (auto-generated, displayed once)
- Webhook subscriptions (managed by Zapier, shown as read-only list)

**Env vars:** None — uses kanNINJA's own API key system

**Implementation notes:**
- **Zapier Developer Platform:** Build a Zapier app at `developer.zapier.com`
  - Define triggers (REST Hook style), actions, and searches
  - Auth: API Key header (`X-API-Key`)
  - Include sample data for each trigger/action
- **REST Hook subscriptions table:** New table `zapier_hook_subscriptions` (hookUrl, event, apiKeyId, active)
- **API key system:** kanNINJA already has API keys (ApiKeysSection in settings) — reuse that
- Zapier requires a live app to test — use `zapier` CLI for local testing
- Zapier app needs to pass their review process for public listing (~2 weeks)

---

### 14. Make (Integromat)

| Field | Value |
|-------|-------|
| **ID** | `make` |
| **Category** | automation |
| **Tier** | Pro |
| **Auth** | API Key |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Bidirectional |

**Why slightly less complex than Zapier:** Make's module system is simpler to set up. Same concept but fewer requirements for app listing.

**Outbound (kanNINJA → Make = "Triggers/Watches"):**
- Same events as Zapier
- Make uses instant webhooks (similar to REST Hooks) or polling modules

**Inbound (Make → kanNINJA = "Actions"):**
- Same actions as Zapier — uses kanNINJA API endpoints with API key auth

**Config fields:**
- API key (same system as Zapier)

**Env vars:** None

**Implementation notes:**
- Build a Make app at `www.make.com/en/integrations`
- Make uses a JSON-based module definition format
- Can largely reuse the same webhook subscription system built for Zapier
- Make has no formal review process — apps can be private or submitted for listing

---

### 15. Generic Webhooks

| Field | Value |
|-------|-------|
| **ID** | `generic_webhooks` |
| **Category** | automation |
| **Tier** | Pro |
| **Auth** | None (webhook secret for verification) |
| **Complexity** | Low (1–2 days) |
| **Direction** | Bidirectional |

**The power-user escape hatch.** Let users send/receive arbitrary webhooks without needing Zapier or Make.

**Outbound (kanNINJA → external URL):**
- User configures a webhook URL + secret
- kanNINJA POSTs event payloads (JSON) to that URL
- HMAC-SHA256 signature in `X-KanNinja-Signature` header
- Events: same set as Zapier (card.created, card.updated, etc.)

**Inbound (external → kanNINJA):**
- kanNINJA provides a unique webhook URL per connection: `/api/webhooks/generic/:connectionId`
- Accepts POST with JSON body
- Payload shape: `{ action: 'create_card' | 'update_card' | ..., data: { ... } }`
- Verified by HMAC signature using the connection's secret

**Config fields:**
- Outbound webhook URL
- Webhook secret (auto-generated, displayed once)
- Events to send (checkboxes)
- Inbound webhook URL (auto-generated, read-only)

**Env vars:** None

**Implementation notes:**
- No OAuth — connection is created directly with auto-generated secret
- Override `getAuthUrl` to return a direct connection flow (no popup)
- This is the simplest provider — good first implementation in the Tier 3 batch
- Document the webhook payload format in a public API reference

---

### 16. Discord

| Field | Value |
|-------|-------|
| **ID** | `discord` |
| **Category** | messaging |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily outbound |

**Scopes:** `bot`, `applications.commands`

**Outbound (kanNINJA → Discord):**
- Card events → post to configured Discord channel (via bot)
- Rich embeds with card info (title, status, assignee, link)

**Inbound (Discord → kanNINJA):**
- Slash command `/kanninja create <title>` → create card
- Discord Interactions API (HTTP-based, not WebSocket)

**Config fields:**
- Discord server (auto-populated from bot installation)
- Channel ID (dropdown)
- Notification events (checkboxes)

**Env vars:** `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY`

**Token refresh:** Discord bot tokens don't expire. User OAuth tokens expire in 7 days (refresh available).

**Webhook verification:** Discord Interactions use Ed25519 signature verification (`X-Signature-Ed25519`, `X-Signature-Timestamp`)

**Implementation notes:**
- Near-clone of Slack provider conceptually, but Discord uses a different API style
- Bot must be added to server via OAuth2 URL with `bot` + `applications.commands` scopes
- Rich embeds are simpler than Slack blocks — just JSON objects
- Slash commands registered via Discord's API (not dynamic like Slack)
- Ed25519 verification requires `tweetnacl` or `noble-ed25519` library

---

## Tier 4 — Files & Productivity

### 17. Google Drive

| Field | Value |
|-------|-------|
| **ID** | `google_drive` |
| **Category** | files |
| **Tier** | Clan |
| **Auth** | OAuth 2.0 (Google) |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound |

**Why Clan tier:** File attachment is a basic productivity feature, not a power-user need.

**Scopes:** `drive.file` (app-created files only) or `drive.readonly` (browse all)

**Inbound (Google Drive → kanNINJA):**
- Attach Drive files to cards (file picker via Google Picker API)
- Preview Drive files inline (thumbnails, Google Docs/Sheets/Slides viewer)
- Drive file updated → notification on linked card

**Outbound (kanNINJA → Google Drive):**
- Create a Google Doc from card description
- Export board as Google Sheet

**Config fields:**
- Root folder for kanNINJA files (optional)
- Auto-create folders per board toggle

**Env vars:** Shares `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Token refresh:** Yes — Google standard

**Implementation notes:**
- Google Picker API is a frontend SDK — load via script tag, opens a file picker modal
- Store Drive file metadata (id, name, mimeType, thumbnailUrl) as card attachment
- Shares OAuth with Calendar + Gmail — extend existing Google OAuth app scopes
- Rate limit: 1000 requests/100 seconds/user

---

### 18. Dropbox

| Field | Value |
|-------|-------|
| **ID** | `dropbox` |
| **Category** | files |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 |
| **Complexity** | Medium (3 days) |
| **Direction** | Primarily inbound |

**Scopes:** `files.metadata.read`, `files.content.read`, `sharing.read`

**Inbound (Dropbox → kanNINJA):**
- Dropbox Chooser (frontend SDK) → attach files to cards
- Preview via Dropbox shared link thumbnails
- File updated → notification on linked card

**Outbound (kanNINJA → Dropbox):**
- Export card attachments to Dropbox folder

**Config fields:**
- Target Dropbox folder (file picker)

**Env vars:** `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET`

**Token refresh:** Yes — Dropbox tokens expire in 4 hours

**Implementation notes:**
- Dropbox Chooser is a frontend drop-in (script tag + `Dropbox.choose()`)
- Similar pattern to Google Drive — store file metadata as attachment
- Webhooks: Dropbox sends a verification GET, then POSTs notifications (no payload — you must call the API to see what changed)

---

### 19. OneDrive / SharePoint

| Field | Value |
|-------|-------|
| **ID** | `onedrive` |
| **Category** | files |
| **Tier** | Business |
| **Auth** | OAuth 2.0 (Microsoft Identity Platform) |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound |

**Why Business tier:** SharePoint integration is an enterprise/business feature.

**Scopes:** `Files.ReadWrite`, `Sites.Read.All` (for SharePoint), `offline_access`

**Inbound (OneDrive → kanNINJA):**
- OneDrive file picker (Microsoft Graph Toolkit) → attach files to cards
- SharePoint document library browse
- File updated → notification on linked card

**Outbound (kanNINJA → OneDrive):**
- Export card attachments to OneDrive folder
- Create Word doc from card description

**Config fields:**
- OneDrive folder or SharePoint site

**Env vars:** Shares `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` with Teams/Outlook

**Token refresh:** Yes — Microsoft standard

**Implementation notes:**
- Shares Azure AD app with Teams + Outlook — extend scopes
- Microsoft Graph file picker component available as a React component
- SharePoint integration adds complexity — consider OneDrive-only for v1

---

### 20. Loom

| Field | Value |
|-------|-------|
| **ID** | `loom` |
| **Category** | media |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 |
| **Complexity** | Low (1–2 days) |
| **Direction** | Inbound only |

**Scopes:** `content:read`

**Inbound (Loom → kanNINJA):**
- Paste Loom URL in card → auto-embed with thumbnail + duration
- Loom SDK record button on card → attach recording directly
- Browse recent Loom videos → attach to card

**Config fields:**
- Auto-embed toggle (on by default)

**Env vars:** `LOOM_CLIENT_ID`, `LOOM_CLIENT_SECRET`

**Token refresh:** Yes — Loom standard

**Implementation notes:**
- Loom oEmbed endpoint: `https://www.loom.com/v1/oembed?url=...` — returns embed HTML
- URL detection: match `loom.com/share/*` in card description → auto-embed
- Loom Record SDK (frontend) for in-app recording — advanced feature, defer to v2
- This is essentially a card attachment type, not a full provider — consider if it's worth a separate provider or just a URL embed feature

---

### 21. Toggl Track

| Field | Value |
|-------|-------|
| **ID** | `toggl` |
| **Category** | time-tracking |
| **Tier** | Pro |
| **Auth** | API Key (Toggl uses API token auth) |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Bidirectional |

**Outbound (kanNINJA → Toggl):**
- Start/stop timer on card → create Toggl time entry
- kanNINJA time entries sync to Toggl projects

**Inbound (Toggl → kanNINJA):**
- Toggl time entries → populate card time tracking fields
- Daily sync: pull all time entries tagged with kanNINJA project

**Config fields:**
- Toggl API token (user provides)
- Toggl workspace (dropdown)
- Toggl project mapping (Toggl project ↔ kanNINJA board)
- Sync direction

**Env vars:** None (per-user API tokens)

**Token refresh:** No — API tokens are permanent

**Webhook verification:** Toggl has no webhooks — use polling (5-min interval)

**Implementation notes:**
- kanNINJA already has time tracking (`time_entries` table) — this syncs between systems
- Toggl API uses basic auth with API token
- Clockify is a popular alternative — consider building a shared interface for both
- No webhooks — background sync job needed
- Map kanNINJA boards → Toggl projects, kanNINJA cards → Toggl entries (via description tag)

---

## Tier 5 — Business & Support

### 22. Zendesk

| Field | Value |
|-------|-------|
| **ID** | `zendesk` |
| **Category** | support |
| **Tier** | Business |
| **Auth** | OAuth 2.0 |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound |

**Scopes:** `read`, `tickets:read`, `tickets:write`

**Inbound (Zendesk → kanNINJA):**
- Zendesk ticket created → create kanNINJA card (support board)
- Ticket status change → update card
- Ticket comment → add card comment
- Zendesk webhook triggers

**Outbound (kanNINJA → Zendesk):**
- Card completed → update Zendesk ticket status (resolved/closed)
- Card comment → add Zendesk ticket internal note

**Config fields:**
- Zendesk subdomain (e.g., `mycompany.zendesk.com`)
- Target board for new tickets (dropdown)
- Ticket types to import (all, or specific groups/views)
- Auto-close tickets when card completes

**Env vars:** `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET`

**Token refresh:** Yes — Zendesk tokens expire in 8 hours

**Webhook verification:** Zendesk webhooks support HMAC-SHA256 signing

**Implementation notes:**
- Zendesk has a robust webhook system — use Target + Trigger for event-driven sync
- Map Zendesk ticket fields: subject→title, description→description, status→list position, priority→priority
- Zendesk views can filter which tickets sync — expose as config option

---

### 23. Intercom

| Field | Value |
|-------|-------|
| **ID** | `intercom` |
| **Category** | support |
| **Tier** | Business |
| **Auth** | OAuth 2.0 |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound |

**Scopes:** Read conversations, write conversations

**Inbound (Intercom → kanNINJA):**
- New conversation → create kanNINJA card
- Conversation tagged → create/update card
- Customer message → add card comment

**Outbound (kanNINJA → Intercom):**
- Card completed → close Intercom conversation
- Card comment → add Intercom admin note

**Config fields:**
- Target board for conversations
- Filter by tag or team (optional)
- Auto-close toggle

**Env vars:** `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET`

**Token refresh:** Intercom access tokens don't expire

**Webhook verification:** Intercom webhooks use HMAC-SHA1 with client secret (yes, SHA1 — it's their spec)

**Implementation notes:**
- Intercom's conversation model is thread-based — map thread → card, messages → comments
- Webhooks: `conversation.created`, `conversation.user.replied`, `conversation.admin.closed`
- Intercom has a Canvas Kit for embedded apps — consider for future in-Intercom UI

---

### 24. HubSpot

| Field | Value |
|-------|-------|
| **ID** | `hubspot` |
| **Category** | crm |
| **Tier** | Business |
| **Auth** | OAuth 2.0 |
| **Complexity** | High (5–7 days) |
| **Direction** | Bidirectional |

**Why high complexity:** HubSpot's API is vast (CRM, Marketing, Sales, Service). Deal pipeline → kanban mapping requires careful state machine design.

**Scopes:** `crm.objects.deals.read`, `crm.objects.deals.write`, `crm.objects.contacts.read`

**Outbound (kanNINJA → HubSpot):**
- Card moved to "Won" list → update deal stage
- Card field updated → sync to deal properties

**Inbound (HubSpot → kanNINJA):**
- Deal created → create kanNINJA card on sales board
- Deal stage changed → move card to matching list
- Contact associated → add card metadata
- HubSpot workflow triggers → create/update cards

**Config fields:**
- HubSpot deal pipeline (dropdown)
- Board for deals (dropdown)
- Stage → list mapping (drag-and-drop mapper UI)
- Sync direction
- Deal properties to sync (checkboxes)

**Env vars:** `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`

**Token refresh:** Yes — HubSpot tokens expire in 30 minutes (aggressive — refresh job must handle this)

**Webhook verification:** HubSpot webhooks use a client secret signature (HMAC-SHA256 of `requestBody + clientSecret`)

**Implementation notes:**
- Deal pipeline stages → kanNINJA lists is the killer feature
- HubSpot's aggressive 30-min token expiry means the refresh job is critical
- Stage → list mapping UI is unique to this provider — needs a custom config component
- Consider importing deal "amount" as a custom field on the card
- HubSpot rate limit: 100 calls/10 seconds — implement request queue

---

### 25. Salesforce

| Field | Value |
|-------|-------|
| **ID** | `salesforce` |
| **Category** | crm |
| **Tier** | Enterprise |
| **Auth** | OAuth 2.0 (Salesforce Connected App) |
| **Complexity** | High (7–10 days) |
| **Direction** | Bidirectional |

**Why Enterprise tier:** Salesforce customers are enterprise by definition. This integration justifies the $149/mo tier.

**Why highest complexity:** Salesforce's API is the most complex of any provider. Custom objects, SOQL queries, metadata API, sandbox vs production environments, bulk API for imports.

**Scopes:** `api`, `refresh_token`, `offline_access`

**Outbound (kanNINJA → Salesforce):**
- Card status → update Salesforce opportunity stage
- Card completion → close Salesforce case/opportunity

**Inbound (Salesforce → kanNINJA):**
- Opportunity created → create card
- Opportunity stage change → move card
- Case created → create support card
- Custom SOQL query results → bulk card creation

**Config fields:**
- Salesforce instance URL (auto-detected from OAuth)
- Object type to sync (Opportunities, Cases, or custom object)
- Field mapping (drag-and-drop or table)
- SOQL filter (advanced, optional)

**Env vars:** `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET`

**Token refresh:** Yes — Salesforce tokens expire in ~2 hours. Refresh tokens can be revoked by admin policies.

**Webhook verification:** Salesforce outbound messages use IP allowlist + certificate verification. Platform Events use Streaming API (CometD/Bayeux protocol) or Change Data Capture.

**Implementation notes:**
- Salesforce Connected App setup is complex — extensive setup guide needed
- Sandbox vs Production environments — support both via configurable login URL
- SOQL is Salesforce's query language — may need to expose for power users
- Bulk import uses Salesforce Bulk API 2.0 for large datasets
- Consider using Salesforce Platform Events (pub/sub) instead of outbound messages for real-time sync
- This is the most complex integration — allocate accordingly and consider a phased approach

---

## Tier 6 — AI Amplifiers

### 26. Confluence

| Field | Value |
|-------|-------|
| **ID** | `confluence` |
| **Category** | knowledge |
| **Tier** | Business |
| **Auth** | OAuth 2.0 (Atlassian) |
| **Complexity** | Medium (3–4 days) |
| **Direction** | Primarily inbound |

**Scopes:** `read:confluence-content.all`, `read:confluence-space.summary`

**Inbound (Confluence → kanNINJA):**
- Link Confluence pages to cards (URL → metadata + preview)
- Confluence page updated → notification on linked card
- Search Confluence from card → attach relevant pages

**Outbound (kanNINJA → Confluence):**
- Create Confluence page from card (title + description → page)
- Board summary → Confluence page (weekly auto-generated)

**Config fields:**
- Confluence site URL
- Default space for new pages
- Auto-link toggle

**Env vars:** Shares Atlassian OAuth with Bitbucket/Jira

**Token refresh:** Yes — Atlassian standard

**AI amplification:** Confluence content feeds into AI briefings — "Based on your team's Confluence docs, this card should reference [page]..."

**Implementation notes:**
- Shares Atlassian OAuth app with Jira/Bitbucket — extend scopes
- Confluence Storage Format (XHTML) → markdown conversion needed
- Confluence's search API (`/wiki/rest/api/content/search?cql=...`) is powerful
- AI context: feed page titles + summaries into `getIntegrationContext()`

---

### 27. Google Docs

| Field | Value |
|-------|-------|
| **ID** | `google_docs` |
| **Category** | knowledge |
| **Tier** | Pro |
| **Auth** | OAuth 2.0 (Google) |
| **Complexity** | Low (2 days) |
| **Direction** | Primarily inbound |

**Scopes:** `documents.readonly` (or `drive.file` if sharing Google Drive app)

**Inbound (Google Docs → kanNINJA):**
- Link Google Doc to card (URL → title + thumbnail)
- Doc updated → notification on linked card
- Import Doc content as card description

**Outbound (kanNINJA → Google Docs):**
- Create Google Doc from card description
- Export board summary as Google Doc

**Config fields:**
- Auto-link toggle
- Default folder for created docs

**Env vars:** Shares `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**Token refresh:** Yes — Google standard

**AI amplification:** Doc content feeds into AI briefings — "Your linked doc [title] was updated today..."

**Implementation notes:**
- Shares Google OAuth with Calendar + Gmail + Drive — extend scopes
- Google Docs API returns structured JSON (paragraphs, headings, lists) — convert to markdown
- This is very similar to Google Drive (link files to cards) — consider if it needs its own provider or is just Drive with Docs-specific rendering

---

## New Frontend Icons

Add to `PROVIDER_ICONS` in `ProviderCard.tsx`:

```typescript
// @fortawesome/free-brands-svg-icons
import {
  faSlack, faGithub, faGitlab, faBitbucket,
  faFigma, faLinear, faJira, faDiscord,
  faGoogle, faDropbox, faMicrosoft,
  faIntercom, faHubspot, faSalesforce, faConfluence,
} from '@fortawesome/free-brands-svg-icons';

// @fortawesome/free-solid-svg-icons
import {
  faCalendarDays, faEnvelope, faBook,
  faBolt, faWebhook, faFile, faVideo,
  faClock, faHeadset, faHandshake,
} from '@fortawesome/free-solid-svg-icons';
```

| Provider | Icon | Color |
|----------|------|-------|
| microsoft_teams | `faMicrosoft` | `text-[#6264A7]` |
| outlook | `faMicrosoft` | `text-[#0078D4]` |
| gmail | `faGoogle` | `text-[#EA4335]` |
| notion | `faBook` | `text-base-content` |
| gitlab | `faGitlab` | `text-[#FC6D26]` |
| bitbucket | `faBitbucket` | `text-[#0052CC]` |
| figma | `faFigma` | `text-[#F24E1E]` |
| linear | `faBook` (custom) | `text-[#5E6AD2]` |
| jira | `faJira` | `text-[#0052CC]` |
| zapier | `faBolt` | `text-[#FF4A00]` |
| make | `faBolt` | `text-[#6D00CC]` |
| generic_webhooks | `faPlug` | `text-base-content/60` |
| discord | `faDiscord` | `text-[#5865F2]` |
| google_drive | `faGoogle` | `text-[#0F9D58]` |
| dropbox | `faDropbox` | `text-[#0061FF]` |
| onedrive | `faMicrosoft` | `text-[#094AB2]` |
| loom | `faVideo` | `text-[#625DF5]` |
| toggl | `faClock` | `text-[#E57CD8]` |
| zendesk | `faHeadset` | `text-[#03363D]` |
| intercom | `faIntercom` | `text-[#1F8DED]` |
| hubspot | `faHubspot` | `text-[#FF7A59]` |
| salesforce | `faSalesforce` | `text-[#00A1E0]` |
| confluence | `faConfluence` | `text-[#172B4D]` |
| google_docs | `faGoogle` | `text-[#4285F4]` |

---

## New Categories for `ProviderGrid.tsx`

```typescript
const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  calendar: 'Calendar',
  messaging: 'Messaging',
  devtools: 'Dev Tools',
  email: 'Email',
  knowledge: 'Knowledge',
  'pm-import': 'Import',
  automation: 'Automation',
  design: 'Design',
  files: 'Files',
  media: 'Media',
  'time-tracking': 'Time Tracking',
  support: 'Support',
  crm: 'CRM',
};
```

---

## Environment Variables Summary

| Provider(s) | Env Vars | Notes |
|-------------|----------|-------|
| Google Calendar, Gmail, Drive, Docs | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Shared Google OAuth app |
| Slack | `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET` | Already configured |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_WEBHOOK_SECRET` | Already configured |
| Teams, Outlook, OneDrive | `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Shared Azure AD app |
| Notion | `NOTION_CLIENT_ID`, `NOTION_CLIENT_SECRET` | |
| GitLab | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, `GITLAB_INSTANCE_URL` | Self-hosted support |
| Bitbucket, Jira, Confluence | `ATLASSIAN_CLIENT_ID`, `ATLASSIAN_CLIENT_SECRET` | Shared Atlassian OAuth |
| Figma | `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` | |
| Linear | `LINEAR_CLIENT_ID`, `LINEAR_CLIENT_SECRET` | |
| Discord | `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `DISCORD_PUBLIC_KEY` | 4 vars needed |
| Dropbox | `DROPBOX_CLIENT_ID`, `DROPBOX_CLIENT_SECRET` | |
| Loom | `LOOM_CLIENT_ID`, `LOOM_CLIENT_SECRET` | |
| Toggl | None | Per-user API tokens |
| Zendesk | `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET` | |
| Intercom | `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET` | |
| HubSpot | `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` | |
| Salesforce | `SALESFORCE_CLIENT_ID`, `SALESFORCE_CLIENT_SECRET` | |
| Zapier, Make, Generic Webhooks | None | Uses kanNINJA API keys |

**Total new env vars:** ~25 (many shared across providers in the same ecosystem)

---

## Recommended Build Sequence

### Batch 1: Force Multipliers (Week 1–2)
- **Generic Webhooks** (#15) — L, 1–2 days. Simplest provider, unblocks power users immediately.
- **Zapier** (#13) — M, 4–5 days. Highest leverage — 5000+ app connections.
- **Make** (#14) — M, 3–4 days. Reuses Zapier's webhook subscription system.

### Batch 2: Microsoft Ecosystem (Week 3–4)
- **Microsoft Teams** (#4) — H, 5–7 days. Single Azure AD app for all Microsoft integrations.
- **Outlook** (#5) — M, 3–4 days. Shares Azure AD app, similar to Google Calendar.
- **OneDrive** (#19) — M, 3–4 days. Shares Azure AD app, file picker pattern.

### Batch 3: Dev Tools Clone (Week 5)
- **GitLab** (#8) — L, 1–2 days. Fork GitHub provider.
- **Bitbucket** (#9) — L, 1–2 days. Fork GitHub provider.
- **Discord** (#16) — M, 3–4 days. Fork Slack provider concept.

### Batch 4: Acquisition Engines (Week 6–7)
- **Linear** (#11) — M, 3–4 days. Import wizard.
- **Jira** (#12) — H, 5–7 days. Complex import wizard with ADF conversion.

### Batch 5: Knowledge & Design (Week 8)
- **Notion** (#7) — M, 4–5 days. Block API mapping.
- **Figma** (#10) — M, 3–4 days. Webhook + thumbnail embedding.
- **Google Docs** (#27) — L, 2 days. Extends existing Google OAuth.

### Batch 6: Email & Files (Week 9)
- **Gmail** (#6) — M, 3–4 days. Extends Google OAuth.
- **Google Drive** (#17) — M, 3–4 days. File picker + attachment pattern.
- **Dropbox** (#18) — M, 3 days. Same pattern as Drive.

### Batch 7: Productivity (Week 10)
- **Toggl** (#21) — M, 3–4 days. API key auth, time sync.
- **Loom** (#20) — L, 1–2 days. oEmbed + URL detection.

### Batch 8: Business (Week 11–12)
- **Zendesk** (#22) — M, 3–4 days. Ticket → card mapping.
- **Intercom** (#23) — M, 3–4 days. Conversation → card mapping.
- **HubSpot** (#24) — H, 5–7 days. Deal pipeline mapping.

### Batch 9: Enterprise (Week 13–14)
- **Salesforce** (#25) — H, 7–10 days. Most complex provider.
- **Confluence** (#26) — M, 3–4 days. Shares Atlassian OAuth.

**Total timeline:** ~14 weeks (solo), ~7 weeks (2 devs parallel)

---

## Seed SQL Template

For each new provider, add an INSERT to the seed migration:

```sql
INSERT INTO integration_providers (id, display_name, description, required_tier, category, enabled)
VALUES
  ('microsoft_teams', 'Microsoft Teams', 'Post card updates to Teams channels and create cards from bot commands.', 'pro', 'messaging', false),
  ('outlook', 'Outlook Calendar', 'Sync tasks with due dates to your Outlook calendar.', 'pro', 'calendar', false),
  ('gmail', 'Gmail', 'Create cards from emails and send card notifications.', 'pro', 'email', false),
  ('notion', 'Notion', 'Link Notion pages to cards and sync content.', 'pro', 'knowledge', false),
  ('gitlab', 'GitLab', 'Link merge requests and issues to cards.', 'pro', 'devtools', false),
  ('bitbucket', 'Bitbucket', 'Link pull requests and issues to cards.', 'pro', 'devtools', false),
  ('figma', 'Figma', 'Embed design files and get update notifications.', 'pro', 'design', false),
  ('linear', 'Linear', 'Import issues and sync project status.', 'free', 'pm-import', false),
  ('jira', 'Jira', 'Import issues and migrate your Jira projects.', 'free', 'pm-import', false),
  ('zapier', 'Zapier', 'Connect kanNINJA to 5,000+ apps via Zaps.', 'pro', 'automation', false),
  ('make', 'Make', 'Build powerful automations with Make scenarios.', 'pro', 'automation', false),
  ('generic_webhooks', 'Webhooks', 'Send and receive custom webhook events.', 'pro', 'automation', false),
  ('discord', 'Discord', 'Post card updates to Discord channels.', 'pro', 'messaging', false),
  ('google_drive', 'Google Drive', 'Attach Drive files to cards.', 'clan', 'files', false),
  ('dropbox', 'Dropbox', 'Attach Dropbox files to cards.', 'pro', 'files', false),
  ('onedrive', 'OneDrive', 'Attach OneDrive and SharePoint files to cards.', 'business', 'files', false),
  ('loom', 'Loom', 'Embed Loom recordings in cards.', 'pro', 'media', false),
  ('toggl', 'Toggl Track', 'Sync time entries between kanNINJA and Toggl.', 'pro', 'time-tracking', false),
  ('zendesk', 'Zendesk', 'Create cards from support tickets.', 'business', 'support', false),
  ('intercom', 'Intercom', 'Create cards from customer conversations.', 'business', 'support', false),
  ('hubspot', 'HubSpot', 'Sync deals and contacts with your board.', 'business', 'crm', false),
  ('salesforce', 'Salesforce', 'Sync opportunities and cases with your board.', 'enterprise', 'crm', false),
  ('confluence', 'Confluence', 'Link Confluence pages to cards.', 'business', 'knowledge', false),
  ('google_docs', 'Google Docs', 'Link and create Google Docs from cards.', 'pro', 'knowledge', false)
ON CONFLICT (id) DO NOTHING;
```

Note: All new providers seeded with `enabled = false`. Flip to `true` as each is implemented and tested.
