# MCP Phase 2b — Hosted Remote Server

**Status:** Planned. Not started.
**Priority:** Critical path. The local stdio server (Phase 2a) only reaches developers; the actual ICP — moms, dads, coaches, wedding planners — lives inside Claude.ai and ChatGPT in a browser, neither of which can spawn a subprocess.

## Why this is now urgent

Phase 2a is shipped but reaches a narrow audience. The marketing positioning at `/mcp/for-everyone` assumes a one-click "Connect to ChatGPT" / "Connect to Claude" flow that doesn't exist yet. Until 2b ships, that page is selling a future feature. The companion page makes this honest with a "later this quarter" line, but every week 2b slips is a week the hero use case is broken.

## What we're building

A Streamable HTTP MCP server, OAuth-gated, hosted at `https://mcp.kanninja.com`, listed in:

1. Anthropic's MCP directory (used by Claude.ai's "Add Integration" flow)
2. OpenAI's directory or whatever ChatGPT eventually uses (still emerging)
3. Smithery's hosted tier

Same tool registry as the local stdio server — one tool surface, two transports. The tool definitions in `v2/mcp-server/src/tools/` get reused; only the transport layer is new.

## Architecture

```
[Claude.ai / ChatGPT browser]
       │  HTTPS + OAuth bearer token
       ▼
[ Ingress: mcp.kanninja.com  ]
       │
       ▼
[ MCP HTTP service (new) ]──▶ shared tool registry ──▶ Fastify REST API
       │                            (existing)              (existing)
       │
       ├─▶ OAuth provider endpoints (.well-known/oauth-authorization-server, /authorize, /token)
       └─▶ Backed by Clerk as the actual identity provider
```

Two reasonable shapes for the new service:

**Option A — third Deployment in the existing AKS cluster.** New `Dockerfile.mcp-remote`, new k8s Deployment + Service + Ingress rule for `mcp.kanninja.com`. Reuses the same backend-secrets and Postgres connection. ~150 lines of new infra.

**Option B — new package in the monorepo, embedded inside the existing Fastify backend.** A `/mcp/*` route group in the backend handles MCP-over-HTTP. No new Dockerfile, no new Deployment, just a route. Trade-off: blast radius — a bug in MCP traffic could starve the REST API.

**Recommendation: Option A.** Isolation is worth the small infra cost. The MCP server is a new external surface with new auth flow and new traffic shape; it should fail independently.

## OAuth flow

We need to be an OAuth 2.1 authorization server *for* Claude.ai and ChatGPT. We are *not* asking the user to log into Anthropic — we're asking them to log into kanNINJA from inside the agent's UI.

**The dance:**

1. User clicks "Connect to kanNINJA" inside Claude.ai
2. Claude.ai discovers our authorization server via `https://mcp.kanninja.com/.well-known/oauth-authorization-server`
3. Claude.ai redirects user to our `/authorize` endpoint with PKCE
4. Our `/authorize` endpoint:
   - If user not signed in: redirect to Clerk's hosted sign-in, with a return URL back to `/authorize`
   - If signed in: render a consent screen ("Claude wants to read and modify your boards. Allow?")
5. On consent, redirect back to Claude.ai with an auth code
6. Claude.ai POSTs the code to our `/token` endpoint, gets back an access token + refresh token
7. Claude.ai uses that token as a Bearer header on every MCP request

**Implementation strategy: hybrid OAuth.** Clerk handles the actual sign-in step (so users see the same login UI everywhere), kanNINJA handles OAuth issuance and discovery (so we control the spec-compliance surface).

Flow:
1. Claude.ai redirects to `mcp.kanninja.com/authorize`
2. If no Clerk session, our handler bounces to Clerk's hosted sign-in with a return URL back to `/authorize`
3. After Clerk authenticates, our `/authorize` reads the Clerk session, resolves to `profileId`, renders a Hanko-styled consent screen
4. On consent, we issue a short-lived bearer token (signed JWT or opaque, see below) and redirect back to Claude.ai with the auth code
5. Claude.ai POSTs the code to `mcp.kanninja.com/token`, gets access + refresh tokens

The bearer token we issue maps to `{ profileId, scopes, expiresAt }`. Every MCP request validates through the same code path as the local-stdio API key — both end up returning `{ userId, tier }` to the tool handlers.

