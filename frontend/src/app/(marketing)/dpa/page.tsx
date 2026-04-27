import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { dpaSections } from './sections';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Data Processing Addendum',
    description:
        'CCPA service-provider terms for kanNINJA business customers.',
    path: '/dpa',
    ogTitle: 'Data Processing Addendum',
    ogEyebrow: 'kanNINJA · DPA',
});

export default function DPAPage() {
    return (
        <LegalLayout
            eyebrow="Data Processing"
            headlineBefore="The terms"
            headlineItalic="for handling your data."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="legal@kanninja.com"
            intro={
                <>
                    <p>
                        This Data Processing Addendum applies when kanNINJA
                        processes personal information on a customer's
                        behalf — typically as part of a paid plan covering
                        team or business use. It supplements the{' '}
                        <a href="/terms">Terms of Service</a> and the{' '}
                        <a href="/privacy">Privacy Policy</a>.
                    </p>
                    <p>
                        Drafted for the California Consumer Privacy Act
                        (CCPA/CPRA). If your team needs additional terms
                        (e.g., an industry-specific BAA), email{' '}
                        <a href="mailto:legal@kanninja.com">
                            legal@kanninja.com
                        </a>
                        .
                    </p>
                </>
            }
            sections={dpaSections}
        />
    );
}
