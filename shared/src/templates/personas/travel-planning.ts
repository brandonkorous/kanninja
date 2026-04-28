import type { BoardTemplate } from '../types.js';

export const TRAVEL_PLANNING_TEMPLATE: BoardTemplate = {
    id: 'travel-planning',
    name: 'A board for a two-week trip to Japan',
    description:
        'Flights, hotels, the things you have to book early. The trip you have been meaning to plan.',
    category: 'projects',
    personaSlug: 'travel-planning',
    lists: [
        {
            title: 'To research',
            cards: [
                { title: 'Sushi reservation — Sushi Saito' },
                { title: 'Tea ceremony in Kyoto' },
                { title: 'Day trip to Hakone' },
                { title: 'Hotel — Osaka (1 night)' },
            ],
        },
        {
            title: 'Booked',
            cards: [
                { title: 'Flight — SFO to NRT (May 2)' },
                { title: 'Hotel — Tokyo, Park Hyatt' },
                { title: 'Hotel — Kyoto, Hoshinoya' },
                { title: 'JR Pass purchased' },
            ],
        },
        {
            title: 'Confirmed',
            cards: [
                { title: 'Travel insurance' },
                { title: 'Yen ordered for arrival' },
                { title: 'International roaming on phone plan' },
            ],
        },
        {
            title: 'Done',
            cards: [
                { title: 'Passports renewed' },
                { title: 'Vaccinations updated' },
                { title: 'Pet sitter booked' },
            ],
        },
    ],
};
