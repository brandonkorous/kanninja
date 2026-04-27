import type { Metadata } from 'next';
import { ComparisonPage } from '@/components/marketing/comparison/ComparisonPage';
import type { ComparisonData } from '@/components/marketing/comparison/types';
import { buildPageMetadata } from '@/lib/seo';

const data: ComparisonData = {
    competitor: 'Monday.com',
    competitorShort: 'Monday',
    competitorPositioning: 'the work platform you can build anything on',
    heroSubtitle:
        "Monday is a spreadsheet that learned to be every other tool. That breadth is its gift and its curse. kanNINJA picks the kanban half and sharpens it instead of branching out.",
    coreDifference:
        "Monday rewards configuration — boards become whatever you build with formulas, automations, and integrations. kanNINJA rewards restraint — you get a board, the AI, the analytics, and the presence layer with nothing to wire up.",
    pickThemIf: [
        "You want a single tool that becomes your CRM, ticket system, and project tracker.",
        "Your team enjoys building dashboards, formulas, and automation recipes.",
        "You need WorkForms, WorkDocs, and the broader Monday product line in one bill.",
        "Branding the workspace and customizing the colors per board matters.",
    ],
    pickUsIf: [
        "You don't want to spend a weekend configuring before the team can start working.",
        "The default kanban view should feel finished, not like a starting kit.",
        "AI should suggest the next move on the card you're looking at, not generate a column.",
        "Pricing should be predictable, not climb with every feature you actually need.",
    ],
    rows: [
        { feature: 'Free tier', kanninja: 'Yes — forever', competitor: 'Yes — 2 users only' },
        { feature: 'Kanban as primary view', kanninja: 'Yes', competitor: 'One of many views' },
        { feature: 'Real-time presence avatars', kanninja: 'Yes, native', competitor: 'Yes' },
        { feature: 'AI built in', kanninja: 'Yes — 12 techniques (Pro)', competitor: 'AI Assistant (paid add-on)' },
        { feature: 'Time tracking', kanninja: 'Yes, in the card', competitor: 'Yes (Pro+)' },
        { feature: 'Custom fields', kanninja: 'Yes, native', competitor: 'Yes — extensive' },
        { feature: 'Automations', kanninja: 'Not yet', competitor: 'Yes — limited per tier' },
        { feature: 'MCP server for AI agents', kanninja: 'Yes — 15 tools', competitor: 'No' },
        { feature: 'Pricing entry (paid)', kanninja: '$8 / user / month', competitor: '$9 / user / month (3-seat min)' },
    ],
    faqs: [
        {
            q: 'Does kanNINJA have automations like Monday?',
            a: "Not yet. Monday's automation builder is one of its strongest features and we won't pretend ours is comparable. If automation recipes are central to your work, Monday is the honest answer.",
        },
        {
            q: 'Can I use kanNINJA as a CRM or HR tracker?',
            a: "We don't position it that way. You can absolutely run a sales pipeline as a board, but Monday is built to be reshaped into anything — kanNINJA is built to be a great kanban specifically.",
        },
        {
            q: 'Why is Monday’s 3-seat minimum a big deal?',
            a: "If you're a freelancer or duo, you pay for three seats either way. kanNINJA bills per seat, with no minimum — solo users pay for one seat.",
        },
        {
            q: 'Is your AI as capable as Monday’s AI Assistant?',
            a: "Different shape. Monday's AI generates content (status updates, formulas, board templates). kanNINJA's AI watches how you actually work and suggests the next kata. Both are useful — they answer different questions.",
        },
        {
            q: 'Can I migrate from Monday?',
            a: "Not with a one-click import yet. We'd rather build the things you came here for first. CSV export from Monday + manual paste is the current path.",
        },
        {
            q: 'Does the Hanko design system feel anything like Monday’s colors?',
            a: "No — and that's deliberate. Monday is bright and rainbow-tinted. kanNINJA is cream paper, sumi ink, one vermillion stamp. The look matches the philosophy.",
        },
    ],
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA vs Monday.com',
    description:
        "Monday is breadth; kanNINJA is depth on the kanban half. An honest comparison: where Monday's customization wins, where kanNINJA's restraint pays off.",
    path: '/vs/monday',
    ogTitle: 'kanNINJA vs Monday.com',
    ogEyebrow: 'Comparison',
    keywords: ['kanNINJA vs Monday', 'Monday.com alternative', 'better than Monday', 'simpler than Monday'],
});

export default function VsMondayPage() {
    return <ComparisonPage slug="monday" data={data} />;
}
