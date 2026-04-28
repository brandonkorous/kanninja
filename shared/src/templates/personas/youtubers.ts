import type { BoardTemplate } from '../types.js';

export const YOUTUBERS_TEMPLATE: BoardTemplate = {
    id: 'youtubers',
    name: 'A board for the channel',
    description:
        'Scripts, b-roll, the thumbnail you keep redoing. Built for creators who think in episodes.',
    category: 'solo',
    personaSlug: 'youtubers',
    lists: [
        {
            title: 'Ideas',
            cards: [
                { title: 'How I built my home studio' },
                { title: 'Reaction: trending tool of the week' },
                { title: 'Long-form: history of [topic]' },
                { title: 'Tutorial: setup guide' },
            ],
        },
        {
            title: 'Scripting',
            cards: [
                { title: 'Episode 47 — outline' },
                { title: 'Episode 48 — script v2 (need callback rewrite)' },
            ],
        },
        {
            title: 'Shooting / editing',
            cards: [
                { title: 'Ep 46 — first cut (editor: Jamie)' },
                { title: 'Ep 45 — color pass' },
                { title: 'Thumbnail v3' },
            ],
        },
        {
            title: 'Scheduled',
            cards: [
                { title: 'Ep 44 — scheduled Tue 9am' },
            ],
        },
        {
            title: 'Published',
            cards: [
                { title: 'Ep 43 — published' },
                { title: 'Ep 42 — published' },
            ],
        },
    ],
};
