import type { BoardTemplate } from '../types.js';

export const HOLIDAYS_TEMPLATE: BoardTemplate = {
    id: 'holidays',
    name: 'A board for hosting Thanksgiving for twelve',
    description:
        'Thanksgiving, the holiday party, the in-laws weekend. Hosting without the spiral.',
    category: 'life',
    personaSlug: 'holidays',
    lists: [
        {
            title: 'To do',
            cards: [
                { title: 'Order the turkey' },
                { title: 'Buy place cards and napkins' },
                { title: 'Brine the turkey (Tuesday)' },
                { title: 'Set the table (Wednesday night)' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Grocery run — non-perishables started' },
            ],
        },
        {
            title: 'Waiting on guests or vendors',
            cards: [
                { title: 'Confirm final guest count (3 RSVPs outstanding)' },
                { title: 'Caterer to confirm side-dish menu' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Sent menu to the gluten-free guest' },
                { title: 'Made the cranberry sauce' },
                { title: 'RSVP from in-laws confirmed' },
            ],
        },
    ],
};
