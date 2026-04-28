import type { BoardTemplate } from '../types.js';

export const REMOTE_TEAMS_TEMPLATE: BoardTemplate = {
    id: 'remote-teams',
    name: 'A board for a 6-person remote team',
    description:
        'Async-friendly comments, time-zone-aware due dates. The board carries the team that does not share a room.',
    category: 'team',
    personaSlug: 'remote-teams',
    lists: [
        {
            title: 'Up for grabs',
            cards: [
                { title: 'Onboarding email copy review' },
                { title: 'Bug triage — backlog' },
                { title: 'Customer interviews summary' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Auth refactor (Maya, US-PT)' },
                { title: 'Pricing page test (Theo, EU-CET)' },
                { title: 'Mobile menu fix (Aki, JP-JST)' },
            ],
        },
        {
            title: 'Needs review',
            cards: [
                { title: 'PR #428 — reviewers: Maya, Theo' },
                { title: 'Design — homepage hero' },
            ],
        },
        {
            title: 'Shipped',
            cards: [
                { title: 'Stripe upgrade' },
                { title: 'Docs site refresh' },
            ],
        },
    ],
};
