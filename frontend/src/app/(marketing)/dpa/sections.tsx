import Link from 'next/link';
import type { LegalSectionData } from '@/components/marketing/LegalLayout';

// Data Processing Addendum sections. Drafted for CCPA/CPRA "service provider"
// terms — GDPR is intentionally out of scope at launch (the operator is
// US-only, sole proprietor, California). If you expand to EU/UK customers,
// extend this file with GDPR Article 28 terms and Standard Contractual
// Clauses, and have it reviewed by counsel before use.

export const dpaSections: LegalSectionData[] = [
    {
        id: 'parties',
        number: '01',
        title: 'Parties and scope',
        body: (
            <>
                <p>
                    This Data Processing Addendum ("DPA") is entered into
                    between the kanNINJA customer identified in the order or
                    account ("Customer") and{' '}
                    <strong>Brandon Korous</strong>, sole proprietor d/b/a
                    kanNINJA ("kanNINJA"). It supplements the{' '}
                    <Link href="/terms">Terms of Service</Link> and applies
                    when kanNINJA processes Personal Information on
                    Customer's behalf in connection with the service.
                </p>
                <p>
                    To execute this DPA, Customer may either (a) sign a
                    countersigned copy at{' '}
                    <a href="mailto:legal@kanninja.com">
                        legal@kanninja.com
                    </a>
                    , or (b) accept it by reference in an order form or
                    written agreement.
                </p>
            </>
        ),
    },
    {
        id: 'definitions',
        number: '02',
        title: 'Definitions and roles',
        body: (
            <>
                <p>
                    "Personal Information" has the meaning given in the
                    California Consumer Privacy Act, as amended by the
                    California Privacy Rights Act ("CCPA").
                </p>
                <p>
                    For purposes of the CCPA, Customer is the{' '}
                    <strong>Business</strong> and kanNINJA is the{' '}
                    <strong>Service Provider</strong>. kanNINJA processes
                    Personal Information only on documented instructions
                    from Customer — those instructions being (a) the
                    service's normal functionality and (b) Customer's use of
                    that functionality.
                </p>
                <p>
                    kanNINJA does not "sell" or "share" Personal Information
                    as those terms are defined in the CCPA. kanNINJA does
                    not retain, use, or disclose Personal Information
                    outside the direct business relationship with Customer
                    or for any commercial purpose other than performing the
                    service.
                </p>
            </>
        ),
    },
    {
        id: 'data',
        number: '03',
        title: 'Categories of Personal Information',
        body: (
            <>
                <p>
                    The Personal Information kanNINJA processes on
                    Customer's behalf depends on what Customer chooses to
                    put into the service. Typical categories include:
                </p>
                <ul>
                    <li>
                        Identifiers (name, email, user ID) for Customer's
                        users and invitees.
                    </li>
                    <li>
                        Customer Records (board membership, role, billing
                        contact).
                    </li>
                    <li>
                        Internet activity (pages visited within the app,
                        timestamps, browser metadata).
                    </li>
                    <li>
                        Inferences drawn from the above (workspace activity,
                        usage patterns).
                    </li>
                    <li>
                        Free-text content authored by Customer's users
                        (cards, comments, attachments) which may itself
                        contain Personal Information.
                    </li>
                </ul>
                <p>
                    The duration of processing is the term of the
                    underlying agreement plus the retention windows in the{' '}
                    <Link href="/privacy#retention">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </>
        ),
    },
    {
        id: 'obligations',
        number: '04',
        title: 'Service Provider obligations',
        body: (
            <>
                <p>kanNINJA will:</p>
                <ul>
                    <li>
                        Process Personal Information only as needed to
                        perform the service or as required by law, and only
                        on Customer's documented instructions.
                    </li>
                    <li>
                        Keep Personal Information confidential and ensure
                        personnel with access are bound by confidentiality
                        obligations.
                    </li>
                    <li>
                        Not combine Personal Information received from
                        Customer with Personal Information from any other
                        source, except as permitted by 11 C.C.R. § 7050.
                    </li>
                    <li>
                        Notify Customer promptly if kanNINJA can no longer
                        meet its obligations under the CCPA.
                    </li>
                    <li>
                        Cooperate with Customer's reasonable efforts to
                        ensure that Personal Information is used in a
                        manner consistent with Customer's obligations.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'subprocessors',
        number: '05',
        title: 'Subprocessors',
        body: (
            <>
                <p>
                    Customer authorizes kanNINJA to engage the
                    subprocessors listed at{' '}
                    <Link href="/subprocessors">/subprocessors</Link>.
                    kanNINJA flows down obligations substantially the same
                    as those in this DPA to each subprocessor.
                </p>
                <p>
                    kanNINJA will give at least 30 days' notice — by
                    in-app announcement, email to the Customer's billing
                    contact, or update to the Subprocessors page (with
                    feed available) — before engaging a new subprocessor
                    that processes Personal Information. Customer may
                    object on reasonable data-protection grounds within
                    that period; if the parties cannot resolve the
                    objection, Customer may terminate the affected portion
                    of the service for convenience.
                </p>
            </>
        ),
    },
    {
        id: 'security',
        number: '06',
        title: 'Security and incident response',
        body: (
            <>
                <p>
                    kanNINJA maintains administrative, technical, and
                    physical safeguards designed to protect Personal
                    Information, including TLS in transit, AES-256 at rest,
                    least-privilege access, multi-factor authentication for
                    administrative accounts, and audit logging.
                </p>
                <p>
                    If kanNINJA becomes aware of a confirmed unauthorized
                    acquisition of, access to, or disclosure of Personal
                    Information processed on Customer's behalf, kanNINJA
                    will notify Customer without undue delay (and in any
                    event within 72 hours of confirmation) at the
                    Customer's billing or security contact, with the
                    information then known.
                </p>
            </>
        ),
    },
    {
        id: 'requests',
        number: '07',
        title: 'Consumer requests',
        body: (
            <>
                <p>
                    If kanNINJA receives a request from a California
                    consumer to exercise rights under the CCPA against
                    Personal Information processed on Customer's behalf,
                    kanNINJA will (a) inform the consumer that the request
                    must be directed to Customer, and (b) notify Customer
                    promptly. kanNINJA will assist Customer, at Customer's
                    cost, in fulfilling verified consumer requests.
                </p>
            </>
        ),
    },
    {
        id: 'return',
        number: '08',
        title: 'Return or deletion',
        body: (
            <>
                <p>
                    On termination of the service, kanNINJA will, at
                    Customer's election: (a) make Personal Information
                    available for export through the standard export
                    tooling for at least 30 days, then delete it on the
                    schedule in the{' '}
                    <Link href="/privacy#retention">
                        Privacy Policy
                    </Link>
                    , or (b) delete it earlier on Customer's written
                    request, except where retention is required by law.
                </p>
            </>
        ),
    },
    {
        id: 'audit',
        number: '09',
        title: 'Audit and assistance',
        body: (
            <>
                <p>
                    Once per twelve-month period, on at least 30 days'
                    written notice, Customer may request reasonable
                    information necessary to demonstrate kanNINJA's
                    compliance with this DPA — including a written
                    response to a security questionnaire and any then-
                    current third-party audit reports kanNINJA holds.
                </p>
                <p>
                    On-site audits are not included by default and, where
                    requested, will be at Customer's cost, scheduled to
                    minimize disruption, and limited to the controls
                    relevant to processing under this DPA.
                </p>
            </>
        ),
    },
    {
        id: 'misc',
        number: '10',
        title: 'Liability, conflicts, and term',
        body: (
            <>
                <p>
                    Each party's liability under this DPA is subject to
                    the limitations of liability in the underlying Terms
                    of Service, treated as a single aggregate cap.
                </p>
                <p>
                    If there is a conflict between this DPA and the
                    underlying Terms with respect to the processing of
                    Personal Information, this DPA controls.
                </p>
                <p>
                    This DPA takes effect on the start of the underlying
                    agreement and continues until the later of (a)
                    termination of the agreement and (b) the end of any
                    return-or-deletion period under section 08.
                </p>
            </>
        ),
    },
];
