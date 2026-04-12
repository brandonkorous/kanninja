// Voice-aligned error messages for Clerk auth errors. Maps Clerk error codes
// to Hanko-voice strings. Fallback is specific-enough to be honest without
// being patronizing. Never "Oops" or "Something went wrong" — per hanko-voice.

const VOICE_MAP: Record<string, string> = {
    form_identifier_not_found: "We don't have an account with that email.",
    form_password_incorrect: "That password doesn't match.",
    form_identifier_exists: 'That email is already in use. Sign in instead.',
    form_password_pwned:
        'That password has shown up in a leak. Pick another one.',
    form_password_validation_failed: 'Password too short. Try eight or more.',
    form_password_length_too_short: 'Password too short. Try eight or more.',
    form_param_format_invalid: "That doesn't look like an email.",
    form_code_incorrect: "That code doesn't match. Check your email and try again.",
    verification_expired: 'That code expired. Send another?',
    too_many_requests: 'Too many tries. Wait a minute, then try again.',
};

type MaybeClerkError = {
    errors?: { code?: string; message?: string; longMessage?: string }[];
};

export function getClerkErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'errors' in err) {
        const clerkErr = err as MaybeClerkError;
        const first = clerkErr.errors?.[0];
        if (first?.code && VOICE_MAP[first.code]) {
            return VOICE_MAP[first.code];
        }
        if (first?.longMessage) return first.longMessage;
        if (first?.message) return first.message;
    }
    if (err instanceof Error) return err.message;
    return "Something on our end. Try again in a moment.";
}
