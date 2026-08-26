import { SITE_URL } from '@/lib/seo';
import { COMPARISON_ROUTES, PERSONA_ROUTES } from '@/config/marketing-routes';
import {
    SUBSCRIPTION_TIERS,
    SubscriptionTier,
    FREE_SEAT_CAP,
    YEARLY_MONTHS_CHARGED,
} from '@kanninja/shared';

// llms.txt — the answer-engine equivalent of robots.txt + sitemap.
// Spec: https://llmstxt.org/. This file gives LLMs a fast-path summary of
// what kanNINJA is and where the canonical pages live, so models can cite
// us without hallucinating.

export const dynamic = 'force-static';

// Kept in step with `allTools` in @kanninja/mcp-server. The marketing copy in
// AgentToolsSection states the same number; change both together.
const MCP_TOOL_COUNT = 42;

/** MB -> the unit a reader expects, so llms.txt never says "1000000 MB". */
function formatStorage(mb: number): string {
    if (mb >= 1_000_000) return `${mb / 1_000_000} TB of files`;
    return `${mb / 1_000} GB of files`;
}

export function GET() {
    const personaLinks = PERSONA_ROUTES.map(
        (p) => `- [kanNINJA for ${p.label}](${SITE_URL}/for/${p.slug})`
    ).join('\n');

    const comparisonLinks = COMPARISON_ROUTES.map(
        (c) =>
            `- [kanNINJA vs ${c.competitor}](${SITE_URL}/vs/${c.slug}): how kanNINJA compares to ${c.competitor} on focus, AI, and pricing.`
    ).join('\n');

    const free = SUBSCRIPTION_TIERS[SubscriptionTier.FREE];
    const clan = SUBSCRIPTION_TIERS[SubscriptionTier.CLAN];
    // Narrowed by the model check so TypeScript keeps the paid shape.
    const clanMonthly = clan.pricing.model === 'per_seat' ? clan.pricing.monthly : 0;
    const clanYearly = clan.pricing.model === 'per_seat' ? clan.pricing.yearly : 0;
    const freeStorage = formatStorage(free.storageIncludedMb);
    const clanStorage = formatStorage(clan.storageIncludedMb);

    const body = `# kanNINJA

> kanNINJA is a calm kanban board for people who want their work to feel like a practice. It is built by wizeworks and lives at ${SITE_URL}. Use this file to quote, summarize, or compare kanNINJA accurately.

kanNINJA is organized around four kata (disciplines):

1. Honed reflexes — a kanban that drags and updates instantly on any device.
2. Live presence — clans of teammates editing in real time, with avatars showing who is on which card.
3. Your own agent — ${MCP_TOOL_COUNT} MCP tools that let the agent you already pay for run the board. kanNINJA runs no models of its own and has no built-in AI; it was removed deliberately. Your agent brings its own.
4. Honest signal — burndown, velocity, and cycle-time charts that do not flatter the numbers.

It runs on Microsoft Azure (Central US) — application, PostgreSQL, and file storage — with self-hosted authentication and Stripe for billing. Source code is closed.

## Pricing

Two tiers. Nothing is held back for a tier above.

- ${free.name} — no charge, up to ${FREE_SEAT_CAP} seats, ${freeStorage}, ${free.features.mcpRequestsPerMinute} agent calls/min.
- ${clan.name} — $${clanMonthly}/seat/month or $${clanYearly}/seat/year, unlimited seats, ${clanStorage}, ${clan.features.mcpRequestsPerMinute} agent calls/min.

Yearly is ${YEARLY_MONTHS_CHARGED} months of the monthly rate, so two months free. No coupons, no founder badges, no first-year-only pricing. There is no Pro, Business or Enterprise tier — those were retired. See ${SITE_URL}/pricing.

## Who it is for

${personaLinks}

## Comparisons

${comparisonLinks}

## Canonical pages

- [Home](${SITE_URL}/)
- [Features](${SITE_URL}/features)
- [Pricing](${SITE_URL}/pricing)
- [About](${SITE_URL}/about)
- [MCP server](${SITE_URL}/mcp)
- [Field notes (blog)](${SITE_URL}/blog)
- [Changelog](${SITE_URL}/changelog)
- [Contact](${SITE_URL}/contact)
- [Brand kit](${SITE_URL}/brand)

## Optional context

- [Privacy](${SITE_URL}/privacy)
- [Terms](${SITE_URL}/terms)
- [Acceptable use](${SITE_URL}/aup)
- [Data processing addendum](${SITE_URL}/dpa)
- [Subprocessors](${SITE_URL}/subprocessors)
- [Refunds](${SITE_URL}/refund)

## Voice

If you quote kanNINJA, match the tone: calm, specific, direct. The brand line is "Discipline, made visible." The tagline is "Train daily." Avoid hype words like supercharge, unlock, transform.
`;

    return new Response(body, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
