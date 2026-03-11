/**
 * CookieConsent — GDPR-compliant consent banner for analytics.
 *
 * Appears once when the user has never made a choice.
 * Accept → loads GA, Decline → GA never loads.
 * Choice persisted in localStorage.
 */
import { useState } from 'react';
import { hasAnalyticsConsent, setAnalyticsConsent } from '../lib/analytics';

export default function CookieConsent() {
  const [visible, setVisible] = useState(() => hasAnalyticsConsent() === null);

  if (!visible) return null;

  const handleAccept = () => {
    setAnalyticsConsent(true);
    setVisible(false);
  };

  const handleDecline = () => {
    setAnalyticsConsent(false);
    setVisible(false);
  };

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <p>We use cookies to understand how you use Preplai and improve the experience.</p>
      <div className="cookie-consent-actions">
        <button className="btn btn-ghost btn-sm" onClick={handleDecline}>
          Decline
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleAccept}>
          Accept
        </button>
      </div>
    </div>
  );
}
