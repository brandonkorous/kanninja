import type { Metadata } from 'next';
import { ComingSoonPage } from '@/components/marketing/ComingSoonPage';

export const metadata: Metadata = {
    title: 'kanNINJA — Documentation',
    description: 'Product documentation. Not yet.',
};

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
