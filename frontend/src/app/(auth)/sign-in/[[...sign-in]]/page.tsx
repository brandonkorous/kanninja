import { SignInForm } from '@/components/auth/SignInForm';
import { MigrationNotice } from '@/components/auth/MigrationNotice';

export const metadata = {
    title: 'kanNINJA — Sign in',
    description: 'Sign in to begin.',
};

// MigrationNotice expires by comparing against `Date.now()`, and a statically
// rendered page would evaluate that ONCE at build time and then serve the
// answer forever — the notice would either never appear or never leave, and
// nothing would look broken either way. Rendering per request is what makes the
// 14-day expiry real.
//
// Remove this line together with the notice; the page has no other reason to be
// dynamic.
export const dynamic = 'force-dynamic';

export default function SignInPage() {
    return (
        <>
            <MigrationNotice />
            <SignInForm />
        </>
    );
}
