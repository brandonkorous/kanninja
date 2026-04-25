import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { privacySections } from './sections';
import { privacyRightsSections } from './sections-rights';

export const metadata: Metadata = {
    title: 'kanNINJA — Privacy Policy',
    description:
        'How kanNINJA collects, uses, and protects your information. Plain English. No fine print.',
};

export default function PrivacyPage() {
    return (
        <LegalLayout
            eyebrow="Privacy"
            headlineBefore="Plain English,"
            headlineItalic="no fine print."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="privacy@kanninja.com"
            intro={
                <>
                    <p>
                        We collect what we need to run the service and nothing
                        else. We do not sell your data. We do not use it to train
                        AI models. This page is the long version.
                    </p>
                </>
            }
            sections={[...privacySections, ...privacyRightsSections]}
        />
    );
}
