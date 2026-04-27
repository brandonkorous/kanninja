import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Moms',
    hero: {
        eyebrow: 'kanNINJA for moms',
        headlineBefore: 'The endless to-do list,',
        headlineItalic: 'made calm.',
        subtitle:
            "Pediatrician appointments, school forms, the snack rotation, the dog. A board for the household, so the mental load lives somewhere besides your head.",
    },
    intro:
        "Most kanban tools were built for software teams. We built kanNINJA so it works just as well for the person running a household. One board for the kids, one for the house, one for everything you swore you'd remember and didn't. The columns are yours. The cards are yours. The mental load goes on paper — finally.",
    sampleBoard: {
        title: 'A board for the household.',
        columns: [
            {
                name: 'This week',
                cards: [
                    'Pediatrician — Theo (Tuesday 2pm)',
                    'Field-trip permission slip — Maya',
                    'Buy birthday gift for Sam (party Saturday)',
                    'Pick up dry cleaning',
                ],
            },
            {
                name: 'Waiting on',
                cards: [
                    'School portrait order confirmation',
                    'Dentist to call back about insurance',
                    'Mom group RSVPs for Thursday',
                ],
            },
            {
                name: 'Done this week',
                cards: [
                    'Kids’ haircuts',
                    'Renewed library cards',
                    'Made the casserole for the new neighbor',
                ],
            },
        ],
    },
    useCases: [
        {
            title: 'The household to-do list.',
            body: 'Groceries, school forms, doctor appointments, the dog. One place where it all lives, instead of seventeen sticky notes.',
        },
        {
            title: 'Shared with your partner.',
            body: 'Invite the other half of the household. Cards show up on both phones, so the question "did you do that thing?" stops being a guess.',
        },
        {
            title: 'Kids’ schedules and activities.',
            body: 'A column per kid, or a board per kid. Soccer, ballet, the science fair. Whoever drives them sees the same plan.',
        },
        {
            title: 'Birthdays, holidays, hosting.',
            body: 'A board for the next event. Drag a card when something gets done. The week before stops feeling like a panic.',
        },
        {
            title: 'The mental load, written down.',
            body: 'The cognitive cost of holding a household in your head is real. Cards on a board cost almost nothing — and finishing them feels just as good as it should.',
        },
        {
            title: 'AI for the parts that repeat.',
            body: "Ask the AI to break a project into smaller cards (school year prep, summer camp logistics, holiday hosting) and accept what it gets right. A second pair of eyes, not a takeover.",
        },
    ],
    faqs: [
        {
            q: 'Do I need to be a tech person to use this?',
            a: "No. If you can use Notes or a sticky note, you can use kanNINJA. Drag a card from one column to another. That's the whole product on day one.",
        },
        {
            q: 'Can my partner see and edit the same board?',
            a: 'Yes. Invite them by email. Both phones see the same board, in real time. No more "I told you about that" arguments — the card is right there, and you both saw it move.',
        },
        {
            q: 'Is this better than a paper planner?',
            a: "Sometimes. A paper planner is wonderful and we'd never tell you to stop. kanNINJA earns its place when more than one person needs to see the list, when the list changes daily, or when something needs to be findable a month from now.",
        },
        {
            q: 'How much does it cost?',
            a: "Free for one person, forever. Add a partner or a co-parent and you're still on the free tier. The paid tiers exist for bigger groups and for the AI — most households never need them.",
        },
        {
            q: 'Will the AI replace my judgment?',
            a: 'No. The AI suggests next steps when you ask. You accept or ignore. It never moves a card on its own, and it never decides what your family needs.',
        },
    ],
    close: {
        headlineBefore: 'A calmer',
        headlineItalic: 'household.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for moms',
    description:
        "A kanban board for the household — kids, school, appointments, the snack rotation. A calm place for the mental load, shared with your partner.",
    path: '/for/moms',
    ogTitle: 'kanNINJA for moms',
    ogEyebrow: 'For moms',
    keywords: ['kanban for moms', 'family planner app', 'household to-do list', 'mom organizer app', 'mental load app'],
});

export default function ForMomsPage() {
    return <PersonaPage slug="moms" data={data} />;
}
