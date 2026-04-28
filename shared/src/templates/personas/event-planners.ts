import type { BoardTemplate } from '../types.js';

export const EVENT_PLANNERS_TEMPLATE: BoardTemplate = {
    id: 'event-planners',
    name: 'A board for a 200-person conference',
    description:
        'Vendors, run-of-show, the day-of timeline. The conference, the gala, the launch.',
    category: 'events',
    personaSlug: 'event-planners',
    lists: [
        {
            title: 'Backlog',
            cards: [
                { title: 'Q3 brand launch — concept brief' },
                { title: 'Internal client offsite — venue scout' },
                { title: 'Speaker shortlist for fall summit' },
            ],
        },
        {
            title: 'In progress',
            cards: [
                { title: 'Lock the venue contract' },
                { title: 'AV walkthrough — schedule' },
                { title: 'Send invites — first wave' },
            ],
        },
        {
            title: 'Awaiting vendor',
            cards: [
                { title: 'Caterer — final menu draft' },
                { title: 'Florist — quote' },
                { title: 'Photographer — confirmation' },
            ],
        },
        {
            title: 'Locked',
            cards: [
                { title: 'AV — load-in 6am Saturday' },
                { title: 'Catering — final headcount sent' },
                { title: 'Speaker green room — water, snacks' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Venue contract signed' },
                { title: 'Save-the-dates sent' },
            ],
        },
    ],
};
