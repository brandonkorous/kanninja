import Link from 'next/link';
import type { LegalSectionData } from '@/components/marketing/LegalLayout';

// Sections 06–10 of /privacy. Split from sections.tsx to keep individual
// files under the project's 200-line guideline. Combined in page.tsx.

export const privacyRightsSections: LegalSectionData[] = [
    {
        id: 'cookies',
        number: '06',
        title: 'Cookies, analytics, and session replay',
        body: (
            <>
                <p>
                    We use a small number of cookies and similar technologies. The
                    full breakdown is on our{' '}
                    <Link href="/cookies">Cookie Policy</Link>; the short version:
                </p>
                <ul>
                    <li>
                        <strong>Strictly necessary</strong> cookies keep you signed
                        in (set by Clerk) and remember your theme and basic
                        preferences. These cannot be turned off.
                    </li>
                    <li>
                        <strong>Analytics</strong> — Google Analytics counts page
                        views and events to tell us which features are used.
                    </li>
                    <li>
                        <strong>Session replay</strong> — Microsoft Clarity records
                        anonymized session recordings and heatmaps so we can see
                        where the product confuses people. Form input, passwords,
                        and card content are masked by default.
                    </li>
                </ul>
                <p>
                    California residents may opt out of analytics and session
                    replay using the link in the footer or by emailing{' '}
                    <a href="mailto:privacy@kanninja.com">
                        privacy@kanninja.com
                    </a>
                    . Necessary cookies remain because the service does not work
                    without them.
                </p>
            </>
        ),
    },
    {
        id: 'rights',
        number: '07',
        title: 'Your California privacy rights',
        body: (
            <>
                <p>
                    Under the California Consumer Privacy Act and the California
                    Privacy Rights Act, California residents have the following
                    rights:
                </p>
                <ul>
                    <li>
                        <strong>Right to know</strong> — what categories of
                        personal information we collect, where it comes from, why
                        we collect it, and who we share it with.
                    </li>
                    <li>
                        <strong>Right to access</strong> — a copy of the personal
                        information we hold about you.
                    </li>
                    <li>
                        <strong>Right to correct</strong> — ask us to fix
                        inaccurate personal information.
                    </li>
                    <li>
                        <strong>Right to delete</strong> — ask us to delete your
                        personal information, subject to legal exceptions
                        (fraud prevention, tax records, ongoing transactions).
                    </li>
                    <li>
                        <strong>Right to opt out of sale or sharing</strong> — we
                        do not sell personal information and do not share it for
                        cross-context behavioral advertising. The right exists
                        regardless.
                    </li>
                    <li>
                        <strong>
                            Right to limit use of sensitive personal information
                        </strong>{' '}
                        — we do not collect sensitive personal information beyond
                        what is needed for the service.
                    </li>
                    <li>
                        <strong>Right to non-discrimination</strong> — exercising
                        any of these rights will not change the price you pay or
                        the service you receive.
                    </li>
                </ul>
                <p>
                    To exercise any of these rights, email{' '}
                    <a href="mailto:privacy@kanninja.com">
                        privacy@kanninja.com
                    </a>{' '}
                    from the address on your account or include enough information
                    that we can verify it is you. We respond within 45 days, and
                    will tell you if we need an additional 45 days. You can also
                    authorize an agent to act on your behalf.
                </p>
            </>
        ),
    },
    {
        id: 'retention',
        number: '08',
        title: 'Data retention',
        body: (
            <>
                <p>We hold information only as long as we have a reason to.</p>
                <dl>
                    <dt>Account data</dt>
                    <dd>
                        Until you delete your account. We then remove it from live
                        systems within 30 days.
                    </dd>
                    <dt>Backups</dt>
                    <dd>
                        Up to 90 days. Encrypted backups age out on a rolling
                        schedule and overwrite themselves.
                    </dd>
                    <dt>Audit logs</dt>
                    <dd>
                        Up to 12 months for security and incident investigation.
                    </dd>
                    <dt>Billing records</dt>
                    <dd>
                        Up to 7 years for tax and accounting purposes, as required
                        by law.
                    </dd>
                    <dt>AI request logs</dt>
                    <dd>Up to 90 days for debugging and abuse investigation.</dd>
                    <dt>Analytics and session replay</dt>
                    <dd>
                        Google Analytics: 14 months. Microsoft Clarity: up to 12
                        months.
                    </dd>
                </dl>
            </>
        ),
    },
    {
        id: 'security',
        number: '09',
        title: 'Security',
        body: (
            <>
                <p>
                    We use TLS 1.2+ for all data in transit and AES-256 for data
                    at rest in the database. The application runs on Microsoft
                    Azure Kubernetes Service in the West US 3 region. Access to
                    production systems is limited to the smallest set of people
                    who need it, behind multi-factor authentication. We log
                    administrative actions.
                </p>
                <p>
                    No security program is perfect. If you discover a
                    vulnerability, please report it responsibly to{' '}
                    <a href="mailto:security@kanninja.com">
                        security@kanninja.com
                    </a>
                    . We will not pursue legal action against good-faith research.
                </p>
            </>
        ),
    },
    {
        id: 'misc',
        number: '10',
        title: 'Children, transfers, and changes',
        body: (
            <>
                <h3>Children</h3>
                <p>
                    kanNINJA is not directed to children under 13. We do not
                    knowingly collect personal information from children under 13.
                    If you believe a child has given us personal information,
                    email{' '}
                    <a href="mailto:privacy@kanninja.com">
                        privacy@kanninja.com
                    </a>{' '}
                    and we will delete it.
                </p>
                <h3>International transfers</h3>
                <p>
                    kanNINJA is operated from the United States and your data is
                    processed in the United States (Azure West US 3). If you use
                    the service from outside the United States, you consent to
                    that transfer and processing.
                </p>
                <h3>Changes to this policy</h3>
                <p>
                    We will update this policy when we change how we handle data.
                    Material changes will be announced by email or in the app at
                    least seven days before they take effect. The "last updated"
                    date at the top of this page is the version of record.
                </p>
            </>
        ),
    },
];
