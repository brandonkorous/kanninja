import type { BoardTemplate } from '../types.js';

export const HOME_RENOVATIONS_TEMPLATE: BoardTemplate = {
    id: 'home-renovations',
    name: 'A board for the renovation',
    description:
        'Every room, every contractor, every receipt. The whole project, end to end.',
    category: 'projects',
    personaSlug: 'home-renovations',
    lists: [
        {
            title: 'Planning',
            cards: [
                { title: 'Architect — first meeting' },
                { title: 'Pull permit (city)' },
                { title: 'Get three quotes — general contractor' },
                { title: 'Tile selection at showroom' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Demo — kitchen' },
                { title: 'Plumber rough-in' },
                { title: 'Electrician' },
                { title: 'Order cabinets — 6-week lead time' },
            ],
        },
        {
            title: 'Waiting on',
            cards: [
                { title: 'Inspector — Friday morning' },
                { title: 'Tile shipment — week of Mar 15' },
                { title: 'Final paint approval — partner' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Demo complete' },
                { title: 'Rough plumbing approved' },
                { title: 'Drywall up' },
            ],
        },
    ],
};