Library options for the OAuth issuer side: [`@panva/oauth4webapi`](https://github.com/panva/oauth4webapi) (newer, modular), or [`oidc-provider`](https://github.com/panva/node-oidc-provider) (heavier, batteries-included). Decide at milestone 2 kickoff.

## Scopes

Match the existing role/tier model:

- `read:boards` — every read tool
- `write:tasks` — every write tool
- `ai:capabilities` — Phase 3 AI tools (Pro+)
- `team:read` — clan tools (Team+)
- `integrations:read` — read existing integrations

Coarse-grained on purpose. The web app already enforces RLS at the DB level; scopes here are about what *kind* of action the agent can take, not which specific board.

## Tier gating

Local stdio is free for everyone (we shipped it that way). Hosted remote is the natural place to charge — the infra has a real cost, and the audience that uses it is the audience most willing to pay.

Recommendation:

| Tier | Hosted remote |
|---|---|
| Free | Read-only via remote |
| Pro | Read + write via remote |
| Business | All of the above + AI tools |
| Enterprise | All of the above + clan tools + audit log |

This stays simple for the marketing page and keeps free-tier users on a path that works (they can still connect, they just can't write).

## What needs to ship

### Phase 2b — milestone 1 (MVP, week 1)
- ✅ DNS: `mcp.kanninja.com` record exists
- New Fastify route group at `mcp.kanninja.com/mcp` (or a separate service per Option A)
- Streamable HTTP transport (the current MCP standard for remote)
- Hardcoded test API key auth (NOT OAuth) so we can validate the transport against Claude.ai's MCP debug tools
- All read tools wired up
- Add Ingress rule for the new subdomain (k8s/ingress.yaml — needs a new host + cert via existing cert-manager)
- Verify against `claude mcp add --transport http https://mcp.kanninja.com/mcp`

### Phase 2b — milestone 2 (OAuth, week 2)
- OAuth 2.1 authorization server endpoints: `/authorize`, `/token`, `/.well-known/oauth-authorization-server`
- Clerk integration for the actual login step
- Consent screen at `/authorize` (kanNINJA-branded, Hanko design)
- Refresh token rotation + revocation
- Tier-gated access in the token validator
- Settings UI: "Connected agents" list with revoke button

### Phase 2b — milestone 3 (distribution, week 3)
- Submit to Anthropic MCP directory (one-click connect from Claude.ai)
- Submit to Smithery hosted
- Update `/mcp/for-everyone` to remove "later this quarter" copy and add real "Connect to ChatGPT" / "Connect to Claude" buttons
- Update `/mcp` developer page to mention the hosted alternative

### Phase 2b — milestone 4 (hardening)
- Rate limits per token (separate from REST API limits)
- Audit log entries for every MCP-originated mutation (Team+ tier)
- Metrics dashboard: tokens issued, active connections, tool call rates

## Critical files (when we start)

| Layer | New | Modified |
|---|---|---|
| Infra | `Dockerfile.mcp-remote`, `k8s/mcp-remote-{deployment,service}.yaml`, ingress rule | `k8s/kustomization.yaml`, `.github/workflows/deploy.yml` |
| Backend (or new service) | `mcp-remote/src/index.ts`, OAuth route handlers, scope validator | shared tool registry stays in `v2/mcp-server/src/tools/` |
| Frontend | Connected-agents settings panel, OAuth consent screen | `/mcp/for-everyone` (update CTAs), settings page |
| Shared | OAuth scope enum | — |

## Decisions locked

- ✅ **Service shape:** Option A — separate `mcp` Deployment + Service in AKS, isolated from the REST API.
- ✅ **Subdomain:** `mcp.kanninja.com` (DNS record exists; ingress + cert ready).
- ✅ **OAuth strategy:** Hybrid — Clerk for sign-in UX, kanNINJA for OAuth issuance and discovery.

## Open questions

1. **Token format** — opaque tokens stored server-side, or signed JWTs with claims? Trade-off: revocation complexity vs. database load. Likely answer: short-lived JWTs (5 min) + opaque refresh tokens stored server-side, so revocation is fast and steady-state validation is stateless.
2. **Per-board scopes** — does Anthropic's MCP directory require fine-grained per-resource scopes, or are coarse scopes acceptable? Default to coarse (`read:boards`, `write:tasks`) and revisit if the directory submission flags it.
3. **Streamable HTTP vs SSE** — the spec is in flux. Streamable HTTP is current; SSE is older but more widely deployed. Verify what Claude.ai actually expects in production right now during milestone 1.
4. **DCR support** — Dynamic Client Registration (RFC 7591) is strongly encouraged by the MCP spec. Decide at milestone 2 whether to implement DCR or pre-register Anthropic + OpenAI as clients manually.
5. **Free tier policy** — read-only on remote, or no remote access at all? Plan recommendation: read-only on free, full access on Pro+.
6. **Zapier / Make.com positioning** — those integrations also serve "non-developers in chat-adjacent contexts." How does the MCP story relate to the existing Zapier integration? (Possibly: MCP is the conversational front door, Zapier is the automation back door.)

Once milestone 1 starts, the first half-day is verifying the Streamable-HTTP-vs-SSE question against current Claude.ai behavior. Everything else is implementation against the locked decisions above.
