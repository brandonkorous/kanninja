import type { BoardTemplate } from '../types.js';

export const FREELANCERS_TEMPLATE: BoardTemplate = {
    id: 'freelancers',
    name: 'A board for the work',
    description:
        'Every client, every deadline, the dignity intact. Built for solo work.',
    category: 'solo',
    personaSlug: 'freelancers',
    lists: [
        {
            title: 'Backlog',
            cards: [
                { title: 'Pitch deck for new client' },
                { title: 'Quarterly taxes' },
                { title: 'Acme — landing page round 2' },
                { title: 'Globex — final invoice' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Initech — onboarding deck' },
                { title: 'Acme — copy revisions' },
            ],
        },
        {
            title: 'Waiting on client',
            cards: [
                { title: 'Globex — feedback on hero' },
                { title: 'Initech — brand assets' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Sent invoice — Acme' },
                { title: 'Logged hours — Globex' },
                { title: 'Wrote weekly update' },
            ],
        },
    ],
};
