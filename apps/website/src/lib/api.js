import axios from 'axios';

// Detect if we're using CGI backend or Node.js API
const isCGI = (import.meta.env.VITE_API_URL || '').includes('api.py');
const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

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
    // Always set Authorization header (for Node.js API)
    config.headers.Authorization = `Bearer ${_token}`;

    // For CGI backend, also append token as query param (gateway may strip headers)
    if (isCGI) {
      const separator = (config.url || '').includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}token=${_token}`;
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Request failed';
    throw new Error(message);
  }
);

// Auth
export async function apiLogin(email, password) {
  const { data } = await client.post('/login', { email, password });
  setApiToken(data.token);
  return data;
}

export async function apiSignup(email, password) {
  const { data } = await client.post('/signup', { email, password });
  setApiToken(data.token);
  return data;
}

// Overview
export async function apiGetOverview() {
  // CGI backend: /overview, Node.js: /usage/overview
  const path = isCGI ? '/overview' : '/usage/overview';
  const { data } = await client.get(path);
  return data;
}

// API Keys
export async function apiGetKeys() {
  const { data } = await client.get('/keys');
  return data;
}

export async function apiCreateKey(name) {
  const { data } = await client.post('/keys', { name });
  return data;
}

export async function apiRevokeKey(id) {
  if (isCGI) {
    // CGI backend uses query string: DELETE /keys?id=X
    const { data } = await client.delete(`/keys?id=${id}`);
    return data;
  } else {
    // Node.js API uses path param: DELETE /keys/:id
    const { data } = await client.delete(`/keys/${id}`);
    return data;
  }
}

// Usage
export async function apiGetUsage() {
  const { data } = await client.get('/usage');
  return data;
}

// Settings
export async function apiChangePassword(currentPassword, newPassword) {
  const { data } = await client.post('/settings/password', {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return data;
}

export async function apiDeleteAccount() {
  if (isCGI) {
    // CGI backend: DELETE /account
    const { data } = await client.delete('/account');
    return data;
  } else {
    // Node.js API: DELETE /settings/account
    const { data } = await client.delete('/settings/account');
    return data;
  }
}

export default client;
