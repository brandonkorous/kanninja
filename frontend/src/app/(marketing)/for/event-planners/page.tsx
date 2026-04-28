import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Event planners',
    hero: {
        eyebrow: 'kanNINJA for event planners',
        headlineBefore: 'The event,',
        headlineItalic: 'every step.',
        subtitle:
            'Vendors, run-of-show, the day-of timeline. A board for the conference, the gala, the launch — built for planners who run several at once.',
    },
    intro:
        "An event is a project where the deadline is also the show. Vendors, contracts, the run-of-show, the morning-of fire drill. We built kanNINJA so the planner can see all of it at once — and so the assistant, the venue, and the AV team can all see the same plan.",
    // Sample board lives in @kanninja/shared (templates/personas/event-planners.ts).
    useCases: [
        {
            title: 'The vendor matrix.',
            body: 'Every vendor as a card. Contract status, payment status, load-in time. The morning of the event, the vendor list IS the schedule.',
        },
        {
            title: 'The run of show, on its own board.',
            body: 'Day-of has a different shape — a board where each segment is a card, ordered by the clock: time, speaker, AV cue. The planning board stays a kanban; the run of show is a timeline. Same product, different board.',
        },
        {
            title: 'Multiple events at once.',
            body: 'A board per event. Switch between them in the sidebar. The work for next month does not bleed into the work for next week.',
        },
        {
            title: 'Working with your assistant and the venue.',
            body: 'Invite them. Real-time presence. The morning-of update happens on the board — not in a 30-message text thread.',
        },
        {
            title: 'Speaker and guest management.',
            body: 'A card per speaker — bio, headshot, hotel, dietary restrictions, A/V needs. Send the green room a clean version the day before.',
        },
        {
            title: 'AI for breaking down the next event.',
            body: 'Ask the AI to break down "200-person conference" into cards. Edit for your venue and audience. Six hours of planning becomes ninety minutes.',
        },
    ],
    faqs: [
        {
            q: 'Can my client see the board?',
            a: 'Yes — share a read-only view. Most planners we work with share a client board for transparency on vendor status, and keep an internal board for the messier work.',
        },
        {
            q: 'Does it handle attendee registration?',
            a: 'No. Pair it with Eventbrite, Hopin, or a registration tool. Attendees go on the card; the actual registration system handles the tickets and the badges.',
        },
        {
            q: 'Can I print the run-of-show for the day?',
            a: 'Not natively yet. Most planners screenshot the column or copy it to a doc for the printed version.',
        },
        {
            q: 'How much does it cost?',
            a: 'Free for solo planners. The paid tier helps if you regularly run events with assistants and large vendor teams — still less than one round of name badges.',
        },
        {
            q: 'Is there a template for a wedding or conference?',
            a: 'Not yet — but the AI gets you most of the way from a one-line description. Templates are on the list.',
        },
    ],
    close: {
        headlineBefore: 'The day,',
        headlineItalic: 'flawless.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for event planners',
    description:
        'A kanban for the conference, the gala, the launch. Vendors, run-of-show, the day-of timeline — for planners who run several at once.',
    path: '/for/event-planners',
    ogTitle: 'kanNINJA for event planners',
    ogEyebrow: 'For event planners',
    keywords: ['event planning software', 'kanban for events', 'conference planning app', 'event management tool', 'run of show app'],
});

export default function ForEventPlannersPage() {
    return <PersonaPage slug="event-planners" data={data} />;
}
