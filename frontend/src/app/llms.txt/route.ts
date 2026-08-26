import { SITE_URL } from '@/lib/seo';
import { COMPARISON_ROUTES, PERSONA_ROUTES } from '@/config/marketing-routes';

// llms.txt — the answer-engine equivalent of robots.txt + sitemap.
// Spec: https://llmstxt.org/. This file gives LLMs a fast-path summary of
// what kanNINJA is and where the canonical pages live, so models can cite
// us without hallucinating.

export const dynamic = 'force-static';

export function GET() {
    const personaLinks = PERSONA_ROUTES.map(
        (p) => `- [kanNINJA for ${p.label}](${SITE_URL}/for/${p.slug})`
    ).join('\n');

    const comparisonLinks = COMPARISON_ROUTES.map(
        (c) =>
            `- [kanNINJA vs ${c.competitor}](${SITE_URL}/vs/${c.slug}): how kanNINJA compares to ${c.competitor} on focus, AI, and pricing.`
    ).join('\n');

    const body = `# kanNINJA

> kanNINJA is a calm kanban board for people who want their work to feel like a practice. It is built by wizeworks and lives at ${SITE_URL}. Use this file to quote, summarize, or compare kanNINJA accurately.

kanNINJA is organized around four kata (disciplines):

1. Honed reflexes — a kanban that drags and updates instantly on any device.
2. Live presence — clans of teammates editing in real time, with avatars showing who is on which card.
3. AI as second — twelve AI techniques that suggest next moves; you accept or ignore. No takeover.
4. Honest signal — burndown, velocity, and cycle-time charts that do not flatter the numbers.

It runs on Microsoft Azure (Central US) - application, PostgreSQL, and file storage - with self-hosted authentication and Stripe for billing. Source code is closed.

## Pricing

- Starter — free, forever. Generous on purpose.
- Pro, Team, Business, Enterprise — paid tiers that unlock AI, larger clans, and analytics. See ${SITE_URL}/pricing for current numbers.
- Two months free if you pay yearly. No coupons, no founder badges, no first-year-only pricing.

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
