import Link from 'next/link';

/**
 * The one-time sign-in notice for the Clerk → Better Auth cutover.
 *
 * It removes itself. `CUTOVER` is the day the new sign-in went live and the
 * notice stops rendering 14 days later — the deadline is a fact about the
 * migration, not a preference someone has to remember to act on. Nothing needs
 * deploying to take it down, which matters because the person who would
 * remember in a fortnight is the same person who was busy migrating.
 *
 * SET `CUTOVER` ON THE DAY, not in advance. Its value is read as "when did
 * people last sign in with the old system", and a guessed date either shows the
 * notice to nobody or keeps showing it after it has stopped being true.
 * Deleting this component after it expires is tidy but optional.
 */

// The date the Better Auth sign-in replaced Clerk. UTC midnight.
const CUTOVER = Date.UTC(2026, 7, 26); // 2026-08-26 — month is 0-indexed
const VISIBLE_DAYS = 14;

export function migrationNoticeVisible(now: number = Date.now()): boolean {
    return now < CUTOVER + VISIBLE_DAYS * 24 * 60 * 60 * 1000;
}

export function MigrationNotice() {
    if (!migrationNoticeVisible()) return null;

    return (
        <aside
            // `role="status"` rather than `alert`: this is standing context a
            // visitor reads on arrival, not an interruption. `alert` would make
            // a screen reader talk over whatever the user was already doing.
            role="status"
            className="bg-base-100 border border-base-300 shadow-e1 rounded-lg p-6 mb-8"
        >
            <p className="text-eyebrow font-mono uppercase tracking-widest text-primary">
                One-time notice
            </p>

            <p className="text-base mt-3">
                We rebuilt how you sign in. Your dojos, Kata and clans are untouched.
            </p>

            <dl className="mt-4 space-y-3 text-sm">
                <div>
                    <dt className="font-semibold">You used a password</dt>
                    <dd className="text-base-content/70 mt-1">
                        Set a new one. We left the old passwords behind on purpose —{' '}
                        <Link
                            href="/forgot-password"
                            className="text-primary underline underline-offset-2 focus-visible:shadow-focus rounded-sm"
                        >
                            reset it here
                        </Link>
                        .
                    </dd>
                </div>
                <div>
                    <dt className="font-semibold">You used Google</dt>
                    <dd className="text-base-content/70 mt-1">
                        Nothing changed. Continue with Google as you always have.
                    </dd>
                </div>
            </dl>
        </aside>
    );
}
