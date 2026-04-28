import type { BoardTemplate } from '../types.js';

export const MOMS_TEMPLATE: BoardTemplate = {
    id: 'moms',
    name: 'A board for the household',
    description:
        'Pediatrician appointments, school forms, the snack rotation, the dog. The mental load on paper.',
    category: 'life',
    personaSlug: 'moms',
    lists: [
        {
            title: 'To do',
            cards: [
                { title: 'Pediatrician — Theo (Tuesday 2pm)' },
                { title: 'Field-trip permission slip — Maya' },
                { title: 'Buy birthday gift for Sam (party Saturday)' },
                { title: 'Pick up dry cleaning' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: "Planning Maya's birthday party" },
            ],
        },
        {
            title: 'Waiting on',
            cards: [
                { title: 'School portrait order confirmation' },
                { title: 'Dentist to call back about insurance' },
                { title: 'Mom group RSVPs for Thursday' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: "Kids' haircuts" },
                { title: 'Renewed library cards' },
                { title: 'Made the casserole for the new neighbor' },
            ],
        },
    ],
};
