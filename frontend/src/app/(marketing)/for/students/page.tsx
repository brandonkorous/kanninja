import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'Students',
    hero: {
        eyebrow: 'kanNINJA for students',
        headlineBefore: 'A semester,',
        headlineItalic: 'in your hand.',
        subtitle:
            'Classes, papers, group projects, the thesis. A board that finds the next thing for you, even at 2am.',
    },
    intro:
        "Most student to-do lists are forty things in a Notes app, half of them duplicates. kanNINJA gives you a column for each class, a column for the project, a column for the week. The next assignment is always one drag away. The semester stops feeling like a wall and starts feeling like a list.",
    // Sample board lives in @kanninja/shared (templates/personas/students.ts).
    useCases: [
        {
            title: 'A column per class.',
            body: "All four classes on one board, color-coded. The reading you're behind on stops hiding behind the assignment that's due tomorrow.",
        },
        {
            title: 'The dissertation, broken down.',
            body: "A thesis is not one card. It is a sub-board. Lit review, methods, drafting, the hundred edits. kanNINJA shows you the slope of the work, even when you can't feel it.",
        },
        {
            title: 'Group projects without group chaos.',
            body: "Invite your group. Real-time presence — see who is on which task right now. Comments stay with the card. No more guessing who said they were doing what in the group chat.",
        },
        {
            title: 'Due dates that show themselves.',
            body: "Set a due date. The card surfaces in 'this week.' Filter to see what's due in the next 48 hours. The mental energy you spent juggling deadlines goes back into the work.",
        },
        {
            title: 'A semester board, already laid out.',
            body: 'Start from "A board for the semester" — readings, drafts, the deadlines that arrive together in week nine. Then just start.',
        },
        {
            title: 'Mobile, for the bus.',
            body: 'Open kanNINJA on your phone. Add a card while you remember. The next time you sit down, it is on the board.',
        },
    ],
    faqs: [
        {
            q: 'Is there a student discount?',
            a: "Honestly, the free tier is enough for most students. If your group project crosses you into the paid tier, write in — we'll figure something out.",
        },
        {
            q: 'Will it work for my group project?',
            a: "Yes. Invite your group by email. Everyone sees the same board, in real time. Avatars on cards show who's actually working on what.",
        },
        {
            q: 'Can I use it for my thesis?',
            a: "That's one of the best uses. Make the thesis its own board. Each chapter is a column. Each draft, edit, and source is a card. Watch the work move across the board over months.",
        },
        {
            q: 'Does it integrate with my calendar?',
            a: "Not yet. Calendar integration is on the list. For now, due dates live on the cards.",
        },
        {
            q: 'Is it better than Notion for school?',
            a: "Different shape. Notion is great for notes and writing. kanNINJA is great for the work itself — what's done, what's next, what's stuck. Most students use both.",
        },
    ],
    close: {
        headlineBefore: 'The semester,',
        headlineItalic: 'made finishable.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for students',
    description:
        "A kanban for the semester — classes, papers, group projects, the thesis. The next assignment is always one drag away.",
    path: '/for/students',
    ogTitle: 'kanNINJA for students',
    ogEyebrow: 'For students',
    keywords: ['kanban for students', 'student planner app', 'thesis kanban', 'group project tool', 'college to-do list'],
});

export default function ForStudentsPage() {
    return <PersonaPage slug="students" data={data} />;
}
