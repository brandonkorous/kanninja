import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Travelers',
    hero: {
        eyebrow: 'kanNINJA for travel planning',
        headlineBefore: 'The trip,',
        headlineItalic: 'in the order you’ll take it.',
        subtitle:
            'Flights, hotels, the day-by-day. A board for the trip you have been meaning to plan for a year.',
    },
    intro:
        "Travel planning lives in twelve browser tabs. kanNINJA collapses them onto one board — the flights, the hotels, the activities, the reservations someone has to make six months in advance. Then the trip itself becomes a board of its own: day by day, hour by hour, the things you actually want to see.",
    // Sample board lives in @kanninja/shared (templates/personas/travel-planning.ts).
    useCases: [
        {
            title: 'Flights and hotels in one place.',
            body: 'A card per booking. Confirmation numbers, check-in times, the cancellation deadline. The day before the trip, everything is one search away.',
        },
        {
            title: 'Restaurants and activities you have to book early.',
            body: 'The sushi place that requires a reservation a month out. The museum that sells out. A column for "to book" and another for "booked." Nothing slips.',
        },
        {
            title: 'The day-by-day itinerary.',
            body: 'A column per day. Cards for the morning, the afternoon, dinner. Drag to reorder when the rain forecast shifts your plans.',
        },
        {
            title: 'Shared with whoever you are traveling with.',
            body: 'Invite your travel partner. Real-time presence. They can add the museum they want to see. You can add the restaurant. The trip becomes both of yours.',
        },
        {
            title: 'The packing list.',
            body: 'A board for what to pack. Drag cards from "to pack" to "in the bag." The night before, the empty "to pack" column is the answer.',
        },
        {
            title: 'A trip board, already packed.',
            body: 'Start from "A board for a two-week trip to Japan" — visas, bookings, the things you remember at the airport. Swap in your own country.',
        },
    ],
    faqs: [
        {
            q: 'Will it pull my flights and hotels automatically?',
            a: 'No. Calendar and email integrations are on the list. For now, you paste the confirmation number on the card.',
        },
        {
            q: 'Is this better than a Google Doc?',
            a: 'Sometimes. A Google Doc is great for the long itinerary. A board is great for the day-by-day, especially when you are reordering things on the trip itself.',
        },
        {
            q: 'Does it work offline on the trip?',
            a: 'Partially. The app caches the most recent state, so you can see your board on a flight. Edits sync when you get reception again.',
        },
        {
            q: 'Can my travel agent use it?',
            a: 'Yes — invite them by email. Most agents we have talked to prefer it to email threads.',
        },
        {
            q: 'How much does it cost?',
            a: 'Free for the trip. Free for two on a shared board. The paid tiers are for bigger groups — most trips never need them.',
        },
    ],
    close: {
        headlineBefore: 'The trip you keep',
        headlineItalic: 'meaning to plan.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for travel planning',
    description:
        'A kanban for the trip you have been meaning to plan. Flights, hotels, day-by-day, the packing list — all in one place.',
    path: '/for/travel-planning',
    ogTitle: 'kanNINJA for travel planning',
    ogEyebrow: 'For travel',
    keywords: ['travel planning app', 'trip itinerary', 'kanban for travel', 'vacation planner', 'trip organizer'],
});

export default function ForTravelPlanningPage() {
    return <PersonaPage slug="travel-planning" data={data} />;
}
