// Generic, audience-agnostic templates — the dev/PM kanban classics. Cards
// here are seeded in their authored columns; the apply flow pools them into
// the first list because a brand-new board has nothing in progress yet.

import type { BoardTemplate } from './types.js';

export const CLASSIC_TEMPLATES: BoardTemplate[] = [
    {
        id: 'agile-sprint',
        name: 'Agile Sprint',
        description:
            'Backlog through done — the standard sprint board for engineering teams.',
        category: 'classic',
        lists: [
            {
                title: 'Backlog',
                cards: [
                    { title: 'User auth — sign-in flow', priority: 'high' },
                    { title: 'User auth — password reset', priority: 'medium' },
                    { title: 'Onboarding — first-run tour' },
                    { title: 'Settings — profile photo upload' },
                    {
                        title: 'API — rate-limit errors return 429',
                        priority: 'high',
                    },
                    {
                        title: 'Bug — calendar timezone drift',
                        priority: 'urgent',
                    },
                    { title: 'Refactor — extract toast provider' },
                ],
            },
            { title: 'To Do', cards: [] },
            { title: 'In Progress', cards: [] },
            { title: 'Review', cards: [] },
            { title: 'Done', cards: [] },
        ],
    },
    {
        id: 'simple-kanban',
        name: 'Simple Kanban',
        description:
            'Three columns. Drag cards across them. The whole product on day one.',
        category: 'classic',
        lists: [
            {
                title: 'To Do',
                cards: [
                    { title: 'Replace this card with your first kata' },
                    { title: "Drag a card to 'Doing' when you start it" },
                    { title: "Drag it to 'Done' when it's finished" },
                ],
            },
            { title: 'Doing', cards: [] },
            { title: 'Done', cards: [] },
        ],
    },
    {
        id: 'content-pipeline',
        name: 'Content Pipeline',
        description:
            'Track posts, videos, and newsletters from idea to published.',
        category: 'classic',
        lists: [
            {
                title: 'Ideas',
                cards: [
                    { title: "Post — 'How we shipped X this quarter'" },
                    { title: 'Video — behind-the-scenes of the redesign' },
                    { title: 'Newsletter — Q2 wrap-up' },
                    { title: 'Tutorial — getting started with the API' },
                    { title: 'Interview — guest post from a customer' },
                ],
            },
            { title: 'Drafting', cards: [] },
            { title: 'Editing', cards: [] },
            { title: 'Scheduled', cards: [] },
            { title: 'Published', cards: [] },
        ],
    },
    {
        id: 'bug-tracker',
        name: 'Bug Tracker',
        description: 'Triage, track, and close out bugs with a clear flow.',
        category: 'classic',
        lists: [
            {
                title: 'Reported',
                cards: [
                    {
                        title: 'Date picker shows wrong month on Safari',
                        priority: 'medium',
                    },
                    {
                        title: 'Login redirects to /home instead of /dashboard',
                    },
                    {
                        title: 'CSV export drops the last row',
                        priority: 'high',
                    },
                    {
                        title: "Mobile menu won't close after route change",
                    },
                    {
                        title: 'Welcome email sometimes sends twice',
                        priority: 'urgent',
                    },
                ],
            },
            { title: 'Triaged', cards: [] },
            { title: 'In Progress', cards: [] },
            { title: 'Testing', cards: [] },
            { title: 'Resolved', cards: [] },
        ],
    },
    {
        id: 'product-launch',
        name: 'Product Launch',
        description:
            'Coordinate planning, build, marketing, and post-launch follow-up.',
        category: 'classic',
        lists: [
            {
                title: 'Planning',
                cards: [
                    { title: 'Define launch goals & success metrics' },
                    { title: 'Lock the launch date' },
                    { title: 'Identify the target audience' },
                ],
            },
            {
                title: 'Development',
                cards: [
                    { title: 'Build the landing page' },
                    { title: 'Wire up analytics & tracking' },
                ],
            },
            {
                title: 'Marketing',
                cards: [
                    { title: 'Write the launch announcement' },
                    { title: 'Schedule social posts' },
                    { title: 'Brief the press / partners' },
                ],
            },
            {
                title: 'QA',
                cards: [
                    {
                        title: 'Full regression on staging',
                        priority: 'high',
                    },
                    { title: 'Cross-browser smoke test' },
                ],
            },
            {
                title: 'Launch',
                cards: [
                    { title: 'Flip the feature flag' },
                    { title: 'Send the announcement email' },
                    { title: 'Monitor errors for the first 24h' },
                ],
            },
            {
                title: 'Post-launch',
                cards: [
                    { title: 'Collect feedback after week 1' },
                    { title: 'Retrospective with the team' },
                ],
            },
        ],
    },
];
