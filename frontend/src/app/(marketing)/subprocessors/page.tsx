import Link from 'next/link';
import type { Metadata } from 'next';
import { LegalLayout } from '@/components/marketing/LegalLayout';
import { SubprocessorList, type Subprocessor } from './SubprocessorList';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
    title: 'Subprocessors',
    description:
        'The third-party services kanNINJA uses to deliver its product. What each one does, what data it sees, where it operates.',
    path: '/subprocessors',
    ogTitle: 'Subprocessors',
    ogEyebrow: 'kanNINJA · Subprocessors',
});

// The current subprocessor list. Update this when adding or removing a vendor
// and bump the lastUpdatedISO date below. Customers on the DPA are entitled
// to advance notice — see /dpa section 05.
const subprocessors: Subprocessor[] = [
    {
        name: 'Clerk',
        purpose: 'Authentication',
        data: 'Name, email, hashed password, social-login identifiers, session cookies.',
        location: 'United States',
        privacyUrl: 'https://clerk.com/privacy',
    },
    {
        name: 'Stripe',
        purpose: 'Payment processing',
        data: 'Cardholder name, card details (Stripe-tokenized — we never see full card numbers), billing address, transaction history.',
        location: 'United States',
        privacyUrl: 'https://stripe.com/privacy',
    },
    {
        name: 'Supabase',
        purpose: 'Database and realtime infrastructure',
        data: 'All customer content stored in kanNINJA — boards, lists, cards, comments, attachments, profile data, audit logs.',
        location: 'United States (managed Postgres + Realtime)',
        privacyUrl: 'https://supabase.com/privacy',
    },
    {
        name: 'Microsoft Azure',
        purpose: 'Application hosting (AKS, West US 3)',
        data: 'All customer content while it is being processed by the application; logs and metrics.',
        location: 'United States (West US 3)',
        privacyUrl: 'https://www.microsoft.com/privacy',
    },
    {
        name: 'OpenAI',
        purpose: 'AI features (suggestions, summaries, drafting)',
        data: 'Card content or prompt text you submit to an AI feature, plus the response. Per OpenAI API terms, not used to train models; deleted within 30 days unless required by law.',
        location: 'United States',
        privacyUrl: 'https://openai.com/policies/privacy-policy',
    },
    {
        name: 'Resend',
        purpose: 'Transactional email delivery',
        data: 'Recipient email, sender, subject, body of transactional messages (invitations, receipts, password resets); delivery metadata.',
        location: 'United States',
        privacyUrl: 'https://resend.com/legal/privacy-policy',
    },
    {
        name: 'Google Analytics 4',
        purpose: 'Web analytics',
        data: 'Anonymized page views and events, approximate location from IP (IP anonymization enabled), browser metadata.',
        location: 'United States',
        privacyUrl: 'https://policies.google.com/privacy',
    },
    {
        name: 'Microsoft Clarity',
        purpose: 'Session replay and heatmaps',
        data: 'Anonymized recordings of in-app sessions with form input, passwords, and card content masked by default; heatmap aggregates.',
        location: 'United States',
        privacyUrl: 'https://privacy.microsoft.com/privacystatement',
    },
    {
        name: 'Google (Calendar)',
        purpose: 'Optional integration',
        data: "Only if you connect Google Calendar: OAuth tokens and the calendar events you grant access to.",
        location: 'United States',
        privacyUrl: 'https://policies.google.com/privacy',
    },
    {
        name: 'Slack',
        purpose: 'Optional integration',
        data: "Only if you connect Slack: OAuth tokens and the channel/message metadata you grant access to.",
        location: 'United States',
        privacyUrl: 'https://slack.com/trust/privacy/privacy-policy',
    },
    {
        name: 'GitHub',
        purpose: 'Optional integration',
        data: "Only if you connect GitHub: OAuth tokens and the repository metadata you grant access to.",
        location: 'United States',
        privacyUrl: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
    },
];

export default function SubprocessorsPage() {
    return (
        <LegalLayout
            eyebrow="Subprocessors"
            headlineBefore="The names"
            headlineItalic="behind the scenes."
            lastUpdatedISO="2026-04-24"
            effectiveISO="2026-04-24"
            contactEmail="privacy@kanninja.com"
            intro={
                <>
                    <p>
                        kanNINJA uses the third-party services below to
                        deliver its product. Each one is bound by a data
                        protection agreement that limits what they can do
                        with your data and requires them to maintain
                        appropriate security.
                    </p>
                    <p>
                        Customers on the{' '}
                        <Link href="/dpa">Data Processing Addendum</Link>{' '}
                        receive at least 30 days' notice before we add a
                        new subprocessor that processes personal
                        information.
                    </p>
                </>
            }
            sections={[
                {
                    id: 'list',
                    number: '01',
                    title: 'Current subprocessors',
                    body: <SubprocessorList items={subprocessors} />,
                },
                {
                    id: 'changes',
                    number: '02',
                    title: 'Subscribing to changes',
                    body: (
                        <>
                            <p>
                                We post changes here and announce them in
                                the in-app changelog. To receive direct
                                notice for your account, make sure your
                                billing or admin contact email is current
                                in <strong>Settings → Workspace</strong>.
                            </p>
                            <p>
                                If a subprocessor change is unacceptable
                                under your data protection requirements,
                                contact{' '}
                                <a href="mailto:privacy@kanninja.com">
                                    privacy@kanninja.com
                                </a>{' '}
                                during the notice period to discuss
                                alternatives or termination.
                            </p>
                        </>
                    ),
                },
            ]}
        />
    );
}
