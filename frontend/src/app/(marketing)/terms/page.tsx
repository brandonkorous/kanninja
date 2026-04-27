import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { termsAccountSections } from './sections-account';
import { termsConductSections } from './sections-conduct';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Terms of Service',
    description:
        'The contract between you and kanNINJA. Plain English. No surprises.',
    path: '/terms',
    ogTitle: 'Terms of Service',
    ogEyebrow: 'kanNINJA · Terms',
});

export default function TermsPage() {
    return (
        <LegalLayout
            eyebrow="Terms"
            headlineBefore="Plain English."
            headlineItalic="No surprises."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="legal@kanninja.com"
            intro={
                <>
                    <p>
                        These Terms cover what you can expect from kanNINJA and
                        what we expect from you. We tried to keep them short
                        and readable. The defined terms are inline; nothing
                        important is hiding in a footnote.
                    </p>
                </>
            }
            sections={[...termsAccountSections, ...termsConductSections]}
        />
    );
}
