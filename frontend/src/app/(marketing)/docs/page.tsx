import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Documentation',
    description: 'kanNINJA product documentation. Not yet — when it ships, it will be short and read like a person wrote it.',
    path: '/docs',
    ogTitle: 'Documentation — coming soon.',
    ogEyebrow: 'kanNINJA · Docs',
});

export default function DocsPage() {
    return (
        <ComingSoonPage
            eyebrow="Documentation"
            headlineBefore="No docs"
            headlineItalic="yet."
            body="The product is simple enough that most people never open the docs. When we write them, they will be short and read like a person wrote them."
        />
    );
}
