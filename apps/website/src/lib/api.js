import axios from 'axios';

// Base URL for API. When unset in dev, Vite proxies /api to the API server.
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

// Module-level token store (in-memory, no localStorage)
let _token = null;

export function setApiToken(token) {
  _token = token;
}

export function clearApiToken() {
  _token = null;
}

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearApiToken();
      try {
        localStorage.removeItem('preplai_auth');
      } catch {}
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    const message = error.response?.data?.error || error.message || 'Request failed';
    throw new Error(message);
  }
);

// Auth
export async function apiLogin(email, password) {
  const { data } = await client.post('auth/login', { email, password });
  setApiToken(data.token);
  return data;
}

export async function apiSignup(email, password) {
  const { data } = await client.post('auth/signup', { email, password });
  if (!data.emailVerificationRequired) {
    setApiToken(data.token);
  }
  return data;
}

export async function apiVerifyEmail(token) {
  const { data } = await client.post('auth/verify-email', { token });
  return data;
}

export async function apiResendVerification(email) {
  const { data } = await client.post('auth/resend-verification', { email });
  return data;
}

export async function apiForgotPassword(email) {
  const { data } = await client.post('auth/forgot-password', { email });
  return data;
}

export async function apiResetPassword(token, password) {
  const { data } = await client.post('auth/reset-password', { token, password });
  return data;
}

export async function apiLogout() {
  try {
    await client.post('auth/logout');
  } finally {
    clearApiToken();
  }
}

// Overview
export async function apiGetOverview() {
  const { data } = await client.get('usage/overview');
  return data;
}

// Access Tokens
export async function apiGetKeys() {
  const { data } = await client.get('keys');
  return data;
}

export async function apiCreateKey(name) {
  const { data } = await client.post('keys', { name });
  return data;
}

export async function apiRenameKey(id, name) {
  const { data } = await client.patch(`keys/${id}`, { name });
  return data;
}

export async function apiRevokeKey(id) {
  const { data } = await client.delete(`keys/${id}`);
  return data;
}

// Sessions
export async function apiGetSessions(limit = 20) {
  const { data } = await client.get('sessions', { params: { limit } });
  return data;
}

export async function apiDeleteSession(id) {
  const { data } = await client.delete(`sessions/${id}`);
  return data;
}

// Usage
export async function apiGetUsage() {
  const { data } = await client.get('usage');
  return data;
}

export async function apiGetIllustrationDemand(sort = 'requests') {
  const { data } = await client.get(`usage/illustrations?sort=${sort}`);
  return data;
}

export async function apiDismissIllustration(typeName) {
  const { data } = await client.delete(`usage/illustrations/${encodeURIComponent(typeName)}`);
  return data;
}

export async function apiGetCategories() {
  const { data } = await client.get('usage/categories');
  return data;
}

// OAuth Clients (for Claude Web connector)
export async function apiGetOAuthClients() {
  const { data } = await client.get('oauth/clients');
  return data;
}

export async function apiCreateOAuthClient(name, redirectUris) {
  const { data } = await client.post('oauth/clients', { name, redirectUris });
  return data;
}

export async function apiUpdateOAuthClient(clientId, updates) {
  const { data } = await client.patch(`oauth/clients/${clientId}`, updates);
  return data;
}

export async function apiDeleteOAuthClient(clientId) {
  const { data } = await client.delete(`oauth/clients/${clientId}`);
  return data;
}

// Support
export async function apiSubmitFeedback(data) {
  const { data: result } = await client.post('support/feedback', data);
  return result;
}

export async function apiSubmitContact(data) {
  const { data: result } = await client.post('support/contact', data);
  return result;
}

export async function apiGetFeedback(status) {
  const params = status ? `?status=${status}` : '';
  const { data } = await client.get(`support/feedback${params}`);
  return data;
}

export async function apiUpdateFeedbackStatus(id, status) {
  const { data } = await client.patch(`support/feedback/${id}/status`, { status });
  return data;
}

export async function apiGetContacts(status) {
  const params = status ? `?status=${status}` : '';
  const { data } = await client.get(`support/contacts${params}`);
  return data;
}

export async function apiUpdateContactStatus(id, status) {
  const { data } = await client.patch(`support/contacts/${id}/status`, { status });
  return data;
}

// Session Ratings
export async function apiRateSession(sessionId, rating, comment) {
  const { data } = await client.put(`ratings/${sessionId}`, { rating, comment });
  return data;
}

export async function apiGetSessionRating(sessionId) {
  const { data } = await client.get(`ratings/${sessionId}`);
  return data;
}

export async function apiDeleteSessionRating(sessionId) {
  const { data } = await client.delete(`ratings/${sessionId}`);
  return data;
}

// Beta Survey
export async function apiGetSurveyStatus() {
  const { data } = await client.get('survey/status');
  return data;
}

export async function apiSubmitSurvey(answers) {
  const { data } = await client.post('survey', answers);
  return data;
}

// Settings
export async function apiGetSettings() {
  const { data } = await client.get('settings');
  return data;
}

export async function apiUpdateProfile(updates) {
  const { data } = await client.patch('settings/profile', updates);
  return data;
}

export async function apiUpdatePlayerPrefs(playerTheme, playerPalette) {
  const { data } = await client.patch('settings/player', {
    playerTheme,
    playerPalette,
  });
  return data;
}

export async function apiChangePassword(currentPassword, newPassword) {
  const { data } = await client.patch('settings/password', {
    currentPassword,
    newPassword,
  });
  return data;
}

export async function apiDeleteAccount() {
  const { data } = await client.delete('settings/account');
  return data;
}

export default client;
