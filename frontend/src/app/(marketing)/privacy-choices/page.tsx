import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { PrivacyChoicesPanel } from '@/components/legal/PrivacyChoicesPanel';

export const metadata: Metadata = {
    title: 'kanNINJA — Your privacy choices',
    description:
        'Opt out of analytics and session replay. We do not sell or share personal information for cross-context behavioral advertising.',
};

export default function PrivacyChoicesPage() {
    return (
        <LegalLayout
            eyebrow="Your privacy choices"
            headlineBefore="Do not sell"
            headlineItalic="or share."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="privacy@kanninja.com"
            intro={
                <>
                    <p>
                        California residents have the right to opt out of
                        the sale or sharing of their personal information.
                        Most companies bury this. We don't.
                    </p>
                    <p>
                        Use the controls below to turn analytics and
                        session replay on or off. Your choice applies
                        immediately and is remembered on this device.
                    </p>
                </>
            }
            sections={[
                {
                    id: 'no-sale',
                    number: '01',
                    title: 'We do not sell or share',
                    body: (
                        <>
                            <p>
                                For the avoidance of doubt:{' '}
                                <strong>
                                    kanNINJA does not sell personal
                                    information for money, and does not
                                    share it for cross-context behavioral
                                    advertising
                                </strong>
                                , as those terms are defined under the
                                California Consumer Privacy Act (as
                                amended by the California Privacy Rights
                                Act).
                            </p>
                            <p>
                                We do use a small number of vendors to run
                                the service — listed at{' '}
                                <Link href="/subprocessors">
                                    Subprocessors
                                </Link>
                                . They are contractually limited to using
                                your data only to deliver the service to
                                you.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'choices',
                    number: '02',
                    title: 'Your choices',
                    body: (
                        <>
                            <p>
                                Even though we don't sell or share, you
                                may still want to opt out of optional
                                tracking we use to improve the product.
                                Your call:
                            </p>
                            <PrivacyChoicesPanel />
                        </>
                    ),
                },
                {
                    id: 'gpc',
                    number: '03',
                    title: 'Global Privacy Control',
                    body: (
                        <>
                            <p>
                                If your browser sends the{' '}
                                <a
                                    href="https://globalprivacycontrol.org/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Global Privacy Control
                                </a>{' '}
                                signal, we treat it as a request to opt
                                out of analytics and session replay. We
                                record the opt-out automatically the first
                                time you visit and you do not need to do
                                anything else.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'other-rights',
                    number: '04',
                    title: 'Other privacy rights',
                    body: (
                        <>
                            <p>
                                California residents have additional
                                rights under the CCPA — to know, access,
                                correct, delete, and limit the use of
                                sensitive personal information. The full
                                list and how to exercise each one is on
                                the{' '}
                                <Link href="/privacy#rights">
                                    Privacy Policy
                                </Link>
                                .
                            </p>
                            <p>
                                For requests beyond the controls on this
                                page — including data export and account
                                deletion — email{' '}
                                <a href="mailto:privacy@kanninja.com">
                                    privacy@kanninja.com
                                </a>{' '}
                                from the address on your account. We
                                respond within 45 days.
                            </p>
                        </>
                    ),
                },
            ]}
        />
    );
}
