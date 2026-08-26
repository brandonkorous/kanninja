import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Remote teams',
    hero: {
        eyebrow: 'kanNINJA for remote teams',
        headlineBefore: 'The work shows up,',
        headlineItalic: 'even when no one does.',
        subtitle:
            'Real-time presence, async-friendly comments, time-zone-aware due dates. Built so the board carries the team that does not share a room.',
    },
    intro:
        "Remote work fails when the work depends on people being online at the same time. kanNINJA is built so the board holds the context — the comments, the decisions, the next move — even when half the team is asleep. When someone wakes up, the board tells them what happened. When they go offline, the board carries the work forward.",
    // Sample board lives in @kanninja/shared (templates/personas/remote-teams.ts).
    useCases: [
        {
            title: 'Async-friendly comments.',
            body: 'Discussion lives on the card. The comment thread is the meeting that did not need to happen. The teammate in Tokyo wakes up to the answer, not a calendar invite.',
        },
        {
            title: 'Time-zone-aware due dates.',
            body: 'A due date is in the workspace timezone, not the server timezone. Nobody in EU misses a deadline because the date showed UTC.',
        },
        {
            title: 'Real-time presence when overlap exists.',
            body: 'The two-hour window when US-PT and EU overlap is precious. Real-time presence makes that window feel like sitting next to each other.',
        },
        {
            title: 'A handoff column for time-zone rolls.',
            body: 'A column called "for overnight" with cards the next region picks up. The team becomes a 24-hour pipeline instead of a 9-to-5 one.',
        },
        {
            title: 'A remote-team board, already shaped.',
            body: 'Start from "A board for a 6-person remote team" — the columns that survive timezones, and nothing that needs a meeting to update.',
        },
        {
            title: 'MCP server for the agent that lives in your team chat.',
            body: 'Wire the MCP server into the team-wide Claude or Slack agent. Anyone can ask "what shipped overnight?" and get a real answer from the board.',
        },
    ],
    faqs: [
        {
            q: 'Does it have a daily summary email?',
            a: 'Not yet. Daily digests are on the list. For now the audit log covers most of the same need — or point your own agent at the board and ask it.',
        },
        {
            q: 'Can I scope notifications by time zone?',
            a: 'Notifications respect quiet hours per user. Each teammate sets their own. Nobody gets pinged at 2am because someone in another region moved a card.',
        },
        {
            q: 'Does it integrate with Slack or Discord?',
            a: 'Slack and Discord notifications for board events are on the list. For now, presence and comments live in the app.',
        },
        {
            q: 'How does this compare to Linear for a remote team?',
            a: 'Linear is excellent for engineering teams. kanNINJA is more general — it works for ops, marketing, and design teams that want the same craft without the engineering vocabulary.',
        },
        {
            q: 'How much for a 10-person remote team?',
            a: 'The Clan plan: $12 per seat per month, so $120 a month for ten. Two months free if billed yearly.',
        },
    ],
    close: {
        headlineBefore: 'A team,',
        headlineItalic: 'time-zone fluent.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for remote teams',
    description:
        'A kanban built for teams that do not share a room. Real-time presence, async comments, time-zone-aware due dates. The board carries the team.',
    path: '/for/remote-teams',
    ogTitle: 'kanNINJA for remote teams',
    ogEyebrow: 'For remote teams',
    keywords: ['kanban for remote teams', 'async project management', 'distributed team tool', 'remote work software', 'time zone team tool'],
});

export default function ForRemoteTeamsPage() {
    return <PersonaPage slug="remote-teams" data={data} />;
}
