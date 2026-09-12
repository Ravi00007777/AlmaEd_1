import { getResend, EMAIL_FROM } from '@/lib/resend';

// Centralizes the try/catch so a Resend outage or bad API key never breaks
// the Server Action it's called from (batch creation, resource upload,
// etc. must still succeed even if the notification email fails to send).
//
// The Resend SDK does NOT throw on an API-level rejection (e.g. a sandbox
// sender restricted to the account's own address) — it resolves with
// { data, error } instead. A try/catch alone silently swallows that, so
// each result's `error` is checked and logged explicitly too.
export async function sendEmails(recipients: { email: string }[], subject: string, html: string) {
  if (recipients.length === 0) return;

  try {
    const resend = getResend();
    const results = await Promise.all(
      recipients.map((recipient) =>
        resend.emails.send({ from: EMAIL_FROM, to: recipient.email, subject, html }),
      ),
    );

    results.forEach((result, i) => {
      if (result.error) {
        console.error(`Email to ${recipients[i]!.email} rejected by Resend:`, result.error);
      }
    });
  } catch (err) {
    console.error('Failed to send email notification:', err);
  }
}
