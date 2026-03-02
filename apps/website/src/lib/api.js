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
  setApiToken(data.token);
  return data;
}

// Overview
export async function apiGetOverview() {
  const { data } = await client.get('usage/overview');
  return data;
}

// API Keys
export async function apiGetKeys() {
  const { data } = await client.get('keys');
  return data;
}

export async function apiCreateKey(name) {
  const { data } = await client.post('keys', { name });
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

// Settings
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
