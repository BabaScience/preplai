/**
 * preplai email templates — matches app design (tokens.css)
 * Uses inline styles for email client compatibility.
 */

const COLORS = {
  bg: '#FAFAF8',
  surface: '#F5F4F1',
  surface2: '#EFEEEB',
  text: '#1a1b24',
  textMuted: '#6b6c78',
  primary: '#B8952F',
  primaryHover: '#A3822A',
  border: '#D8D6D1',
};

/**
 * Shared layout wrapper — dark header with logo, light body.
 */
function baseLayout({ preheader, content, appUrl }) {
  const logoUrl = `${appUrl}/`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
  <title>preplai</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${COLORS.primary}; }
  </style>
  <!--[if !mso]><!-->
  <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
  <!--<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; line-height: 1.6; color: ${COLORS.text}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${COLORS.bg};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0b0c10; padding: 24px 32px; border-radius: 8px 8px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <a href="${logoUrl}" style="text-decoration: none;">
                      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 22px; font-weight: 600; color: #e8e6e3; letter-spacing: -0.04em;">pr<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M 137.79,38.71 A 72,72 0 1,0 169.97,118.50 L 30.03,115.80' fill='none' stroke='%23e8e6e3' stroke-width='22' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E" width="16" height="16" alt="e" style="vertical-align: -1px; margin: 0 -1px;" />plai</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: ${COLORS.surface}; padding: 32px; border: 1px solid ${COLORS.border}; border-top: none; border-radius: 0 0 8px 8px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 24px 16px;">
              <p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted};">
                The presentation API for AI agents. Claude, ChatGPT, or any MCP client.
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
                <a href="${appUrl}" style="color: ${COLORS.primary}; text-decoration: none;">preplai.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Primary CTA button — matches .btn.btn-primary
 */
function ctaButton({ href, label }) {
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
  <tr>
    <td>
      <a href="${href}" style="display: inline-block; background-color: ${COLORS.primary}; color: #FAFAF8; font-size: 16px; font-weight: 500; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-family: 'Inter', sans-serif;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * Verification email template
 */
export function verificationEmailHtml({ name, verifyUrl, appUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const content = `
<p style="margin: 0 0 16px; font-size: 16px; color: ${COLORS.text};">
  ${greeting}
</p>
<p style="margin: 0 0 20px; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
  Thanks for signing up for preplai. Click the button below to verify your email and get started.
</p>
${ctaButton({ href: verifyUrl, label: 'Verify my email' })}
<p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.5;">
  This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
</p>
<p style="margin: 16px 0 0; font-size: 13px; color: ${COLORS.textMuted};">
  If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="${verifyUrl}" style="color: ${COLORS.primary}; word-break: break-all;">${verifyUrl}</a>
</p>`;

  return baseLayout({
    preheader: 'Verify your email to get started with preplai.',
    content,
    appUrl,
  });
}

/**
 * Password reset email template
 */
export function passwordResetEmailHtml({ name, resetUrl, appUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const content = `
<p style="margin: 0 0 16px; font-size: 16px; color: ${COLORS.text};">
  ${greeting}
</p>
<p style="margin: 0 0 20px; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
  We received a request to reset your password. Click the button below to choose a new one.
</p>
${ctaButton({ href: resetUrl, label: 'Reset my password' })}
<p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.5;">
  This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
</p>
<p style="margin: 16px 0 0; font-size: 13px; color: ${COLORS.textMuted};">
  If the button doesn't work, copy and paste this link into your browser:<br>
  <a href="${resetUrl}" style="color: ${COLORS.primary}; word-break: break-all;">${resetUrl}</a>
</p>`;

  return baseLayout({
    preheader: 'Reset your preplai password.',
    content,
    appUrl,
  });
}

/**
 * Welcome email template (post-verification)
 */
export function welcomeEmailHtml({ name, appUrl }) {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const content = `
<p style="margin: 0 0 16px; font-size: 16px; color: ${COLORS.text};">
  ${greeting}
</p>
<p style="margin: 0 0 20px; font-size: 16px; color: ${COLORS.text}; line-height: 1.6;">
  Your email is verified. You're all set to create cinema-quality presentations with AI agents.
</p>
${ctaButton({ href: `${appUrl}/dashboard`, label: 'Go to Dashboard' })}
<p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; line-height: 1.5;">
  Need help? Check out our <a href="${appUrl}" style="color: ${COLORS.primary};">docs</a> or reach out.
</p>`;

  return baseLayout({
    preheader: "You're all set. Start building with preplai.",
    content,
    appUrl,
  });
}
