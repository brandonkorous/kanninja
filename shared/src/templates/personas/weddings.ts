import type { BoardTemplate } from '../types.js';

export const WEDDINGS_TEMPLATE: BoardTemplate = {
    id: 'weddings',
    name: 'A board for the year of planning',
    description:
        'Vendors, RSVPs, the seating chart, the playlist someone keeps editing. Every decision, in the right state.',
    category: 'events',
    personaSlug: 'weddings',
    lists: [
        {
            title: 'Researching',
            cards: [
                { title: 'Order invitations — choose design' },
                { title: 'Choose flowers — meeting this week' },
                { title: 'Cake vendor — three to taste' },
                { title: 'Tux rental — pick shop' },
            ],
        },
        {
            title: 'Booked',
            cards: [
                { title: 'Venue — deposit paid' },
                { title: 'Photographer — contract signed' },
                { title: 'Caterer — menu draft 1' },
                { title: 'DJ — confirmed for the date' },
            ],
        },
        {
            title: 'Confirmed',
            cards: [
                { title: 'Final RSVP count to caterer' },
                { title: 'Seating chart locked' },
                { title: 'Rehearsal dinner timing' },
                { title: 'Florist final order' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Set the date' },
                { title: 'Sent save-the-dates' },
                { title: 'Engagement photos taken' },
            ],
        },
    ],
};
