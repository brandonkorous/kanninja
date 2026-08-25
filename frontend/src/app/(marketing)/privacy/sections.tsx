import Link from 'next/link';
import type { LegalSectionData } from '@/components/marketing/LegalLayout';

// Section content for /privacy. Hanko voice: plain English, short paragraphs,
// no fine print buried in subordinate clauses. Each section's body renders
// inside <LegalLayout>'s .legal-prose container — author plain JSX, links and
// lists pick up styling from globals.css.

export const privacySections: LegalSectionData[] = [
    {
        id: 'who-we-are',
        number: '01',
        title: 'Who we are',
        body: (
            <>
                <p>
                    kanNINJA is operated by <strong>Brandon Korous</strong>, a sole
                    proprietor based in California, doing business as kanNINJA (part
                    of the WizeWorks brand). For privacy questions or to exercise the
                    rights described below, email{' '}
                    <a href="mailto:privacy@kanninja.com">privacy@kanninja.com</a>.
                </p>
                <p>
                    Mailing address: <em>[Address — to be added]</em>.
                </p>
                <p>
                    This policy covers the kanninja.com / kanninja.app web app, our
                    marketing pages, and any related services. It does not cover
                    third-party sites we link to, even when we link to them often.
                </p>
            </>
        ),
    },
    {
        id: 'what-we-collect',
        number: '02',
        title: 'Information we collect',
        body: (
            <>
                <p>We collect only what we need to run the service.</p>
                <h3>Account information</h3>
                <p>
                    When you create an account, we store your name, email, and — if
                    you set one — a password. Passwords are hashed before they are
                    stored; we never hold the original. If you sign in with Google
                    instead, we store the identifier Google gives us and your basic
                    profile fields, never your Google password.
                </p>
                <h3>Billing information</h3>
                <p>
                    When you subscribe to a paid plan, Stripe processes your card.
                    We never see or store your full card number. We do receive and
                    store the last four digits, card brand, billing country and
                    postal code, and the Stripe customer and subscription IDs so we
                    can show your billing history and renew your plan.
                </p>
                <h3>Content you create</h3>
                <p>
                    Boards, lists, cards, comments, checklists, attachments, custom
                    fields, time entries, and anything else you put into kanNINJA.
                    We store this so the product works. We do not read it for any
                    purpose other than operating the service and responding to your
                    support requests.
                </p>
                <h3>Usage and device data</h3>
                <p>
                    Pages you visit, features you click, approximate location
                    derived from IP, browser type, operating system, and timestamps.
                    We use this through Google Analytics and Microsoft Clarity (see
                    section 06).
                </p>
                <h3>Voice capture</h3>
                <p>
                    If you record a voice note to create a card, the audio clip is
                    sent to our Azure OpenAI resource to be turned into text. We keep
                    the resulting text as the card you created. We do not keep the
                    audio, and nothing else about your boards is sent with it.
                </p>
                <h3>Integration data</h3>
                <p>
                    If you connect Google Calendar, Slack, or GitHub, we receive
                    OAuth tokens and the data you authorize us to read (calendar
                    events, channel metadata, repository metadata). We only fetch
                    what the integration needs.
                </p>
                <h3>Email</h3>
                <p>
                    Our email provider Resend delivers transactional messages
                    (invitations, password resets, billing receipts, important
                    account notices). Resend logs delivery metadata.
                </p>
            </>
        ),
    },
    {
        id: 'how-we-use',
        number: '03',
        title: 'How we use information',
        body: (
            <>
                <p>We use the information above to:</p>
                <ul>
                    <li>Operate, maintain, and secure the service.</li>
                    <li>Authenticate you and protect your account.</li>
                    <li>Process payments and renew or cancel your subscription.</li>
                    <li>
                        Send transactional email (invitations, receipts, security
                        notices).
                    </li>
                    <li>
                        Turn a voice note into text, when you record one.
                    </li>
                    <li>
                        Understand which features are used and which are broken,
                        through analytics and session replay.
                    </li>
                    <li>Respond to support requests and bug reports.</li>
                    <li>Comply with legal obligations and enforce our Terms.</li>
                </ul>
                <p>
                    <strong>We do not sell your personal information.</strong> We
                    do not share it with advertisers. We do not use your content to
                    train any AI model — ours or anyone else's. kanNINJA runs no
                    reasoning models at all, so your board content is never sent to
                    a language model by us.
                </p>
            </>
        ),
    },
    {
        id: 'who-we-share',
        number: '04',
        title: 'Who we share information with',
        body: (
            <>
                <p>
                    We share information with a small set of service providers
                    ("subprocessors") who help us run the service, each under a
                    contract that limits what they can do with it. The current list
                    is on our{' '}
                    <Link href="/subprocessors">Subprocessors page</Link>. It
                    includes Stripe (payments), Microsoft Azure (database and file
                    storage), Google Cloud (application hosting), Azure OpenAI
                    (voice transcription), Microsoft Clarity (session replay),
                    Google Analytics (web analytics), and Resend (email).
                </p>
                <p>
                    Beyond subprocessors, we share information only:
                </p>
                <ul>
                    <li>
                        With other members of a board or clan you belong to — they
                        see what you contribute there, the way they would in any
                        shared workspace.
                    </li>
                    <li>
                        When the law requires it (subpoena, court order, valid
                        government request). We push back on overbroad requests.
                    </li>
                    <li>
                        If kanNINJA is acquired or merged, customer data transfers
                        to the successor under this policy. We will give notice
                        before that happens.
                    </li>
                </ul>
            </>
        ),
    },
    {
        id: 'ai',
        number: '05',
        title: 'AI, and why we do not run one',
        body: (
            <>
                <p>
                    kanNINJA has no built-in AI. We removed it. We run no reasoning
                    models and we do not send your cards, comments, or boards to any
                    language model.
                </p>
                <p>
                    If you connect your own agent over MCP — Claude, ChatGPT, Cursor
                    or another client — then that agent reads the boards you gave it
                    access to, using the model provider you already chose. That
                    exchange is between you and your provider, under their privacy
                    terms, not ours. You can see and revoke every connected agent on
                    the Agents page.
                </p>
                <p>
                    The one exception is voice capture. Audio you record is sent to
                    our Azure OpenAI resource in the United States purely to produce
                    a transcript. Microsoft does not use Azure OpenAI customer data
                    to train models, and we do not retain the audio once the
                    transcript comes back. We rely on that commitment, and we add one
                    of our own:{' '}
                    <strong>
                        we do not train, fine-tune, or build any model on customer
                        content.
                    </strong>
                </p>
                <p>
                    Voice capture only runs when you press record. If you never use
                    it, no audio ever leaves your device.
                </p>
            </>
        ),
    },
];
