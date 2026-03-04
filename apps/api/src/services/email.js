import { Resend } from 'resend';
import { verificationEmailHtml, welcomeEmailHtml } from './email-templates.js';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (!resend && process.env.NODE_ENV !== 'test') {
  console.warn(
    '[email] RESEND_API_KEY not set — verification and welcome emails will not be sent. Add it to .env at the repo root.'
  );
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'Preplai <onboarding@resend.dev>';
const APP_URL = process.env.APP_URL || 'https://preplai.com';

/**
 * Send a verification email with a link to verify the user's email.
 * No-ops if RESEND_API_KEY is not set (e.g. tests, local dev).
 */
export async function sendVerificationEmail({ to, name, verifyToken }) {
  if (!resend) {
    return;
  }

  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(verifyToken)}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Verify your email — preplai',
    html: verificationEmailHtml({ name, verifyUrl, appUrl: APP_URL }),
  });
}

/**
 * Send a welcome email to a newly registered user (e.g. post-verification).
 * No-ops if RESEND_API_KEY is not set (e.g. tests, local dev).
 */
export async function sendWelcomeEmail({ to, name }) {
  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to preplai — you\'re all set',
    html: welcomeEmailHtml({ name, appUrl: APP_URL }),
  });
}
