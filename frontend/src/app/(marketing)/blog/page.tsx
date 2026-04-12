import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Field notes',
    description: 'Long-form writing from the team. Not yet.',
};

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
