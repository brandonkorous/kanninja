import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';

export const metadata: Metadata = {
    title: 'kanNINJA — Refund Policy',
    description:
        'kanNINJA does not refund partial periods. The short list of when we do issue refunds.',
};

export default function RefundPage() {
    return (
        <LegalLayout
            eyebrow="Refunds"
            headlineBefore="Cancel anytime."
            headlineItalic="No partial refunds."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="billing@kanninja.com"
            intro={
                <p>
                    kanNINJA bills in advance and does not refund partial
                    periods. You can cancel at any time and you keep your
                    paid features until the end of the current billing
                    period. The exceptions are below.
                </p>
            }
            sections={[
                {
                    id: 'general',
                    number: '01',
                    title: 'General rule',
                    body: (
                        <>
                            <p>
                                Subscriptions are charged at the start of
                                each billing period (monthly or annual)
                                and are non-refundable for that period
                                once charged. If you cancel mid-period,
                                your plan stays active until the end of
                                the period and does not renew.
                            </p>
                            <p>
                                We do not pro-rate refunds for unused
                                seats, downgrades, or unused time. We
                                also do not refund for forgotten
                                cancellations after a renewal has been
                                charged — set a reminder, or switch to
                                an annual plan if monthly is too easy to
                                forget.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'exceptions',
                    number: '02',
                    title: 'Exceptions we will refund',
                    body: (
                        <>
                            <p>
                                We do issue refunds in a small set of
                                cases:
                            </p>
                            <ul>
                                <li>
                                    <strong>Duplicate charges.</strong> If
                                    you were charged twice for the same
                                    period because of a billing bug.
                                </li>
                                <li>
                                    <strong>
                                        Charges after a cancellation we
                                        missed.
                                    </strong>{' '}
                                    If you canceled before a renewal but
                                    we still charged you, we will refund
                                    the renewal in full.
                                </li>
                                <li>
                                    <strong>
                                        Service unavailability we caused.
                                    </strong>{' '}
                                    If kanNINJA is down or unusable for an
                                    extended period due to our fault
                                    (24+ continuous hours in a billing
                                    cycle), email{' '}
                                    <a href="mailto:billing@kanninja.com">
                                        billing@kanninja.com
                                    </a>{' '}
                                    and we will issue a pro-rated credit
                                    or refund.
                                </li>
                                <li>
                                    <strong>
                                        Misrepresentation in our marketing.
                                    </strong>{' '}
                                    If you bought a paid plan based on a
                                    feature description that was clearly
                                    wrong on our pricing page, we will
                                    refund the most recent charge if you
                                    contact us within 30 days.
                                </li>
                            </ul>
                        </>
                    ),
                },
                {
                    id: 'how',
                    number: '03',
                    title: 'How to request a refund',
                    body: (
                        <>
                            <p>
                                Email{' '}
                                <a href="mailto:billing@kanninja.com">
                                    billing@kanninja.com
                                </a>{' '}
                                from the address on your account. Include
                                the date and approximate amount of the
                                charge and a one-line description of why
                                you are requesting a refund. We aim to
                                respond within two business days.
                            </p>
                            <p>
                                Refunds are issued to the original
                                payment method through Stripe. Bank
                                processing usually takes five to ten
                                business days after we issue the refund.
                            </p>
                        </>
                    ),
                },
                {
                    id: 'cancel',
                    number: '04',
                    title: 'How to cancel',
                    body: (
                        <>
                            <p>
                                Cancel anytime from{' '}
                                <strong>
                                    Settings → Billing → Cancel
                                    subscription
                                </strong>
                                . The cancellation takes effect at the
                                end of the current period and there is
                                nothing else to do. Your data is
                                preserved according to the{' '}
                                <Link href="/privacy#retention">
                                    Privacy Policy retention schedule
                                </Link>
                                ; you can export it from{' '}
                                <strong>Settings → Export</strong> at
                                any time before then.
                            </p>
                        </>
                    ),
                },
            ]}
        />
    );
}
