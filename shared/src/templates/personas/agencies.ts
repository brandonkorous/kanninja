import type { BoardTemplate } from '../types.js';

export const AGENCIES_TEMPLATE: BoardTemplate = {
    id: 'agencies',
    name: 'A board for a client retainer',
    description:
        'A board per client, time tracked on the card. For shops that bill by the hour and ship by the week.',
    category: 'team',
    personaSlug: 'agencies',
    lists: [
        {
            title: 'Backlog',
            cards: [
                { title: 'Q2 social campaign concepts' },
                { title: 'Email automation revamp' },
                { title: 'New blog post: industry trends' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Landing page copy round 2' },
                { title: 'Brand assets export — handoff' },
                { title: 'Weekly status sync prep' },
            ],
        },
        {
            title: 'Client review',
            cards: [
                { title: 'Logo concepts (sent Tue)' },
                { title: 'Q1 report (sent Mon)' },
            ],
        },
        {
            title: 'Shipped',
            cards: [
                { title: 'Homepage redesign (live Mar 14)' },
                { title: 'Q1 retainer billed' },
            ],
        },
    ],
};
