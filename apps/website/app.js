/* app.js — preplai SPA with hash routing */

// ── Config ───────────────────────────────────────────────
const CGI_BIN = '__CGI_BIN__';
window.__session = { token: null, email: null, userId: null };

// ── Logo SVG ─────────────────────────────────────────────
const LOGO_SVG = `<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="var(--color-primary)"/>
  <path d="M8 8h6a6 6 0 0 1 0 12H8z" fill="none" stroke="var(--color-text-inverse)" stroke-width="2.5"/>
  <circle cx="22" cy="22" r="3" fill="var(--color-text-inverse)"/>
</svg>`;

const LOGO_FULL = `<div style="display:flex;align-items:center;gap:var(--space-3);">
  ${LOGO_SVG}
  <span style="font-family:var(--font-display);font-size:var(--text-lg);font-style:italic;color:var(--color-text);">preplai</span>
</div>`;

// ── Theme ────────────────────────────────────────────────
let currentTheme = 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);

function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
}

function themeIcon() {
  return currentTheme === 'dark'
    ? '<i data-lucide="sun" style="width:18px;height:18px;"></i>'
    : '<i data-lucide="moon" style="width:18px;height:18px;"></i>';
}

// ── API Client ───────────────────────────────────────────
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (window.__session.token) {
    headers['Authorization'] = `Bearer ${window.__session.token}`;
  }
  const res = await fetch(`${CGI_BIN}/api.py${path}`, {
    ...opts,
    headers: { ...headers, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ── Router ───────────────────────────────────────────────
let currentDashSection = 'overview';

function navigate(hash) {
  window.location.hash = hash;
}

let currentView = null;

function router() {
  const hash = window.location.hash.slice(1) || 'home';
  const app = document.getElementById('app');

  // Landing page section anchors — don't re-render, just scroll
  const landingSections = ['features', 'pricing', 'setup'];
  if (landingSections.includes(hash)) {
    if (currentView !== 'landing') {
      renderLanding(app);
      currentView = 'landing';
    }
    requestAnimationFrame(() => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (window.lucide) window.lucide.createIcons();
    });
    return;
  }

  if (hash === 'home' || hash === '') {
    currentView = 'landing';
    renderLanding(app);
  } else if (hash === 'login') {
    currentView = 'auth';
    renderAuth(app, 'login');
  } else if (hash === 'signup') {
    currentView = 'auth';
    renderAuth(app, 'signup');
  } else if (hash.startsWith('dashboard')) {
    if (!window.__session.token) {
      navigate('login');
      return;
    }
    currentView = 'dashboard';
    const sub = hash.split('/')[1] || 'overview';
    currentDashSection = sub;
    renderDashboard(app, sub);
  } else {
    currentView = 'landing';
    renderLanding(app);
  }

  // Init icons after render
  requestAnimationFrame(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ── Landing Page ─────────────────────────────────────────
function renderLanding(app) {
  document.body.style.overflow = '';
  document.body.style.height = '';

  app.innerHTML = `
    <div class="dashboard-layout landing-mode">
      <!-- Nav -->
      <nav class="landing-nav">
        <a href="#home" class="nav-logo">${LOGO_FULL}</a>
        <ul class="nav-links" role="list">
          <li class="nav-link-desktop"><a href="#features">Features</a></li>
          <li class="nav-link-desktop"><a href="#pricing">Pricing</a></li>
          <li class="nav-link-desktop"><a href="#setup">Setup</a></li>
          <li>
            <button class="theme-toggle-btn" onclick="toggleTheme();router();" aria-label="Toggle theme">
              ${themeIcon()}
            </button>
          </li>
          <li><a href="#login" class="btn btn-ghost btn-sm">Log in</a></li>
          <li><a href="#signup" class="btn btn-primary btn-sm">Get API Key</a></li>
        </ul>
      </nav>

      <!-- Hero -->
      <section class="hero-section">
        <h1>Cinema-quality<br>presentations.<br><span class="gold">Built by AI agents.</span></h1>
        <p class="hero-sub">preplai is the presentation engine that AI agents use to create live, animated, voice-synced visual experiences. Not slides. Cinema.</p>
        <div class="hero-ctas">
          <a href="#signup" class="btn btn-primary btn-lg">Get API Key</a>
          <a href="https://docs.preplai.com" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-lg">View Docs</a>
        </div>
        <div class="hero-terminal fade-in">
          <div class="terminal-bar">
            <span class="terminal-dot"></span>
            <span class="terminal-dot"></span>
            <span class="terminal-dot"></span>
            <span class="terminal-title">Claude Desktop</span>
          </div>
          <div class="terminal-body">
            <span class="prompt">&gt;</span> <span class="cmd">Create a presentation about our Q4 results</span><br><br>
            <span style="color:var(--color-text-faint)">Using preplai MCP server...</span><br>
            <span style="color:var(--color-success)">✓</span> Session created<br>
            <span style="color:var(--color-success)">✓</span> 5 scenes built<br>
            <span style="color:var(--color-success)">✓</span> Voice narration synced<br><br>
            <span class="prompt">→</span> <span class="cmd" style="color:var(--color-primary)">https://play.preplai.com/abc123</span>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section id="features" class="section-block">
        <div class="section-label">Features</div>
        <h2>Everything agents need</h2>
        <p class="section-desc">One API. Eight tools. Cinema-quality output.</p>
        <div class="features-grid">
          <div class="feature-card fade-in">
            <div class="feature-icon"><i data-lucide="cpu"></i></div>
            <h3>Agent-Native MCP API</h3>
            <p>Built for Claude, ChatGPT, and any MCP client. 8 tools, one API key. Native integration with the tools your agents already use.</p>
          </div>
          <div class="feature-card fade-in">
            <div class="feature-icon"><i data-lucide="zap"></i></div>
            <h3>Live & Real-Time</h3>
            <p>SSE-powered player updates in real time as the agent builds. No waiting for exports. Watch your presentation come alive.</p>
          </div>
          <div class="feature-card fade-in">
            <div class="feature-icon"><i data-lucide="film"></i></div>
            <h3>Cinema Quality</h3>
            <p>Dark cinematic theme, smooth animations, Inter typography. Not PowerPoint. Cinema. Every frame designed to impress.</p>
          </div>
          <div class="feature-card fade-in">
            <div class="feature-icon"><i data-lucide="link"></i></div>
            <h3>Shareable Links</h3>
            <p>Every presentation gets a unique URL. Share instantly. No downloads needed. Works on any device with a browser.</p>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="section-block" style="border-top:1px solid var(--color-divider);">
        <div class="section-label">How It Works</div>
        <h2>Three steps to cinema</h2>
        <p class="section-desc">From API key to live presentation in minutes.</p>
        <div class="steps-grid">
          <div class="step-item fade-in">
            <h3>Get your API key</h3>
            <p>Sign up for free and generate your first API key in seconds. No credit card required.</p>
          </div>
          <div class="step-item fade-in">
            <h3>Add to Claude Desktop</h3>
            <p>Drop the MCP server config into your Claude Desktop settings. One JSON block, done.</p>
          </div>
          <div class="step-item fade-in">
            <h3>Ask your AI to present</h3>
            <p>Tell Claude to create a presentation. Watch it build scenes in real time. Share the link.</p>
          </div>
        </div>
      </section>

      <!-- Pricing -->
      <section id="pricing" class="section-block" style="border-top:1px solid var(--color-divider);">
        <div class="section-label">Pricing</div>
        <h2>Start free, scale up</h2>
        <p class="section-desc">Generous free tier. No credit card required.</p>
        <div class="pricing-grid">
          <div class="pricing-card">
            <div class="tier-name">Free</div>
            <div class="price">$0 <span>/forever</span></div>
            <div class="price-note">For trying things out</div>
            <ul class="pricing-features" role="list">
              <li>5 sessions</li>
              <li>50 scenes per month</li>
              <li>10 scenes per session</li>
              <li>7-day link expiry</li>
            </ul>
            <a href="#signup" class="btn btn-primary" style="width:100%;">Get Started</a>
          </div>
          <div class="pricing-card featured">
            <div class="tier-name">Pro</div>
            <div class="price">$19 <span>/month</span></div>
            <div class="price-note">For teams and power users</div>
            <ul class="pricing-features" role="list">
              <li>100 sessions per month</li>
              <li>2,000 scenes per month</li>
              <li>100 scenes per session</li>
              <li>90-day link expiry</li>
            </ul>
            <button class="btn btn-ghost" style="width:100%;" disabled>Coming Soon</button>
          </div>
          <div class="pricing-card">
            <div class="tier-name">Enterprise</div>
            <div class="price">Custom</div>
            <div class="price-note">For organizations</div>
            <ul class="pricing-features" role="list">
              <li>Unlimited sessions</li>
              <li>Unlimited scenes</li>
              <li>Custom domain</li>
              <li>Priority support</li>
              <li>SSO & audit logs</li>
            </ul>
            <a href="mailto:hello@preplai.com" target="_blank" rel="noopener noreferrer" class="btn btn-ghost" style="width:100%;">Contact Us</a>
          </div>
        </div>
      </section>

      <!-- Setup -->
      <section id="setup" class="section-block" style="border-top:1px solid var(--color-divider);">
        <div class="section-label">Setup Guide</div>
        <h2>Add to Claude Desktop</h2>
        <p class="section-desc">Copy this into your Claude Desktop MCP configuration.</p>
        <div class="setup-block">
          <div class="code-block">
            <pre>{
  <span class="ck">"mcpServers"</span>: {
    <span class="ck">"preplai"</span>: {
      <span class="ck">"command"</span>: <span class="cs">"npx"</span>,
      <span class="ck">"args"</span>: [<span class="cs">"-y"</span>, <span class="cs">"@preplai/mcp-server"</span>],
      <span class="ck">"env"</span>: {
        <span class="ck">"PREPLAI_API_KEY"</span>: <span class="cs">"plai_your_key_here"</span>,
        <span class="ck">"BASE_URL"</span>: <span class="cs">"https://api.preplai.com"</span>
      }
    }
  }
}</pre>
          </div>
          <div style="margin-top:var(--space-6);display:flex;gap:var(--space-4);flex-wrap:wrap;">
            <a href="#signup" class="btn btn-primary">Get Your API Key</a>
            <a href="https://docs.preplai.com" target="_blank" rel="noopener noreferrer" class="btn btn-ghost">Full Documentation</a>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="site-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            ${LOGO_FULL}
            <p>Cinema-quality presentations.<br>Built by AI agents.</p>
          </div>
          <div class="footer-links">
            <a href="https://docs.preplai.com" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="https://github.com/preplai" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#pricing">Pricing</a>
            <a href="#dashboard">Dashboard</a>
          </div>
        </div>
        <div class="footer-bottom">
          Built by BabaScience &middot; &copy; ${new Date().getFullYear()} preplai. All rights reserved.
        </div>
      </footer>
    </div>
  `;
}

// ── Auth Pages ───────────────────────────────────────────
function renderAuth(app, mode) {
  document.body.style.overflow = '';
  document.body.style.height = '';

  const isLogin = mode === 'login';
  const title = isLogin ? 'Welcome back' : 'Create your account';
  const sub = isLogin ? 'Log in to manage your API keys.' : 'Get started with preplai for free.';
  const btnText = isLogin ? 'Log In' : 'Create Account';
  const footerText = isLogin
    ? `Don't have an account? <a href="#signup">Sign up</a>`
    : `Already have an account? <a href="#login">Log in</a>`;

  app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:var(--space-6);">${LOGO_SVG}</div>
        <h1 style="text-align:center;">${title}</h1>
        <p class="auth-sub" style="text-align:center;">${sub}</p>
        <div id="auth-alert"></div>
        <form class="auth-form" id="auth-form">
          <div class="input-group">
            <label for="auth-email">Email</label>
            <input type="email" id="auth-email" class="input-field" placeholder="you@example.com" required autocomplete="email">
          </div>
          <div class="input-group">
            <label for="auth-password">Password</label>
            <input type="password" id="auth-password" class="input-field" placeholder="${isLogin ? 'Your password' : 'Min. 6 characters'}" required minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%;" id="auth-submit">${btnText}</button>
        </form>
        <div class="auth-footer">${footerText}</div>
        <div style="text-align:center;margin-top:var(--space-4);">
          <a href="#home" style="font-size:var(--text-sm);color:var(--color-text-faint);">&larr; Back to home</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const btn = document.getElementById('auth-submit');
    const alertEl = document.getElementById('auth-alert');
    alertEl.innerHTML = '';
    btn.disabled = true;
    btn.textContent = isLogin ? 'Logging in...' : 'Creating account...';

    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const data = await api(endpoint, { method: 'POST', body: { email, password } });
      window.__session = { token: data.token, email: data.email, userId: data.user_id };
      navigate('dashboard/overview');
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      btn.disabled = false;
      btn.textContent = btnText;
    }
  });
}

// ── Dashboard ────────────────────────────────────────────
function renderDashboard(app, section) {
  document.body.style.overflow = 'hidden';
  document.body.style.height = '100%';

  const sections = [
    { id: 'overview', label: 'Overview', icon: 'layout-dashboard' },
    { id: 'keys', label: 'API Keys', icon: 'key' },
    { id: 'usage', label: 'Usage', icon: 'bar-chart-3' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const sectionTitle = sections.find(s => s.id === section)?.label || 'Overview';

  app.innerHTML = `
    <div class="dashboard-layout">
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="dash-sidebar" id="dash-sidebar">
        <div class="sidebar-logo">
          <a href="#home" style="text-decoration:none;">${LOGO_FULL}</a>
        </div>
        <nav class="sidebar-nav">
          ${sections.map(s => `
            <button class="sidebar-nav-item ${s.id === section ? 'active' : ''}" onclick="navigate('dashboard/${s.id}')">
              <i data-lucide="${s.icon}" style="width:18px;height:18px;"></i>
              ${s.label}
            </button>
          `).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-email">${window.__session.email || ''}</div>
          <button class="btn btn-ghost btn-sm" style="width:100%;" onclick="logout()">
            <i data-lucide="log-out" style="width:14px;height:14px;"></i> Log Out
          </button>
        </div>
      </aside>

      <header class="dash-header">
        <div style="display:flex;align-items:center;gap:var(--space-3);">
          <button class="mobile-menu-btn" onclick="toggleSidebar()" aria-label="Menu">
            <i data-lucide="menu" style="width:20px;height:20px;"></i>
          </button>
          <h1>${sectionTitle}</h1>
        </div>
        <button class="theme-toggle-btn" onclick="toggleTheme();router();" aria-label="Toggle theme">
          ${themeIcon()}
        </button>
      </header>

      <main class="dash-main" id="dash-content">
        <div class="kpi-grid">
          ${[1,2,3,4].map(() => `<div class="kpi-card"><div class="skeleton" style="height:14px;width:80px;margin-bottom:var(--space-2);"></div><div class="skeleton" style="height:28px;width:60px;"></div></div>`).join('')}
        </div>
      </main>
    </div>
  `;

  // Load section content
  if (section === 'overview') loadOverview();
  else if (section === 'keys') loadKeys();
  else if (section === 'usage') loadUsage();
  else if (section === 'settings') loadSettings();
}

function toggleSidebar() {
  document.getElementById('dash-sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('open');
}

// Close sidebar on overlay click
document.addEventListener('click', (e) => {
  if (e.target.id === 'sidebar-overlay') {
    toggleSidebar();
  }
});

function logout() {
  window.__session = { token: null, email: null, userId: null };
  navigate('home');
}

// ── Dashboard Sections ───────────────────────────────────

async function loadOverview() {
  const content = document.getElementById('dash-content');
  try {
    const data = await api('/overview');
    content.innerHTML = `
      <div style="margin-bottom:var(--space-8);">
        <h2 style="font-family:var(--font-display);font-size:var(--text-xl);font-style:italic;margin-bottom:var(--space-2);">Welcome back</h2>
        <p style="color:var(--color-text-muted);font-size:var(--text-sm);">${window.__session.email}</p>
      </div>
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">API Keys</div>
          <div class="kpi-value">${data.total_keys}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Requests This Month</div>
          <div class="kpi-value">${data.month_requests}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Active Sessions</div>
          <div class="kpi-value">${data.active_sessions}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Total Scenes</div>
          <div class="kpi-value">${data.total_scenes}</div>
        </div>
      </div>
      <button class="btn btn-primary" onclick="navigate('dashboard/keys')">
        <i data-lucide="plus" style="width:16px;height:16px;"></i>
        Create New API Key
      </button>
    `;
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

async function loadKeys() {
  const content = document.getElementById('dash-content');
  try {
    const data = await api('/keys');
    if (data.keys.length === 0) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="key" style="width:48px;height:48px;"></i></div>
          <h3>No API keys yet</h3>
          <p>Create one to get started with preplai.</p>
          <button class="btn btn-primary" onclick="showCreateKeyModal()">
            <i data-lucide="plus" style="width:16px;height:16px;"></i>
            Create New API Key
          </button>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-6);flex-wrap:wrap;gap:var(--space-4);">
          <p style="color:var(--color-text-muted);font-size:var(--text-sm);">${data.keys.length} key${data.keys.length !== 1 ? 's' : ''}</p>
          <button class="btn btn-primary btn-sm" onclick="showCreateKeyModal()">
            <i data-lucide="plus" style="width:14px;height:14px;"></i>
            Create New Key
          </button>
        </div>
        <div class="card" style="overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Name</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${data.keys.map(k => `
                <tr>
                  <td><code style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted);">${k.key_display}</code></td>
                  <td>${k.name}</td>
                  <td><span class="badge badge-primary">${k.tier}</span></td>
                  <td><span class="badge ${k.status === 'active' ? 'badge-success' : 'badge-error'}">${k.status}</span></td>
                  <td style="font-size:var(--text-xs);color:var(--color-text-muted);">${formatDate(k.created_at)}</td>
                  <td>
                    ${k.status === 'active' ? `<button class="btn btn-ghost btn-sm" onclick="revokeKey(${k.id})">Revoke</button>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function showCreateKeyModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'key-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Create API Key</h2>
      <div id="modal-alert"></div>
      <div id="modal-form-area">
        <form id="create-key-form" class="auth-form">
          <div class="input-group">
            <label for="key-name">Key Name</label>
            <input type="text" id="key-name" class="input-field" placeholder="e.g. Production" value="Default">
          </div>
          <div style="display:flex;gap:var(--space-3);justify-content:flex-end;">
            <button type="button" class="btn btn-ghost" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn btn-primary" id="create-key-btn">Create Key</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.getElementById('create-key-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('key-name').value.trim() || 'Default';
    const btn = document.getElementById('create-key-btn');
    btn.disabled = true;
    btn.textContent = 'Creating...';
    try {
      const data = await api('/keys', { method: 'POST', body: { name } });
      document.getElementById('modal-form-area').innerHTML = `
        <p style="font-size:var(--text-sm);color:var(--color-text-muted);margin-bottom:var(--space-4);">Your API key has been created. Copy it now — you won't be able to see it again.</p>
        <div class="key-reveal" id="key-value">${data.key}</div>
        <div class="key-warning">Store this key securely. It cannot be retrieved after this dialog is closed.</div>
        <div style="display:flex;gap:var(--space-3);justify-content:flex-end;margin-top:var(--space-6);">
          <button class="copy-btn" onclick="copyKey('${data.key}')">
            <i data-lucide="copy" style="width:12px;height:12px;"></i> Copy
          </button>
          <button class="btn btn-primary btn-sm" onclick="closeModal();loadKeys();">Done</button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
    } catch (err) {
      document.getElementById('modal-alert').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      btn.disabled = false;
      btn.textContent = 'Create Key';
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

function closeModal() {
  const m = document.getElementById('key-modal');
  if (m) m.remove();
  const c = document.getElementById('confirm-modal');
  if (c) c.remove();
}

function copyKey(key) {
  navigator.clipboard.writeText(key).then(() => {
    const btn = event.target.closest('.copy-btn');
    if (btn) { btn.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i> Copied!'; }
    if (window.lucide) window.lucide.createIcons();
  }).catch(() => {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = key;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  });
}

async function revokeKey(keyId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'confirm-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Revoke API Key</h2>
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-6);">This action cannot be undone. Any applications using this key will stop working.</p>
      <div style="display:flex;gap:var(--space-3);justify-content:flex-end;">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-revoke-btn">Revoke Key</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('confirm-revoke-btn').addEventListener('click', async () => {
    try {
      await api(`/keys?id=${keyId}`, { method: 'DELETE' });
      closeModal();
      loadKeys();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function loadUsage() {
  const content = document.getElementById('dash-content');
  try {
    const data = await api('/usage');

    // Limits
    const sessionsUsed = data.active_keys;
    const scenesUsed = data.month_scenes;
    const limits = data.limits;

    content.innerHTML = `
      <div class="limits-grid">
        <div class="limit-card">
          <div class="limit-header">
            <span class="limit-label">Scenes This Month</span>
            <span class="limit-value">${scenesUsed} / ${limits.max_scenes_month}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.min(100, (scenesUsed / limits.max_scenes_month) * 100)}%"></div>
          </div>
        </div>
        <div class="limit-card">
          <div class="limit-header">
            <span class="limit-label">Sessions Limit</span>
            <span class="limit-value">${limits.max_sessions}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Math.min(100, (sessionsUsed / limits.max_sessions) * 100)}%"></div>
          </div>
        </div>
        <div class="limit-card">
          <div class="limit-header">
            <span class="limit-label">Scenes Per Session</span>
            <span class="limit-value">${limits.max_scenes_session}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:0%"></div>
          </div>
        </div>
      </div>

      <div class="chart-container">
        <h3>Daily Scene Usage (Last 30 Days)</h3>
        <canvas id="usage-chart" height="200"></canvas>
      </div>

      ${data.recent.length > 0 ? `
        <div class="card" style="overflow-x:auto;">
          <h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:var(--space-4);">Recent API Calls</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Endpoint</th>
                <th>Key</th>
              </tr>
            </thead>
            <tbody>
              ${data.recent.map(r => `
                <tr>
                  <td style="font-size:var(--text-xs);color:var(--color-text-muted);font-variant-numeric:tabular-nums;">${formatDate(r.created_at)}</td>
                  <td><code style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-primary);">${r.endpoint}</code></td>
                  <td><code style="font-family:var(--font-mono);font-size:var(--text-xs);color:var(--color-text-muted);">${r.key_display}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<p style="color:var(--color-text-muted);font-size:var(--text-sm);">No API calls recorded yet.</p>'}
    `;

    // Build chart
    buildUsageChart(data.daily);

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    content.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
  }
}

function buildUsageChart(daily) {
  const canvas = document.getElementById('usage-chart');
  if (!canvas || !window.Chart) return;

  // Fill missing days
  const days = [];
  const counts = [];
  const today = new Date();
  const dailyMap = {};
  daily.forEach(d => { dailyMap[d.day] = d.count; });

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(d.toLocaleDateString('en', { month: 'short', day: 'numeric' }));
    counts.push(dailyMap[key] || 0);
  }

  const isDark = currentTheme === 'dark';
  const gridColor = isDark ? 'rgba(42, 43, 54, 0.5)' : 'rgba(216, 214, 209, 0.5)';
  const textColor = isDark ? '#8a8b95' : '#6b6c78';

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Scenes',
        data: counts,
        backgroundColor: isDark ? 'rgba(201, 168, 76, 0.6)' : 'rgba(184, 149, 47, 0.6)',
        borderColor: isDark ? '#C9A84C' : '#B8952F',
        borderWidth: 1,
        borderRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a1b24' : '#F5F4F1',
          titleColor: isDark ? '#e8e6e3' : '#1a1b24',
          bodyColor: isDark ? '#8a8b95' : '#6b6c78',
          borderColor: isDark ? '#333444' : '#CBC9C3',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 }, maxTicksLimit: 10 },
          border: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 10 }, stepSize: 1 },
          border: { color: gridColor }
        }
      }
    }
  });
}

function loadSettings() {
  const content = document.getElementById('dash-content');
  content.innerHTML = `
    <div class="card" style="max-width:560px;margin-bottom:var(--space-8);">
      <h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:var(--space-6);">Account</h3>
      <div class="input-group" style="margin-bottom:var(--space-6);">
        <label>Email</label>
        <input type="email" class="input-field" value="${window.__session.email || ''}" disabled style="opacity:0.6;">
      </div>
      <h3 style="font-size:var(--text-base);font-weight:600;margin-bottom:var(--space-4);">Change Password</h3>
      <div id="pw-alert"></div>
      <form id="pw-form" class="auth-form">
        <div class="input-group">
          <label for="current-pw">Current Password</label>
          <input type="password" id="current-pw" class="input-field" required minlength="6">
        </div>
        <div class="input-group">
          <label for="new-pw">New Password</label>
          <input type="password" id="new-pw" class="input-field" required minlength="6" placeholder="Min. 6 characters">
        </div>
        <button type="submit" class="btn btn-primary btn-sm">Update Password</button>
      </form>
    </div>

    <div class="danger-zone" style="max-width:560px;">
      <h3>Danger Zone</h3>
      <p>Permanently delete your account and all data. This cannot be undone.</p>
      <button class="btn btn-danger btn-sm" onclick="deleteAccount()">Delete Account</button>
    </div>
  `;

  document.getElementById('pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = document.getElementById('current-pw').value;
    const newPw = document.getElementById('new-pw').value;
    const alert = document.getElementById('pw-alert');
    try {
      await api('/settings/password', { method: 'POST', body: { current_password: current, new_password: newPw } });
      alert.innerHTML = `<div class="alert alert-success">Password updated.</div>`;
      e.target.reset();
    } catch (err) {
      alert.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

function deleteAccount() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'confirm-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2 style="color:var(--color-error);">Delete Account</h2>
      <p style="color:var(--color-text-muted);font-size:var(--text-sm);margin-bottom:var(--space-6);">This will permanently delete your account, all API keys, and all usage data. This action cannot be undone.</p>
      <div style="display:flex;gap:var(--space-3);justify-content:flex-end;">
        <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
        <button class="btn btn-danger" id="confirm-delete-btn">Delete Forever</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
    try {
      await api('/account', { method: 'DELETE' });
      closeModal();
      window.__session = { token: null, email: null, userId: null };
      navigate('home');
    } catch (err) {
      alert(err.message);
    }
  });
}

// ── Utilities ────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}
