import type { BoardTemplate } from '../types.js';

export const DADS_TEMPLATE: BoardTemplate = {
    id: 'dads',
    name: 'A board for the dad jobs',
    description:
        'The honey-do list, the house projects, and the kid stuff you actually own. Done is a real column.',
    category: 'life',
    personaSlug: 'dads',
    lists: [
        {
            title: 'To do',
            cards: [
                { title: 'Mow the lawn' },
                { title: 'Help Theo build the bird feeder' },
                { title: 'Replace the smoke detector batteries' },
                { title: 'Schedule oil change' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Re-stain the deck' },
                { title: 'Clean out the garage' },
            ],
        },
        {
            title: 'Waiting on parts or help',
            cards: [
                { title: 'Fix the bathroom faucet — need new washers' },
                { title: 'Hardware store run for replacement bulbs' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Built the new shelves in the garage' },
                { title: 'Cleaned the gutters' },
                { title: 'Got the snow tires off' },
            ],
        },
    ],
};
