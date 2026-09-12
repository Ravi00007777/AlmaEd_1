import { Resend } from 'resend';

// Lazy on purpose: instantiating Resend with a missing/empty key throws
// immediately, which would crash `next build`'s static analysis of any
// route that imports this at module scope (e.g. the cron route).
let client: Resend | undefined;

export function getResend(): Resend {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
