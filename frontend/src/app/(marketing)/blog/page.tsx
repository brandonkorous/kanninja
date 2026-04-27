import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Field notes',
    description: 'Long-form writing from the kanNINJA team. Not yet — when there is something worth saying, it will be here.',
    path: '/blog',
    ogTitle: 'Field notes — coming soon.',
    ogEyebrow: 'kanNINJA · Blog',
});

export default function BlogPage() {
    return (
        <ComingSoonPage
            eyebrow="Field notes"
            headlineBefore="Nothing"
            headlineItalic="written yet."
            body="We'd rather write one good post than five filler ones. When we have something worth your time, it will live here."
        />
    );
}
