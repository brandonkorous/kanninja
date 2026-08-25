// Voice-aligned error messages for Better Auth errors. Maps Better Auth error
// codes to Hanko-voice strings. Fallback is specific enough to be honest
// without being patronizing. Never "Oops" or "Something went wrong" — per
// hanko-voice.
//
// Codes are the real ones from `BASE_ERROR_CODES` (better-auth) and
// `EMAIL_OTP_ERROR_CODES` (better-auth/plugins), not invented.

const VOICE_MAP: Record<string, string> = {
    // Credentials. Better Auth deliberately returns one code for both "no such
    // user" and "wrong password" so the endpoint isn't an account-enumeration
    // oracle — so the copy has to stay vague here too. This is a real UX
    // regression from Clerk, and the right trade.
    INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
    INVALID_PASSWORD: "That password doesn't match.",
    USER_NOT_FOUND: "We don't have an account with that email.",
    CREDENTIAL_ACCOUNT_NOT_FOUND:
        'That account signs in with Google. Use "Continue with Google" instead.',

    // Sign-up
    USER_ALREADY_EXISTS: 'That email is already in use. Sign in instead.',
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'That email is already in use. Sign in instead.',
    INVALID_EMAIL: "That doesn't look like an email.",
    PASSWORD_TOO_SHORT: 'Password too short. Try eight or more.',
    PASSWORD_TOO_LONG: 'That password is too long.',

    // Verification codes
    INVALID_OTP: "That code doesn't match. Check your email and try again.",
    OTP_EXPIRED: 'That code expired. Send another?',
    TOO_MANY_ATTEMPTS: 'Too many tries. Request a fresh code.',
    TOKEN_EXPIRED: 'That link expired. Start over?',
    INVALID_TOKEN: 'That link is no longer valid. Start over?',
    EMAIL_NOT_VERIFIED: 'Verify your email first — check your inbox for a code.',
    EMAIL_ALREADY_VERIFIED: 'That email is already verified. Sign in.',

    // Social
    SOCIAL_ACCOUNT_ALREADY_LINKED: 'That Google account is already linked to another sign-in.',
    LINKED_ACCOUNT_ALREADY_EXISTS: 'That account is already linked.',

    // Session
    SESSION_EXPIRED: 'Your session expired. Sign in again.',
};

/**
 * Better Auth client methods resolve to `{ data, error }` rather than throwing,
 * where `error` is `{ code?, message?, status? }`. This accepts either that
 * object or a thrown value, so callers can use whichever shape they have.
 */
type AuthErrorLike = {
    code?: string | null;
    message?: string | null;
    status?: number;
};

export function getAuthErrorMessage(err: unknown): string {
    if (err && typeof err === 'object') {
        const e = err as AuthErrorLike;

        if (e.code && VOICE_MAP[e.code]) return VOICE_MAP[e.code];

        // Rate limiting comes back as a status, not a code.
        if (e.status === 429) return 'Too many tries. Wait a minute, then try again.';

        if (e.message) return e.message;
    }

    if (err instanceof Error) return err.message;
    return 'Something on our end. Try again in a moment.';
}
