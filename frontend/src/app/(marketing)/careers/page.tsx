import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Careers',
    description: 'kanNINJA is not hiring yet. When we open a role, the work will be described plainly here.',
    path: '/careers',
    ogTitle: 'Not hiring yet.',
    ogEyebrow: 'kanNINJA · Careers',
});

export default function CareersPage() {
    return (
        <ComingSoonPage
            eyebrow="Careers"
            headlineBefore="We are not"
            headlineItalic="hiring yet."
            body="kanNINJA is a small team. When we open a role, it will show up here with the work described plainly. No ping-pong tables on the list."
        />
    );
}
