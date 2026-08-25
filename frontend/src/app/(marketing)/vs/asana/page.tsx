import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/marketing/comparison/ComparisonPage';
import type { ComparisonData } from '@/components/marketing/comparison/types';
import { buildPageMetadata } from '@/lib/seo';

const data: ComparisonData = {
    competitor: 'Asana',
    competitorShort: 'Asana',
    competitorPositioning: 'the work management platform that helps teams orchestrate work',
    heroSubtitle:
        "Asana is what big teams pick when they need timelines, dependencies, and project portfolios. kanNINJA is what they pick when they realize most of the work is just one team, one board, today.",
    coreDifference:
        "Asana is a work management platform — it scales to portfolios and program managers. kanNINJA is a kanban board first, with the analytics small teams need and an open door for their own agent, minus the org-chart machinery they don't.",
    pickThemIf: [
        "You manage portfolios of projects across many teams and need program-level rollups.",
        "Gantt-style timelines and task dependencies are central to how you plan.",
        "You're running enterprise deployments where Asana's permissions and audit features are required.",
        "Your company already pays for Asana and switching costs more than staying.",
    ],
    pickUsIf: [
        "You want a kanban that feels honed, not a configuration of a generic platform.",
        "Your own agent working the card directly — not a separate AI Studio you have to enable.",
        "Real-time presence at the same level as Figma or Linear, not just inbox notifications.",
        "Pricing that doesn't punish you for a single extra seat.",
    ],
    rows: [
        { feature: 'Free tier', kanninja: 'Yes — forever', competitor: 'Yes — up to 10 users' },
        { feature: 'Kanban as primary view', kanninja: 'Yes', competitor: 'One of many views' },
        { feature: 'Real-time presence avatars', kanninja: 'Yes, native', competitor: 'Limited' },
        { feature: 'Built-in AI', kanninja: 'None, deliberately', competitor: 'Asana Intelligence (paid)' },
        { feature: 'Timeline / Gantt', kanninja: 'Not yet', competitor: 'Yes (Premium+)' },
        { feature: 'Task dependencies', kanninja: 'Not yet', competitor: 'Yes' },
        { feature: 'Custom fields', kanninja: 'Yes, native', competitor: 'Yes (Premium+)' },
        { feature: 'Time tracking', kanninja: 'Yes, in the card', competitor: 'Integration only' },
        { feature: 'MCP server for AI agents', kanninja: 'Yes — 42 tools', competitor: 'No' },
        { feature: 'Pricing entry (paid)', kanninja: '$8 / user / month', competitor: '$10.99 / user / month (Starter)' },
    ],
    faqs: [
        {
            q: 'Can kanNINJA replace Asana for a 50-person company?',
            a: "Probably not yet. If you need timelines, dependencies, and portfolio rollups across many teams, Asana is still the more complete answer. kanNINJA is sharpest for teams of 2 to 30 people working board by board.",
        },
        {
            q: 'Does kanNINJA have a timeline view?',
            a: "Not yet. We chose to make the kanban excellent before we added timeline. If timeline is non-negotiable for your team, Asana or Linear are honest answers.",
        },
        {
            q: 'What replaces Asana Intelligence here?',
            a: "Your own agent. Asana Intelligence is a workspace feature flag attached to Asana's model and Asana's bill. kanNINJA ships none — you point Claude, ChatGPT, or Cursor at the board over MCP, and it works in the chat you are already in.",
        },
        {
            q: 'Is your free tier as generous as Asana’s?',
            a: "Yes — and without the 10-user cap. We'd rather have you on the free tier and happy than on a trial that expires.",
        },
        {
            q: 'Can I import Asana projects?',
            a: "Not yet. Import is on the list but it is not the next thing. For now, the manual copy is an evening of work — we won't pretend otherwise.",
        },
        {
            q: 'Do you have an MCP server for Asana agents?',
            a: "Yes, but it serves kanNINJA — Claude, Cursor, or any MCP-aware agent can read your boards and move your kata directly. Asana doesn't currently ship an MCP server.",
        },
    ],
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA vs Asana',
    description:
        "Asana is built for portfolios; kanNINJA is built for one team, one board, today. An honest comparison of where each tool wins.",
    path: '/vs/asana',
    ogTitle: 'kanNINJA vs Asana',
    ogEyebrow: 'Comparison',
    keywords: ['kanNINJA vs Asana', 'Asana alternative', 'better than Asana', 'Asana with kanban'],
});

export default function VsAsanaPage() {
    return <ComparisonPage slug="asana" data={data} />;
}
