/**
 * usePageView — Track page views on every route change.
 *
 * useLocation().pathname returns the current route path
 * (e.g. /dashboard/sessions), sent to GA4 on every navigation.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../lib/analytics';

export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}
