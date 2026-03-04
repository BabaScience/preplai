import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
    subject: 'Verify your email - Preplai',
    html: `
      <h1>Welcome${name ? `, ${name}` : ''}!</h1>
      <p>Thanks for signing up for Preplai. Click the link below to verify your email and get started.</p>
      <p><a href="${verifyUrl}">Verify my email</a></p>
      <p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
    `,
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
    subject: 'Welcome to Preplai!',
    html: `
      <h1>Welcome${name ? `, ${name}` : ''}!</h1>
      <p>Thanks for signing up for Preplai. You're all set to get started.</p>
      <p><a href="${APP_URL}/dashboard">Go to Dashboard</a></p>
    `,
  });
}
