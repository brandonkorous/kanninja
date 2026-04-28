import type { BoardTemplate } from '../types.js';

export const REALTORS_TEMPLATE: BoardTemplate = {
    id: 'realtors',
    name: 'A board for the pipeline',
    description:
        'Every transaction and every deadline. From prospect to closed.',
    category: 'solo',
    personaSlug: 'realtors',
    lists: [
        {
            title: 'Prospects',
            cards: [
                { title: 'Smith family — buying, first call' },
                { title: 'Garcia — selling, listing prep' },
                { title: 'Open-house leads from Sunday' },
            ],
        },
        {
            title: 'Active listings',
            cards: [
                { title: '142 Oak — listed Tue' },
                { title: '88 Pine — under offer review' },
                { title: '401 Elm — price reduced' },
            ],
        },
        {
            title: 'Under contract',
            cards: [
                { title: '1820 Birch — inspection scheduled' },
                { title: '99 Maple — appraisal Mon' },
            ],
        },
        {
            title: 'Pending close',
            cards: [
                { title: '4521 Cedar — closing Friday 10am' },
                { title: '7 Hickory — final walkthrough Tue' },
            ],
        },
        {
            title: 'Closed',
            cards: [
                { title: '232 Ash' },
                { title: '19 Walnut' },
                { title: '510 Sycamore' },
            ],
        },
    ],
};
