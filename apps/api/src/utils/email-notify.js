/**
 * Admin notification emails for support submissions.
 * Uses the existing Resend email infrastructure.
 * Sends to ADMIN_EMAIL env var recipient.
 * Falls back to console.log if email is not configured.
 * Never throws — notification failure should never break the API.
 */
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Preplai <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

/**
 * Send a plain-text notification email to the admin.
 * If Resend or ADMIN_EMAIL is not configured, logs to console instead.
 *
 * @param {{ subject: string, body: string }} opts
 */
export async function notifyAdmin({ subject, body }) {
  try {
    if (!resend || !ADMIN_EMAIL) {
      console.log(`[email-notify] ${subject}\n${body}`);
      return;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      text: body,
    });
  } catch (err) {
    // Never throw — just log and move on
    console.error('[email-notify] Failed to send notification:', err?.message || err);
  }
}
