import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiLogin, apiSignup, apiLogout, apiVerifyEmail, apiResendVerification } from '../lib/api';

const AUTH_STORAGE_KEY = 'preplai_auth';

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistAuth(obj) {
  try {
    if (obj?.token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(obj));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const stored = getStoredAuth();
  const [token, setToken] = useState(stored?.token ?? null);
  const [email, setEmail] = useState(stored?.email ?? null);
  const [userId, setUserId] = useState(stored?.userId ?? null);

  const login = useCallback(async (emailVal, password) => {
    const data = await apiLogin(emailVal, password);
    const auth = {
      token: data.token,
      email: data.user?.email ?? data.email,
      userId: data.user?.id ?? data.user_id,
    };
    setToken(auth.token);
    setEmail(auth.email);
    setUserId(auth.userId);
    persistAuth(auth);
    return data;
  }, []);

  const signup = useCallback(async (emailVal, password) => {
    const data = await apiSignup(emailVal, password);
    if (!data.emailVerificationRequired && data.token) {
      const auth = {
        token: data.token,
        email: data.user?.email ?? data.email,
        userId: data.user?.id ?? data.user_id,
      };
      setToken(auth.token);
      setEmail(auth.email);
      setUserId(auth.userId);
      persistAuth(auth);
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    setToken(null);
    setEmail(null);
    setUserId(null);
    persistAuth(null);
    await apiLogout();
  }, []);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        userId,
        login,
        signup,
        logout,
        verifyEmail: apiVerifyEmail,
        resendVerification: apiResendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
