import { Link } from 'react-router-dom';
import { Cpu, Zap, Film, LinkIcon } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <LandingLayout>
      {/* Hero */}
      <section className="hero-section">
        <h1>
          Cinema-quality<br />
          presentations.<br />
          <span className="gold">Built by AI agents.</span>
        </h1>
        <p className="hero-sub">
          preplai is the presentation engine that AI agents use to create live, animated,
          voice-synced visual experiences. Not slides. Cinema.
        </p>
        <div className="hero-ctas">
          <Link to="/signup" className="btn btn-primary btn-lg">Get Access Token</Link>
          <a
            href="https://docs.preplai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-lg"
          >
            View Docs
          </a>
        </div>
        <div className="hero-terminal fade-in">
          <div className="terminal-bar">
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-title">Claude Desktop</span>
          </div>
          <div className="terminal-body">
            <span className="prompt">&gt;</span>{' '}
            <span className="cmd">Create a presentation about our Q4 results</span>
            <br /><br />
            <span style={{ color: 'var(--color-text-faint)' }}>Using preplai MCP server...</span><br />
            <span style={{ color: 'var(--color-success)' }}>✓</span> Session created<br />
            <span style={{ color: 'var(--color-success)' }}>✓</span> 5 scenes built<br />
            <span style={{ color: 'var(--color-success)' }}>✓</span> Voice narration synced<br />
            <br />
            <span className="prompt">→</span>{' '}
            <span className="cmd" style={{ color: 'var(--color-primary)' }}>
              https://play.preplai.com/abc123
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-block">
        <div className="section-label">Features</div>
        <h2>Everything agents need</h2>
        <p className="section-desc">One API. Eight tools. Cinema-quality output.</p>
        <div className="features-grid">
          <div className="feature-card fade-in">
            <div className="feature-icon"><Cpu size={20} /></div>
            <h3>Agent-Native MCP API</h3>
            <p>Built for Claude, ChatGPT, and any MCP client. 8 tools, one access token. Native integration with the tools your agents already use.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon"><Zap size={20} /></div>
            <h3>Live &amp; Real-Time</h3>
            <p>SSE-powered player updates in real time as the agent builds. No waiting for exports. Watch your presentation come alive.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon"><Film size={20} /></div>
            <h3>Cinema Quality</h3>
            <p>Dark cinematic theme, smooth animations, Inter typography. Not PowerPoint. Cinema. Every frame designed to impress.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon"><LinkIcon size={20} /></div>
            <h3>Shareable Links</h3>
            <p>Every presentation gets a unique URL. Share instantly. No downloads needed. Works on any device with a browser.</p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">How It Works</div>
        <h2>Three steps to cinema</h2>
        <p className="section-desc">From access token to live presentation in minutes.</p>
        <div className="steps-grid">
          <div className="step-item fade-in">
            <h3>Get your access token</h3>
            <p>Sign up for free and generate your first access token in seconds. No credit card required.</p>
          </div>
          <div className="step-item fade-in">
            <h3>Add to Claude Desktop</h3>
            <p>Drop the MCP server config into your Claude Desktop settings. One JSON block, done.</p>
          </div>
          <div className="step-item fade-in">
            <h3>Ask your AI to present</h3>
            <p>Tell Claude to create a presentation. Watch it build scenes in real time. Share the link.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">Pricing</div>
        <h2>Start free, scale up</h2>
        <p className="section-desc">Generous free tier. No credit card required.</p>
        <div className="pricing-grid">
          <div className="pricing-card">
            <div className="tier-name">Free</div>
            <div className="price">$0 <span>/forever</span></div>
            <div className="price-note">For trying things out</div>
            <ul className="pricing-features" role="list">
              <li>5 sessions</li>
              <li>50 scenes per month</li>
              <li>10 scenes per session</li>
              <li>7-day link expiry</li>
            </ul>
            <Link to="/signup" className="btn btn-primary" style={{ width: '100%' }}>Get Started</Link>
          </div>
          <div className="pricing-card featured">
            <div className="tier-name">Pro</div>
            <div className="price">$19 <span>/month</span></div>
            <div className="price-note">For teams and power users</div>
            <ul className="pricing-features" role="list">
              <li>100 sessions per month</li>
              <li>2,000 scenes per month</li>
              <li>100 scenes per session</li>
              <li>90-day link expiry</li>
            </ul>
            <button className="btn btn-ghost" style={{ width: '100%' }} disabled>Coming Soon</button>
          </div>
          <div className="pricing-card">
            <div className="tier-name">Enterprise</div>
            <div className="price">Custom</div>
            <div className="price-note">For organizations</div>
            <ul className="pricing-features" role="list">
              <li>Unlimited sessions</li>
              <li>Unlimited scenes</li>
              <li>Custom domain</li>
              <li>Priority support</li>
              <li>SSO &amp; audit logs</li>
            </ul>
            <a
              href="mailto:hello@preplai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ width: '100%' }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section id="setup" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">Setup Guide</div>
        <h2>Add to Claude Desktop</h2>
        <p className="section-desc">Copy this into your Claude Desktop MCP configuration.</p>
        <div className="setup-block">
          <div className="code-block">
            <pre>{`{
  `}<span className="ck">&quot;mcpServers&quot;</span>{`: {
    `}<span className="ck">&quot;preplai&quot;</span>{`: {
      `}<span className="ck">&quot;command&quot;</span>{`: `}<span className="cs">&quot;npx&quot;</span>{`,
      `}<span className="ck">&quot;args&quot;</span>{`: [`}<span className="cs">&quot;-y&quot;</span>{`, `}<span className="cs">&quot;@preplai/mcp-server&quot;</span>{`],
      `}<span className="ck">&quot;env&quot;</span>{`: {
        `}<span className="ck">&quot;PREPLAI_API_KEY&quot;</span>{`: `}<span className="cs">&quot;plai_your_key_here&quot;</span>{`,
        `}<span className="ck">&quot;BASE_URL&quot;</span>{`: `}<span className="cs">&quot;https://api.preplai.com&quot;</span>{`
      }
    }
  }
}`}</pre>
          </div>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary">Get Your Access Token</Link>
            <a
              href="https://docs.preplai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Full Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo />
            <p>Cinema-quality presentations.<br />Built by AI agents.</p>
          </div>
          <div className="footer-links">
            <a href="https://docs.preplai.com" target="_blank" rel="noopener noreferrer">Docs</a>
            <a href="https://github.com/preplai" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="#pricing">Pricing</a>
            <Link to="/dashboard/overview">Dashboard</Link>
          </div>
        </div>
        <div className="footer-bottom">
          Built by BabaScience &middot; &copy; {new Date().getFullYear()} preplai. All rights reserved.
        </div>
      </footer>
    </LandingLayout>
  );
}
