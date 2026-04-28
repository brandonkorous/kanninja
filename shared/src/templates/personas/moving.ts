import type { BoardTemplate } from '../types.js';

export const MOVING_TEMPLATE: BoardTemplate = {
    id: 'moving',
    name: 'A board for the move',
    description:
        'Boxes, utilities, address changes, the cat. Every task, with the date on the card.',
    category: 'projects',
    personaSlug: 'moving',
    lists: [
        {
            title: 'To do',
            cards: [
                { title: 'Choose movers — get three quotes' },
                { title: 'Notify landlord (or list current home)' },
                { title: 'Start packing the basement' },
                { title: 'Pack the kitchen' },
                { title: 'Final walkthrough' },
            ],
        },
        {
            title: 'Scheduled',
            cards: [
                { title: 'Movers — Saturday 8am' },
                { title: 'Vet appointment for the cat — Wednesday' },
                { title: 'Utility transfer — gas + electric (Thursday)' },
                { title: 'Internet activation at new address' },
            ],
        },
        {
            title: 'Waiting on third party',
            cards: [
                { title: 'USPS mail-forwarding confirmation' },
                { title: 'Insurance update — callback' },
                { title: 'School transfer paperwork (kids)' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Submitted USPS mail forward' },
                { title: 'Defrosted the fridge' },
                { title: 'Got the new keys' },
            ],
        },
    ],
};
