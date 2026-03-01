import { useCallback, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { setApiToken } from '../lib/api';

/**
 * useApi — wraps an API function with loading/error state.
 * Usage: const { call, loading, error } = useApi(apiGetOverview);
 */
export function useApi(apiFn) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const call = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFn(...args);
      return result;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn]);

  return { call, loading, error };
}

/**
 * Sync the in-memory API token when auth state changes.
 * Call this hook near the top of your app after AuthContext is set up.
 */
export function useSyncApiToken() {
  const { token } = useAuth();
  setApiToken(token);
}
