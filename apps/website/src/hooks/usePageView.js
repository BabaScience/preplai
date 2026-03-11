/**
 * usePageView — Track page views on every route change.
 *
 * Works with HashRouter: useLocation().pathname returns the path
 * after the # (e.g. /dashboard/sessions), so no special parsing needed.
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
