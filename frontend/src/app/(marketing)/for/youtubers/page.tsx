import type { Metadata } from 'next';
import { PersonaPage } from '@/components/marketing/persona/PersonaPage';
import type { PersonaData } from '@/components/marketing/persona/types';
import { buildPageMetadata } from '@/lib/seo';

const data: PersonaData = {
    label: 'YouTubers',
    hero: {
        eyebrow: 'kanNINJA for YouTubers',
        headlineBefore: 'Ideas to ship,',
        headlineItalic: 'in the order they ship.',
        subtitle:
            'A board for the channel — scripts, b-roll, the thumbnail you keep redoing. Built for creators who think in episodes, not tasks.',
    },
    intro:
        "Most YouTubers run a small studio inside their head. Ideas, scripts, shoots, edits, thumbnails, descriptions, scheduled uploads. We built kanNINJA so the channel has a real backlog instead of a Notes app — and so the editor and the producer can finally see the same picture.",
    // Sample board lives in @kanninja/shared (templates/personas/youtubers.ts).
    useCases: [
        {
            title: 'The idea backlog.',
            body: 'Capture every idea the moment it lands. The phone idea, the shower idea, the comment-section idea. The good ones get pulled forward; the rest stay there until they earn it.',
        },
        {
            title: 'Scripts, shoots, edits as a flow.',
            body: 'A column per phase. Episodes drift right as they get closer to publish. The channel pipeline becomes visible — and pacing decisions become real.',
        },
        {
            title: 'Working with an editor or producer.',
            body: 'Invite them. Real-time presence. They see the script the moment you finish it. You see their cut the moment they finish it. No DMing files.',
        },
        {
            title: 'Thumbnails, titles, descriptions in one place.',
            body: 'Every variant attached to the card. The thumbnail you almost picked is right there for next time.',
        },
        {
            title: 'Sponsor and brand-deal tracking.',
            body: 'A board for partnerships. Cards for each deal — brief, fee, deliverable, payment. When a brand asks "did you run that yet?", the answer is one card.',
        },
        {
            title: 'AI for breaking down a series.',
            body: 'Planning a 10-part series? Ask the AI to break it into episode cards. Adjust to your voice. Save the brain space for the actual ideas.',
        },
    ],
    faqs: [
        {
            q: 'Does it integrate with YouTube?',
            a: 'Not yet. Direct YouTube integration is on the list. For now, the YouTube URL goes on the card after publish — useful for tracking what the title and thumbnail were when you first published.',
        },
        {
            q: 'Can my editor edit the board?',
            a: 'Yes — invite them with the right role. Editors can move cards and add comments without being able to delete or change permissions.',
        },
        {
            q: 'Does it handle file storage for raw footage?',
            a: 'No, and we will not pretend to. Footage lives in Frame.io or Dropbox or your NAS. Links and small files attach to the card.',
        },
        {
            q: 'Is this overkill for a solo creator?',
            a: 'For one channel and zero collaborators, a Notes app may be enough. If you publish more than once a week, or you work with anyone, the board pays back the setup time within a month.',
        },
        {
            q: 'How much does it cost?',
            a: 'Free for one creator. Free for two on a shared board. Bringing on a paid editor and producer might cross you into a paid tier — still less than one month of your editor.',
        },
    ],
    close: {
        headlineBefore: 'Ship the next',
        headlineItalic: 'episode.',
    },
};

export const metadata: Metadata = buildPageMetadata({
    title: 'kanNINJA for YouTubers',
    description:
        'A kanban for the channel — scripts, b-roll, the thumbnail you keep redoing. Built for creators who think in episodes, not tasks.',
    path: '/for/youtubers',
    ogTitle: 'kanNINJA for YouTubers',
    ogEyebrow: 'For YouTubers',
    keywords: ['YouTuber productivity', 'video production kanban', 'content calendar app', 'YouTube channel management', 'creator workflow'],
});

export default function ForYouTubersPage() {
    return <PersonaPage slug="youtubers" data={data} />;
}
