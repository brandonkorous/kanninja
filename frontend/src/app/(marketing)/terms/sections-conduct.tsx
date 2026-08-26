import Link from 'next/link';
import type { LegalSectionData } from '@/components/marketing/LegalLayout';

// Sections 07–12 of /terms — acceptable use through governing law and changes.
// Companion file sections-account.tsx covers 01–06 (acceptance through IP).

export const termsConductSections: LegalSectionData[] = [
    {
        id: 'acceptable-use',
        number: '07',
        title: 'Acceptable use',
        body: (
            <>
                <p>
                    Your use of kanNINJA is subject to our{' '}
                    <Link href="/aup">Acceptable Use Policy</Link>. The short
                    version: don't use kanNINJA to break the law, harm other
                    people, harass anyone, distribute malware, mine
                    cryptocurrency, scrape data you don't have rights to, or
                    pretend to be us.
                </p>
                <p>
                    We may suspend or terminate accounts that violate the AUP.
                    Where the violation is severe (CSAM, credible threats of
                    violence, active malware distribution), suspension is
                    immediate and without notice.
                </p>
            </>
        ),
    },
    {
        id: 'ai',
        number: '08',
        title: 'Agents and AI',
        body: (
            <>
                <p>
                    kanNINJA does not provide AI features. We run no reasoning
                    models, and we generate no suggestions, summaries, or
                    drafts. The single exception is voice capture, which sends
                    audio you record to a third-party service to be turned into
                    text.
                </p>
                <p>
                    You may connect your own agent through the Model Context
                    Protocol. If you do:
                </p>
                <ul>
                    <li>
                        That agent acts with your authority. Anything it does
                        on your boards is treated as done by you.
                    </li>
                    <li>
                        Its outputs come from your model provider, not from us.
                        We make no warranty about their accuracy, and they are{' '}
                        <strong>not legal, medical, financial, or
                        professional advice</strong>.
                    </li>
                    <li>
                        Your agreement with that provider is yours alone. We are
                        not a party to it and take no responsibility under it.
                    </li>
                </ul>
                <p>
                    You may not use kanNINJA data to develop a product or
                    service that competes with kanNINJA, including by training
                    or fine-tuning a machine learning model on it.
                </p>
            </>
        ),
    },
    {
        id: 'termination',
        number: '09',
        title: 'Termination',
        body: (
            <>
                <p>
                    You may close your account at any time from Settings.
                </p>
                <p>
                    We may suspend or terminate your access if you materially
                    violate these Terms or the AUP, if your payment method
                    fails and is not corrected after notice, or if we are
                    required to by law. We will give you reasonable notice
                    where we can.
                </p>
                <p>
                    On termination, your right to access the service ends. We
                    will retain Your Content for at least 30 days so you can
                    export it, then delete it on the schedule described in the{' '}
                    <Link href="/privacy#retention">Privacy Policy</Link>.
                    Sections of these Terms that by their nature should survive
                    (intellectual property, disclaimers, limitations of
                    liability, indemnification, governing law) will survive.
                </p>
            </>
        ),
    },
    {
        id: 'disclaimers',
        number: '10',
        title: 'Disclaimers and limitation of liability',
        body: (
            <>
                <h3>Service provided "as is"</h3>
                <p>
                    The service is provided <strong>"as is" and "as
                    available"</strong> without warranties of any kind, express
                    or implied. We disclaim implied warranties of
                    merchantability, fitness for a particular purpose,
                    non-infringement, and any warranty arising from course of
                    dealing or trade usage. We do not warrant that the service
                    will be uninterrupted, error-free, or fully secure, or that
                    any connected agent will behave correctly.
                </p>
                <h3>Limitation of liability</h3>
                <p>
                    To the maximum extent permitted by law, kanNINJA, Brandon
                    Korous, and any agents or contractors will not be liable
                    for any indirect, incidental, special, consequential,
                    exemplary, or punitive damages, or for lost profits, lost
                    revenue, lost data, or business interruption, arising out
                    of or relating to these Terms or the service, whether
                    based on warranty, contract, tort, or any other legal
                    theory, even if advised of the possibility.
                </p>
                <p>
                    Our aggregate liability for all claims under these Terms
                    will not exceed the greater of (a){' '}
                    <strong>the amount you paid us in the 12 months
                    before the claim arose</strong> and (b){' '}
                    <strong>USD $100</strong>.
                </p>
                <p>
                    Some jurisdictions do not allow the exclusion or
                    limitation of certain warranties or liabilities. In those
                    jurisdictions, the exclusions and limitations apply only
                    to the extent permitted by law.
                </p>
            </>
        ),
    },
    {
        id: 'indemnification',
        number: '11',
        title: 'Indemnification',
        body: (
            <>
                <p>
                    You agree to defend, indemnify, and hold harmless kanNINJA
                    and Brandon Korous from any claim, loss, or expense
                    (including reasonable attorneys' fees) arising out of (a)
                    Your Content, (b) your use of the service in violation of
                    these Terms or the AUP, or (c) your violation of any law
                    or third-party right. We may take exclusive control of any
                    matter we are obligated to indemnify; you agree to
                    cooperate.
                </p>
            </>
        ),
    },
    {
        id: 'governing-law',
        number: '12',
        title: 'Governing law, disputes, and changes',
        body: (
            <>
                <h3>Governing law and venue</h3>
                <p>
                    These Terms are governed by the laws of the{' '}
                    <strong>State of California</strong>, without regard to
                    its conflict-of-laws principles. Any dispute arising out
                    of or relating to these Terms or the service will be
                    brought exclusively in the state or federal courts
                    located in <em>[County — to be added]</em>, California,
                    and you consent to the personal jurisdiction of those
                    courts.
                </p>
                <h3>Informal resolution</h3>
                <p>
                    Before filing suit, you agree to email{' '}
                    <a href="mailto:legal@kanninja.com">legal@kanninja.com</a>{' '}
                    with a description of the dispute and to give us 30 days
                    to try to resolve it informally.
                </p>
                <h3>No class actions</h3>
                <p>
                    Disputes will be resolved on an individual basis. You and
                    kanNINJA each waive the right to participate as a
                    plaintiff or class member in any class, consolidated, or
                    representative action.
                </p>
                <h3>Changes to these Terms</h3>
                <p>
                    We may update these Terms. Material changes take effect
                    at least seven days after we post them or email a notice,
                    whichever is later. Continued use of the service after
                    that means you accept the updated Terms. If you do not,
                    cancel your account.
                </p>
                <h3>Miscellaneous</h3>
                <p>
                    These Terms (with the documents linked from them) are the
                    entire agreement between you and kanNINJA regarding the
                    service. If any provision is held unenforceable, the rest
                    remain in effect. Our failure to enforce a right is not a
                    waiver. You may not assign these Terms without our
                    written consent; we may assign them in connection with a
                    merger, acquisition, or sale of substantially all our
                    assets.
                </p>
            </>
        ),
    },
];
