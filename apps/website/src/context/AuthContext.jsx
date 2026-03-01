import { createContext, useContext, useState, useCallback } from 'react';
import { apiLogin, apiSignup } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState(null);

  const login = useCallback(async (emailVal, password) => {
    const data = await apiLogin(emailVal, password);
    setToken(data.token);
    setEmail(data.email);
    setUserId(data.user_id);
    return data;
  }, []);

  const signup = useCallback(async (emailVal, password) => {
    const data = await apiSignup(emailVal, password);
    setToken(data.token);
    setEmail(data.email);
    setUserId(data.user_id);
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setEmail(null);
    setUserId(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, userId, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
