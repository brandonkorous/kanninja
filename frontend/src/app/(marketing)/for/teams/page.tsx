import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Small teams',
    hero: {
        eyebrow: 'kanNINJA for small teams',
        headlineBefore: 'A board your team',
        headlineItalic: 'will actually use.',
        subtitle:
            'Real-time presence, 42 MCP tools for your own agent, honest analytics. Built for teams of two to twenty — without the enterprise weight.',
    },
    intro:
        'Most kanban tools were either built for one person or scaled past you to enterprise. kanNINJA is built for the team in between — the duo, the squad, the small product or ops team where every seat is doing real work. The features feel ready on day one, and they stay sharp at thirty seats.',
    // Sample board lives in @kanninja/shared (templates/personas/teams.ts).
    useCases: [
        {
            title: 'A clan per team.',
            body: 'Three roles, no more — owner, member, viewer. Stop fighting the permission tree. The team you invite gets the access they need without a meeting about it.',
        },
        {
            title: 'Real-time presence on every card.',
            body: "When a teammate opens the card you're on, you see their avatar. When they move it, you see it move. The 'who is editing this' question disappears.",
        },
        {
            title: 'Comments and mentions that stay with the work.',
            body: 'Discussion lives on the card. @mention pulls a teammate in. The conversation does not get lost in Slack three weeks later.',
        },
        {
            title: 'Honest analytics.',
            body: 'Burndown, velocity, cycle time. Not because it is a leaderboard — because it is the slope, and the slope tells you the truth.',
        },
        {
            title: 'A product-team board, already shaped.',
            body: 'Start from "A board for a small product team" — the columns that hold up past ten people, without the ceremony that does not.',
        },
        {
            title: 'MCP server for your agents.',
            body: 'Wire kanNINJA into Claude, Cursor, or any agent that speaks MCP. Fifteen tools. The board moves from inside the agent your team already uses.',
        },
    ],
    faqs: [
        {
            q: 'How big can the team get before kanNINJA stops fitting?',
            a: 'It is sharpest from 2 to 30 seats. Beyond 50, you may need cross-board portfolio views that we do not have yet.',
        },
        {
            q: 'Can I have multiple boards per team?',
            a: 'Yes. Most teams run 2 to 5 active boards — a roadmap board, a sprint board, a bugs board. Boards are cheap; make as many as fit your work.',
        },
        {
            q: 'How does it handle permissions?',
            a: 'Three roles per board: owner, member, viewer. Owners can invite and configure; members can move cards and comment; viewers see but cannot edit. Most teams never need more.',
        },
        {
            q: 'How is this different from Linear or Asana for a team?',
            a: 'Linear is opinionated about engineering workflow. Asana is opinionated about portfolio management. kanNINJA is opinionated about the kanban itself — restraint and craft as the design.',
        },
        {
            q: 'How much for a 5-person team?',
            a: 'Free until you outgrow it. The Pro tier is $8 per user per month — about $40 a month for a team of five. Two months free if you pay yearly.',
        },
    ],
    close: {
        headlineBefore: 'A team,',
        headlineItalic: 'in motion.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for small teams',
    description:
        'A kanban built for teams of 2 to 20. Real-time presence, MCP access for your own agent, honest analytics. Without the enterprise weight.',
    path: '/for/teams',
    ogTitle: 'kanNINJA for small teams',
    ogEyebrow: 'For teams',
    keywords: ['kanban for teams', 'small team project management', 'real-time team kanban', 'team collaboration tool', 'agile team board'],
});

export default function ForTeamsPage() {
    return <PersonaPage slug="teams" data={data} />;
}
