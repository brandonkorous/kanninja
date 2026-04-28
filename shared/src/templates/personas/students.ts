import type { BoardTemplate } from '../types.js';

export const STUDENTS_TEMPLATE: BoardTemplate = {
    id: 'students',
    name: 'A board for the semester',
    description:
        'Classes, papers, group projects, the thesis. The next assignment is always one drag away.',
    category: 'life',
    personaSlug: 'students',
    lists: [
        {
            title: 'To do',
            cards: [
                { title: 'CS problem set #4 (due Friday)' },
                { title: 'Office hours — Prof. Liu' },
                { title: 'Bio reading: chapters 7–9' },
            ],
        },
        {
            title: 'Drafting / studying',
            cards: [
                { title: 'History essay outline (due Tuesday)' },
                { title: 'Lit review for thesis' },
                { title: 'Group project — slides for Marco' },
                { title: 'Lab writeup #3' },
            ],
        },
        {
            title: 'Submitted',
            cards: [
                { title: 'Calc problem set #3' },
            ],
        },
        {
            title: 'Graded',
            cards: [
                { title: 'Bio quiz #2' },
                { title: 'Stats midterm' },
            ],
        },
    ],
};
