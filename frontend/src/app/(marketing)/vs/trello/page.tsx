import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/marketing/comparison/ComparisonPage';
import type { ComparisonData } from '@/components/marketing/comparison/types';
import { buildPageMetadata } from '@/lib/seo';

const data: ComparisonData = {
    competitor: 'Trello',
    competitorShort: 'Trello',
    competitorPositioning: 'the visual tool that empowers your team',
    heroSubtitle:
        "Trello invented the modern kanban board and it shows. It is simple, free, and beloved. We built kanNINJA because Trello stopped getting better around 2019 — and the work changed.",
    coreDifference:
        "Trello cards are notes on a board. kanNINJA cards are units of work that the AI watches, the team sees move in real time, and the analytics quietly account for. Same shape, different center of gravity.",
    pickThemIf: [
        "You want the simplest possible board with no learning curve.",
        "Your team already lives inside Atlassian (Jira, Confluence) and the integration matters.",
        "You don't need real-time presence, AI suggestions, or proper time tracking.",
        "You're using the free tier and never plan to upgrade — Trello's free tier is genuinely generous.",
    ],
    pickUsIf: [
        "You want AI as a quiet second pair of eyes, not a Power-Up you have to install.",
        "Real-time presence — seeing your teammate move a card as it happens — matters to your workflow.",
        "You'd like time tracking, custom fields, and analytics in the box, not as paid add-ons.",
        "You care about the craft of the tool itself — drag latency, typography, the feel of using it.",
    ],
    rows: [
        { feature: 'Free tier', kanninja: 'Yes — generous on purpose', competitor: 'Yes — limited boards on free' },
        { feature: 'Real-time presence avatars', kanninja: 'Yes, native', competitor: 'No' },
        { feature: 'AI built in', kanninja: 'Yes — 12 techniques (Pro)', competitor: 'Atlassian Intelligence add-on' },
        { feature: 'Time tracking', kanninja: 'Yes, in the card', competitor: 'Power-Up (paid)' },
        { feature: 'Custom fields', kanninja: 'Yes, native', competitor: 'Power-Up (paid)' },
        { feature: 'Cycle time / velocity charts', kanninja: 'Yes, in the box', competitor: 'Power-Up (paid)' },
        { feature: 'MCP server for AI agents', kanninja: 'Yes — 15 tools', competitor: 'No' },
        { feature: 'Drag latency', kanninja: 'Sub-frame, measured in CI', competitor: 'Noticeable on big boards', note: 'Trello’s board view degrades past ~500 cards.' },
        { feature: 'Pricing entry (paid)', kanninja: '$8 / user / month', competitor: '$5 / user / month' },
    ],
    faqs: [
        {
            q: 'Can I import my Trello boards?',
            a: "Not yet. Import is real work and we'd rather build the things you came here for first. For now, the manual copy from Trello is two evenings of work — we won't pretend otherwise.",
        },
        {
            q: 'Is kanNINJA built on Atlassian?',
            a: "No. kanNINJA is independent — built by wizeworks. We have nothing against Atlassian; we just wanted to make different choices about feel and pace.",
        },
        {
            q: 'Why not just use Trello with Power-Ups?',
            a: "You can. The trade-off is that Power-Ups are bolted on — each one has its own settings, its own bills, and its own UI. kanNINJA bakes time tracking, custom fields, presence, and AI into the same surface.",
        },
        {
            q: 'Is your free tier really free?',
            a: "Yes. No card required, no trial that flips to paid, no feature that quietly disables after 14 days. The free tier is generous on purpose.",
        },
        {
            q: 'How does the AI compare to Atlassian Intelligence?',
            a: "Atlassian Intelligence is a sidebar that summarizes. kanNINJA's AI watches how the board actually moves, so it can suggest the next kata in your real workflow — not a generic summary of cards.",
        },
        {
            q: 'Does kanNINJA have a mobile app?',
            a: "Not a native one yet. The web version is mobile-first — touch drag works, the layout adapts, and you can install it as a PWA. Native iOS and Android are on the list.",
        },
    ],
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA vs Trello',
    description:
        "An honest comparison of kanNINJA and Trello. Where Trello still wins, where kanNINJA pulls ahead — real-time presence, native AI, time tracking and analytics in the box.",
    path: '/vs/trello',
    ogTitle: 'kanNINJA vs Trello',
    ogEyebrow: 'Comparison',
    keywords: ['kanNINJA vs Trello', 'Trello alternative', 'better than Trello', 'Trello with AI'],
});

export default function VsTrelloPage() {
    return <ComparisonPage slug="trello" data={data} />;
}
