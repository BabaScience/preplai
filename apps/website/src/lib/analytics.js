/**
 * analytics.js — GA4 utility module
 *
 * Pure JS (no React). Controls the gtag.js lifecycle, consent gating,
 * page-view tracking, and custom event dispatch.
 *
 * All public functions no-op silently when VITE_GA_ID is unset or
 * analytics has not been initialized (consent not given).
 */

const GA_ID = import.meta.env.VITE_GA_ID;
const CONSENT_KEY = 'preplai_analytics_consent';

let initialized = false;

// ── Consent ──────────────────────────────────────────────────────────

/**
 * Check if user has consented to analytics.
 * @returns {boolean | null} true = granted, false = denied, null = never asked
 */
export function hasAnalyticsConsent() {
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (value === 'granted') return true;
    if (value === 'denied') return false;
    return null;
  } catch {
    return null;
  }
}

/**
 * Record the user's consent choice. If granted, initializes analytics.
 */
export function setAnalyticsConsent(granted) {
  try {
    localStorage.setItem(CONSENT_KEY, granted ? 'granted' : 'denied');
  } catch {
    // localStorage unavailable
  }
  if (granted) initAnalytics();
}

// ── Initialization ───────────────────────────────────────────────────

/**
 * Inject the gtag.js script and configure GA4.
 * Safe to call multiple times — only initializes once.
 */
export function initAnalytics() {
  if (initialized || !GA_ID) return;
  initialized = true;

  // Inject gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: false, // manual page views via usePageView hook
  });
}

// ── Tracking ─────────────────────────────────────────────────────────

/**
 * Track a page view (call on every route change).
 */
export function trackPageView(path, title) {
  if (!initialized || !GA_ID) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track a custom event.
 */
export function trackEvent(eventName, params = {}) {
  if (!initialized || !GA_ID) return;
  window.gtag('event', eventName, params);
}

/**
 * Set user properties (e.g. after login).
 */
export function setUserProperties(props) {
  if (!initialized || !GA_ID) return;
  window.gtag('set', 'user_properties', props);
}
