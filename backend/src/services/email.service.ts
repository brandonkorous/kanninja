import { env } from '../config/env.js';

/**
 * Transactional email. Deliberately tiny: Better Auth needs exactly two
 * messages (verification code, password reset) and clan invitations will want
 * a third. There is no template engine and no queue — if that changes, this is
 * the seam to grow.
 *
 * Uses Resend's REST API directly rather than the SDK; it's one fetch call and
 * avoids another dependency in the runtime image.
 *
 * With no RESEND_API_KEY configured (local dev, CI) it logs the message
 * instead of sending. That keeps sign-up testable offline — the verification
 * code is right there in the server output — without silently swallowing
 * failures in production, where a missing key throws at boot via assertConfig.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain text. Every message we send is short enough not to need HTML. */
  text: string;
}

export class EmailError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'EmailError';
  }
}

/** Throws if email is unconfigured in an environment that needs it. */
export function assertEmailConfigured(): void {
  if (env.NODE_ENV === 'production' && !env.RESEND_API_KEY) {
    throw new Error(
      'RESEND_API_KEY is required in production — password resets and email ' +
        'verification silently fail without it.',
    );
  }
}

export async function sendEmail({ to, subject, text }: SendEmailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.info(
      `\n[email:dev] RESEND_API_KEY unset — not sending.\n  to: ${to}\n  subject: ${subject}\n${text}\n`,
    );
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new EmailError(
      `Resend rejected the message (${response.status}): ${detail.slice(0, 500)}`,
      response.status,
    );
  }
}

/**
 * Copy follows the Hanko voice: calm, direct, no exclamation marks, no
 * "Hi there!". The user asked for this — get out of their way.
 */

export function sendVerificationCodeEmail(to: string, code: string): Promise<void> {
  return sendEmail({
    to,
    subject: `${code} is your kanNINJA verification code`,
    text: [
      `Your verification code is ${code}.`,
      '',
      'It expires in 10 minutes.',
      "If you didn't request it, you can ignore this message.",
    ].join('\n'),
  });
}

export function sendPasswordResetCodeEmail(to: string, code: string): Promise<void> {
  return sendEmail({
    to,
    subject: `${code} is your kanNINJA password reset code`,
    text: [
      `Your password reset code is ${code}.`,
      '',
      'It expires in 10 minutes.',
      "If you didn't request a reset, you can ignore this message — your password won't change.",
    ].join('\n'),
  });
}

/**
 * Link-based reset. Better Auth's core `sendResetPassword` uses this; the app's
 * own forgot-password screen uses the code flow above (matching the flow users
 * already know), so this is the fallback path only.
 */
export function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  return sendEmail({
    to,
    subject: 'Reset your kanNINJA password',
    text: [
      'Use this link to set a new password:',
      url,
      '',
      'The link expires in 1 hour.',
      "If you didn't request a reset, you can ignore this message — your password won't change.",
    ].join('\n'),
  });
}
