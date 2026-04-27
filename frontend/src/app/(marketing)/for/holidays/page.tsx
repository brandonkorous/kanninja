import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Hosts',
    hero: {
        eyebrow: 'kanNINJA for holidays and hosting',
        headlineBefore: 'Hosting without',
        headlineItalic: 'the spiral.',
        subtitle:
            'Thanksgiving, the holiday party, the in-laws weekend. A board for the week before, so the day itself can actually be enjoyed.',
    },
    intro:
        'Hosting is a project that pretends not to be one. The shopping list, the menu, the room the cousins are sleeping in, the present you keep meaning to wrap. kanNINJA gives the host a board so the spiral happens on paper instead of in the back of your mind on Tuesday at 11pm.',
    sampleBoard: {
        title: 'A board for hosting Thanksgiving for twelve.',
        columns: [
            {
                name: '2 weeks out',
                cards: [
                    'Send the menu to the gluten-free guest',
                    'Order the turkey',
                    'Confirm guest count',
                    'Buy place cards and napkins',
                ],
            },
            {
                name: 'Week of',
                cards: [
                    'Grocery run #1 (non-perishables)',
                    'Make the cranberry sauce',
                    'Brine the turkey (Tuesday)',
                    'Set the table (Wednesday night)',
                ],
            },
            {
                name: 'Day of',
                cards: [
                    'Turkey in the oven 11am',
                    'Prep stuffing 1pm',
                    'Sides going at 2pm',
                    'Guests arrive 4pm',
                ],
            },
        ],
    },
    useCases: [
        {
            title: 'The menu, broken down.',
            body: 'Each dish becomes a card. Ingredients, prep time, the day to start. The grocery list writes itself.',
        },
        {
            title: 'The guest list.',
            body: 'Who is coming, who is bringing what, the dietary restrictions. The Aunt who is gluten-free and the kid who only eats white food.',
        },
        {
            title: 'Present tracking.',
            body: 'A board for gifts. Who gets what, what is bought, what is wrapped, what is shipped. December stops being a panic.',
        },
        {
            title: 'The in-laws weekend.',
            body: 'A board for a 4-day visit. Where they sleep, what you cook, the activity for Saturday afternoon. The host (you) gets to enjoy it too.',
        },
        {
            title: 'Shared with whoever is hosting with you.',
            body: 'Invite your partner or your sister. Real-time presence. The thing you both thought the other was doing — finally on the board.',
        },
        {
            title: 'AI for breaking down the new tradition.',
            body: "Hosting your first big holiday? Ask the AI to break it down. Accept what fits your family. Adjust the rest. Save the brain space for the actual cooking.",
        },
    ],
    faqs: [
        {
            q: 'Is this just a checklist?',
            a: 'It can be. The advantage of a board is seeing what is in progress, what is waiting on something else, and what is finished. A checklist tells you what to do; a board shows you where you are.',
        },
        {
            q: 'Can I share the menu board with guests?',
            a: 'Yes — make a board read-only and send the link. Guests see the menu and what to bring without being able to edit anything.',
        },
        {
            q: 'Does it handle recipes?',
            a: 'Each card supports rich text and links. Most hosts paste the recipe URL or the steps directly into the card. Not a substitute for a recipe app, but plenty for the host.',
        },
        {
            q: 'How much does it cost?',
            a: 'Free for one person. Free for two on a shared board. The paid tiers are for bigger groups and the AI — most hosts never need them.',
        },
        {
            q: 'After the holiday, what do I do with the board?',
            a: 'Archive it. Or duplicate it for next year — most of the work is the same, and the version with last year’s notes saves you hours.',
        },
    ],
    close: {
        headlineBefore: 'Enjoy the day,',
        headlineItalic: 'not the spiral.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for holidays and hosting',
    description:
        'A kanban for Thanksgiving, the holiday party, the in-laws weekend. The week before, finally on paper — so the day itself can be enjoyed.',
    path: '/for/holidays',
    ogTitle: 'kanNINJA for holidays and hosting',
    ogEyebrow: 'For holidays',
    keywords: ['Thanksgiving planner', 'holiday hosting checklist', 'dinner party planning app', 'kanban for hosting', 'holiday meal planner'],
});

export default function ForHolidaysPage() {
    return <PersonaPage slug="holidays" data={data} />;
}
