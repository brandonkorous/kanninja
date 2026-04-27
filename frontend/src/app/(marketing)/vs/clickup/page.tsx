import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/marketing/comparison/ComparisonPage';
import type { ComparisonData } from '@/components/marketing/comparison/types';
import { buildPageMetadata } from '@/lib/seo';

const data: ComparisonData = {
    competitor: 'ClickUp',
    competitorShort: 'ClickUp',
    competitorPositioning: 'one app to replace them all',
    heroSubtitle:
        "ClickUp's pitch is you'll never need another tool. Some teams genuinely want that. Others — including us — wanted the opposite: one thing, done well, with the discipline to refuse the rest.",
    coreDifference:
        "ClickUp adds. kanNINJA refuses. The result is a smaller surface area that's faster to learn, faster to use, and easier to live with for the long stretch.",
    pickThemIf: [
        "You genuinely want one tool to handle docs, chat, goals, time, and tasks in a single bill.",
        "Your team enjoys the customization rabbit hole and has someone to maintain it.",
        "You need a built-in mind map, whiteboard, or proofing module.",
        "The breadth of features (over 1000 by ClickUp's own count) is a feature, not a bug.",
    ],
    pickUsIf: [
        "You opened ClickUp once and closed it because you couldn't find the actual board.",
        "You'd rather have a sharp tool with four kata than a generalist with forty.",
        "Page load speed and drag latency matter to your day.",
        "You want the AI to be quiet and useful, not omnipresent and pushy.",
    ],
    rows: [
        { feature: 'Free tier', kanninja: 'Yes — forever', competitor: 'Yes — limited features' },
        { feature: 'Number of features', kanninja: 'Few, on purpose', competitor: '1000+ by their count', note: "Breadth is a real choice — for some teams it's the right one." },
        { feature: 'Page load time', kanninja: 'Optimized for first paint', competitor: 'Heavy — many seconds on big workspaces' },
        { feature: 'AI built in', kanninja: 'Yes — 12 techniques (Pro)', competitor: 'ClickUp Brain (paid add-on)' },
        { feature: 'Real-time presence', kanninja: 'Yes, native', competitor: 'Yes' },
        { feature: 'Time tracking', kanninja: 'Yes, in the card', competitor: 'Yes' },
        { feature: 'MCP server for AI agents', kanninja: 'Yes — 15 tools', competitor: 'No' },
        { feature: 'Custom fields', kanninja: 'Yes, native', competitor: 'Yes — extensive' },
        { feature: 'Pricing entry (paid)', kanninja: '$8 / user / month', competitor: '$7 / user / month (Unlimited)' },
    ],
    faqs: [
        {
            q: 'Why would I leave ClickUp for a smaller tool?',
            a: "If you find yourself using 5% of ClickUp and paying for the other 95%, the answer is fewer features done better. If you actually use the breadth, stay with ClickUp.",
        },
        {
            q: 'Does kanNINJA have docs and whiteboards like ClickUp?',
            a: "No, and we won't pretend to. Notion is better for docs; FigJam and Miro are better for whiteboards. We pair instead of replace.",
        },
        {
            q: 'Is your AI as capable as ClickUp Brain?',
            a: "Different shape. Brain summarizes and writes. kanNINJA's AI watches your board and suggests the next kata. Both are useful for different problems.",
        },
        {
            q: 'How is the performance different?',
            a: "kanNINJA targets sub-frame drag latency and renders the board on first paint. ClickUp's first paint on a large workspace can take several seconds — that's the cost of the feature surface.",
        },
        {
            q: 'Can I import from ClickUp?',
            a: "Not yet. CSV export from ClickUp + manual paste is the current path. Import is on the list but not the next thing.",
        },
        {
            q: 'Will kanNINJA grow into an everything app?',
            a: "No. The four kata are the surface area. We plan to make them sharper, not add a fifth.",
        },
    ],
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA vs ClickUp',
    description:
        "ClickUp adds; kanNINJA refuses. An honest comparison of the everything-app and the one-thing-done-well.",
    path: '/vs/clickup',
    ogTitle: 'kanNINJA vs ClickUp',
    ogEyebrow: 'Comparison',
    keywords: ['kanNINJA vs ClickUp', 'ClickUp alternative', 'simpler than ClickUp', 'fast kanban'],
});

export default function VsClickUpPage() {
    return <ComparisonPage slug="clickup" data={data} />;
}
