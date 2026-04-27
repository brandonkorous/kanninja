import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/marketing/comparison/ComparisonPage';
import type { ComparisonData } from '@/components/marketing/comparison/types';
import { buildPageMetadata } from '@/lib/seo';

const data: ComparisonData = {
    competitor: 'Notion',
    competitorShort: 'Notion',
    competitorPositioning: 'the connected workspace where better, faster work happens',
    heroSubtitle:
        "Notion is the best tool ever made for thinking on paper. The kanban board is a derived view of a database — and it shows. kanNINJA is what happens when the kanban is the point, not the byproduct.",
    coreDifference:
        "Notion is docs-first; kanban is a layout you choose. kanNINJA is kanban-first; the card is a real object with native real-time, AI, and analytics. Use both — Notion for the writing, kanNINJA for the doing.",
    pickThemIf: [
        "You take notes, write specs, and need them connected to your work.",
        "You're building a wiki or knowledge base for your team.",
        "Your team's working artifacts are docs, not cards.",
        "You're solo and your projects are mostly long-form thinking that occasionally needs a list.",
    ],
    pickUsIf: [
        "You drag a card and want it to move at 60fps, not after a network round-trip.",
        "Real-time presence — seeing teammates move cards live — is part of how you collaborate.",
        "You want time tracking, AI suggestions, and burndown without building them yourself.",
        "The kanban is the work, not a derived view of a doc database.",
    ],
    rows: [
        { feature: 'Free tier', kanninja: 'Yes — forever', competitor: 'Yes — generous for personal' },
        { feature: 'Kanban as primary surface', kanninja: 'Yes — the only surface', competitor: 'A view on a database' },
        { feature: 'Real-time presence on cards', kanninja: 'Yes, native', competitor: 'Limited — works on docs, weaker on board view' },
        { feature: 'Drag latency on the board', kanninja: 'Sub-frame, measured', competitor: 'Noticeable — Notion re-renders the database' },
        { feature: 'AI built in', kanninja: 'Yes — 12 techniques (Pro)', competitor: 'Notion AI (paid add-on)' },
        { feature: 'Time tracking', kanninja: 'Yes, in the card', competitor: 'Build it yourself' },
        { feature: 'Burndown / velocity charts', kanninja: 'Yes, in the box', competitor: 'Build it yourself with formulas' },
        { feature: 'MCP server for AI agents', kanninja: 'Yes — 15 tools', competitor: 'Yes (recently added)' },
        { feature: 'Pricing entry (paid)', kanninja: '$8 / user / month', competitor: '$10 / user / month (Plus)' },
    ],
    faqs: [
        {
            q: 'Can’t I just use Notion’s board view?',
            a: "You can — and many people do. The trade-off is that it's a database underneath, so drag is slower, real-time is weaker, and time tracking and analytics are things you build yourself. If those don't matter, stay with Notion.",
        },
        {
            q: 'Should I drop Notion entirely?',
            a: "No. The pairing we recommend is Notion for docs and specs, kanNINJA for the doing. They're complementary, not competing.",
        },
        {
            q: 'Why is kanNINJA’s board faster?',
            a: "Because the card is a first-class object with its own subscription channel — not a row in a database that has to re-query when anything changes.",
        },
        {
            q: 'Does kanNINJA have docs?',
            a: "Each card has a description that supports rich text, but we don't have wiki-style pages. If documentation is central, keep Notion (or Confluence) for that and use kanNINJA for the work itself.",
        },
        {
            q: 'How does the AI compare to Notion AI?',
            a: "Notion AI writes inside docs and summarizes pages. kanNINJA's AI watches how you move cards and suggests the next move. Different jobs.",
        },
        {
            q: 'Can I import from Notion?',
            a: "Not yet. CSV export from a Notion database + manual paste is the current path. Native import is on the list.",
        },
    ],
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA vs Notion',
    description:
        "Notion is docs-first; kanNINJA is kanban-first. An honest comparison — and why most teams use both.",
    path: '/vs/notion',
    ogTitle: 'kanNINJA vs Notion',
    ogEyebrow: 'Comparison',
    keywords: ['kanNINJA vs Notion', 'Notion alternative', 'kanban for Notion users', 'faster than Notion board'],
});

export default function VsNotionPage() {
    return <ComparisonPage slug="notion" data={data} />;
}
