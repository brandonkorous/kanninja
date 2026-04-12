// Extracts a voice-aligned error message from an unknown error. Defaults to
// a generic "Something on our end" line per the hanko-voice rule for errors:
// never "Oops" or "Try again later". The specific message comes from the API
// response when available; otherwise we fall back to a terse honest phrase.

export function getToastErrorMessage(err: unknown): string {
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'string') return err;
    return 'Something on our end. Try again in a moment.';
}
