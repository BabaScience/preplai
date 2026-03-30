import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Rocket, BarChart3, Briefcase } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';
import ShowcaseCarousel from '../components/ShowcaseCarousel';
import PalettePicker from '../components/PalettePicker';
import { SHOWCASE_ITEMS, HERO_SHOWCASE_ITEMS, PERSONA_SHOWCASE_ITEMS } from '../components/showcase-scripts';

export default function Landing() {
  const [setupTab, setSetupTab] = useState('oauth');
  return (
    <LandingLayout>
      {/* 1. Hero — Agent-owner focused */}
      <section className="hero-cinema">
        <div className="hero-cinema-bg" aria-hidden="true">
          <div className="hero-dot-grid" />
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
          <div className="hero-glow hero-glow-3" />
        </div>
        <div className="hero-cinema-inner">
          <div className="hero-cinema-text">
            <h1 className="hero-fade-in hero-fade-in-delay-1">
              <span className="hero-line-setup">Don&rsquo;t read it,</span><br />
              <span className="hero-line-payoff">Just watch it.</span>
            </h1>
            <p className="hero-cinema-sub hero-fade-in hero-fade-in-delay-2">
              Your AI agents produce walls of text nobody reads. Preplai turns every answer into an animated, narrated visual anyone can watch and share.
            </p>
            <div className="hero-ctas hero-fade-in hero-fade-in-delay-3">
              <Link to="/signup" className="btn btn-primary btn-lg">Get started</Link>
              <a href="#showcases" className="btn btn-ghost-light btn-lg">See it in action</a>
            </div>
          </div>
        </div>

        <div className="hero-fade-in hero-fade-in-delay-4">
          <ShowcaseCarousel items={HERO_SHOWCASE_ITEMS} />
        </div>

        <div className="trust-section hero-fade-in hero-fade-in-delay-4">
          <p className="trust-subtitle">The Visual Layer For Your AI</p>
          <div className="trust-strip">
            <span className="trust-dot" style={{ background: '#D4A574' }} /> <span className="trust-name">Claude</span>
            <span className="trust-dot" style={{ background: '#6B9E78' }} /> <span className="trust-name">ChatGPT</span>
            <span className="trust-dot" style={{ background: '#7B8EC4' }} /> <span className="trust-name">Cursor</span>
            <span className="trust-dot" style={{ background: '#E8A87C' }} /> <span className="trust-name">Windsurf</span>
            <span className="trust-dot" style={{ background: '#9B8EC4' }} /> <span className="trust-name">Gemini</span>
            <span className="trust-dot" style={{ background: '#E57373' }} /> <span className="trust-name">OpenClaw</span>
            <span className="trust-dot" style={{ background: '#8A8B95' }} /> <span className="trust-name">Any AI Agent</span>
          </div>
        </div>
      </section>

      {/* 2. Problem Statement */}
      <section className="problem-section">
        <div className="section-block" style={{ borderTop: 'none' }}>
          <h2 className="problem-headline">AI agents are brilliant.<br />Their output is unreadable.</h2>
          <p className="problem-stat">Agents do 45 minutes of work, then dump a 2,000-word report you skim for <strong>5 seconds</strong>. We retain <strong>95%</strong> from visuals — but only <strong>10%</strong> from text.</p>
          <p className="problem-kicker">The bottleneck isn&rsquo;t intelligence. It&rsquo;s the last mile: output format. Preplai solves the last mile.</p>
        </div>
      </section>

      {/* 3. Live Demos */}
      <section id="showcases" className="section-block showcase-section" style={{ borderTop: 'none' }}>
        <div className="section-label">See It In Action</div>
        <h2>From AI output to visual report</h2>
        <p className="section-desc">Every demo below is a live Preplai presentation — the same engine your AI agents use to turn their output into something people actually watch.</p>
        <PalettePicker />
        <ShowcaseCarousel items={PERSONA_SHOWCASE_ITEMS} />
      </section>

      {/* 4. Who It's For — Persona bento cards */}
      <section className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">Who It&rsquo;s For</div>
        <h2>Built for teams that run on AI agents</h2>
        <div className="bento-grid" style={{ marginTop: 'var(--space-10)' }}>
          <div className="bento-card persona-card" style={{ borderTopColor: '#4ECDC4' }}>
            <div className="bento-icon"><Cpu size={20} /></div>
            <h3>Software Engineers &amp; Dev Teams</h3>
            <p>
              Your coding agent refactored the auth module. Your monitoring agent caught a 3 AM outage. Your CI agent ran 215 tests. Great — but their reports are walls of text and JSON logs. With Preplai, every agent output becomes a visual walkthrough the whole team can watch.
            </p>
            <div className="persona-tags">
              <span className="persona-tag">Incident reports</span>
              <span className="persona-tag">PR summaries</span>
              <span className="persona-tag">Architecture walkthroughs</span>
              <span className="persona-tag">Deploy reviews</span>
            </div>
          </div>
          <div className="bento-card persona-card" style={{ borderTopColor: '#C9A84C' }}>
            <div className="bento-icon"><Rocket size={20} /></div>
            <h3>Founders &amp; Business Owners</h3>
            <p>
              Your agents run overnight — monitoring competitors, analyzing customers, tracking revenue. You wake up to 3 text reports totaling 6,000 words. With Preplai, get a 90-second visual morning brief instead. Full picture, zero reading.
            </p>
            <div className="persona-tags">
              <span className="persona-tag">Morning briefs</span>
              <span className="persona-tag">Competitor research</span>
              <span className="persona-tag">Business intelligence</span>
              <span className="persona-tag">Investor updates</span>
            </div>
          </div>
          <div className="bento-card persona-card" style={{ borderTopColor: '#9B59B6' }}>
            <div className="bento-icon"><BarChart3 size={20} /></div>
            <h3>Product &amp; Growth Teams</h3>
            <p>
              Your analytics agent compiled the weekly growth digest — funnel metrics, A/B test results, feature adoption. But it&rsquo;s a 1,500-word text dump. With Preplai, the whole team watches it in 90 seconds. Experiments, trends, and next steps — animated and narrated.
            </p>
            <div className="persona-tags">
              <span className="persona-tag">Growth digests</span>
              <span className="persona-tag">Experiment results</span>
              <span className="persona-tag">User research</span>
              <span className="persona-tag">Funnel analysis</span>
            </div>
          </div>
          <div className="bento-card persona-card" style={{ borderTopColor: '#2ECC71' }}>
            <div className="bento-icon"><Briefcase size={20} /></div>
            <h3>Consultants &amp; Agencies</h3>
            <p>
              Your AI agent researched the market, sized the opportunity, and mapped competitors. Thorough work — but it&rsquo;s a draft, not a deliverable. With Preplai, turn agent output into client-ready visual presentations automatically. No more converting text into slides.
            </p>
            <div className="persona-tags">
              <span className="persona-tag">Client deliverables</span>
              <span className="persona-tag">Market analysis</span>
              <span className="persona-tag">Strategy presentations</span>
              <span className="persona-tag">Research reports</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works — 3 steps + config */}
      <section id="setup" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">How It Works</div>
        <h2>Three steps. Two minutes.</h2>
        <div className="steps-grid">
          <div className="step-item" data-step="1">
            <div className="step-number">1</div>
            <h3>Connect your AI</h3>
            <p>Add one config block or authorize through your browser — works with any MCP-compatible tool.</p>
          </div>
          <div className="step-item" data-step="2">
            <div className="step-number">2</div>
            <h3>Ask your AI to show it</h3>
            <p>Tell your AI: &ldquo;Show this visually using Preplai&rdquo; — or let your agents call Preplai automatically. Either way, animated narrated walkthroughs, not text walls.</p>
          </div>
          <div className="step-item" data-step="3">
            <div className="step-number">3</div>
            <h3>Watch and share</h3>
            <p>Every presentation gets a shareable link. Watch it yourself, send it to your team, embed it in a doc, or present it in a meeting.</p>
          </div>
        </div>
        <div className="setup-block" style={{ marginTop: 'var(--space-10)' }}>
          <div className="setup-tabs">
            <button className={`setup-tab ${setupTab === 'oauth' ? 'active' : ''}`} onClick={() => setSetupTab('oauth')}>
              OAuth
              <span className="setup-tab-hint">Web &amp; Mobile</span>
            </button>
            <button className={`setup-tab ${setupTab === 'token' ? 'active' : ''}`} onClick={() => setSetupTab('token')}>
              API Token
              <span className="setup-tab-hint">Desktop &amp; IDE</span>
            </button>
          </div>
          {setupTab === 'oauth' ? (
            <div className="code-block">
              <p className="setup-caption">Connect from Claude Web or ChatGPT in three clicks:</p>
              <div className="setup-oauth-steps">
                <div className="setup-oauth-step">
                  <span className="setup-oauth-num">1</span>
                  <span>Create an OAuth client at <strong>Dashboard → Connectors</strong></span>
                </div>
                <div className="setup-oauth-step">
                  <span className="setup-oauth-num">2</span>
                  <span>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></span>
                </div>
                <div className="setup-oauth-step">
                  <span className="setup-oauth-num">3</span>
                  <span>In your AI app: <strong>Settings → Connectors → Add</strong><br />URL: <code>https://player.preplai.com/mcp</code></span>
                </div>
              </div>
            </div>
          ) : (
            <div className="code-block">
              <p className="setup-caption">Paste into Claude Desktop, Cursor, or Windsurf config:</p>
              <pre>{`{
  `}<span className="ck">&quot;mcpServers&quot;</span>{`: {
    `}<span className="ck">&quot;preplai&quot;</span>{`: {
      `}<span className="ck">&quot;url&quot;</span>{`: `}<span className="cs">&quot;https://player.preplai.com/mcp&quot;</span>{`,
      `}<span className="ck">&quot;headers&quot;</span>{`: {
        `}<span className="ck">&quot;Authorization&quot;</span>{`: `}<span className="cs">&quot;Bearer plai_**************&quot;</span>{`,
        `}<span className="ck">&quot;Content-Type&quot;</span>{`: `}<span className="cs">&quot;application/json&quot;</span>{`
      }
    }
  }
}`}</pre>
            </div>
          )}
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary">Get started</Link>
            <Link to="/docs" className="btn btn-ghost">Read the docs</Link>
          </div>
        </div>
      </section>

      {/* 6. Features grid */}
      <section id="features" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="bento-grid">
          <div className="bento-card">
            <div className="bento-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="28" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
                <line x1="18" y1="20" x2="22" y2="20" stroke="currentColor" strokeWidth="1.5" className="feat-pulse-line" />
              </svg>
            </div>
            <h3>Works with any AI</h3>
            <p>Claude, ChatGPT, Cursor, Gemini — any MCP-compatible tool.</p>
          </div>
          <div className="bento-card bento-wide">
            <div className="bento-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="feat-draw-box1" />
                <rect x="16" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="feat-draw-box2" />
                <rect x="28" y="14" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" className="feat-draw-box3" />
                <line x1="12" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="1.5" className="feat-draw-arrow1" />
                <line x1="24" y1="18" x2="28" y2="18" stroke="currentColor" strokeWidth="1.5" className="feat-draw-arrow2" />
              </svg>
            </div>
            <h3>Animated diagrams</h3>
            <p>Servers, databases, queues, pipelines, charts, and more — all animated.</p>
          </div>
          <div className="bento-card bento-wide">
            <div className="bento-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="28" x2="8" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="feat-wave-bar1" />
                <line x1="14" y1="28" x2="14" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="feat-wave-bar2" />
                <line x1="20" y1="28" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="feat-wave-bar3" />
                <line x1="26" y1="28" x2="26" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="feat-wave-bar4" />
                <line x1="32" y1="28" x2="32" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="feat-wave-bar5" />
              </svg>
            </div>
            <h3>Voice narration</h3>
            <p>Every presentation is narrated automatically. Watch, don&rsquo;t read.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 15a5 5 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="feat-link-glow" />
                <path d="M24 25a5 5 0 0 1 0-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="feat-link-glow" />
                <line x1="15" y1="20" x2="25" y2="20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3>Shareable links</h3>
            <p>Every presentation gets a unique URL. Share with anyone, anywhere.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
                <circle cx="20" cy="20" r="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray="75.4" strokeDashoffset="75.4" className="feat-progress-ring" />
              </svg>
            </div>
            <h3>2-minute setup</h3>
            <p>One config block. No SDK, no code changes, no onboarding calls.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="10" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <line x1="6" y1="16" x2="34" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <line x1="6" y1="24" x2="34" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
                <polygon points="20,18 18,22 19.2,22 18.5,26 22,21 20.8,21 21.5,18" fill="currentColor" className="feat-star-twinkle" />
              </svg>
            </div>
            <h3>Cinema quality</h3>
            <p>Not static slides. Cinematic animations with depth-of-field focus, smooth transitions, and idle animations.</p>
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="final-cta">
        <div className="final-cta-bg" aria-hidden="true">
          <div className="hero-glow hero-glow-1" />
          <div className="hero-glow hero-glow-2" />
        </div>
        <div className="final-cta-inner">
          <h2>
            Stop reading.<br />
            Start watching.
          </h2>
          <p className="hero-cinema-sub" style={{ maxWidth: '540px', margin: '0 auto var(--space-8)' }}>
            Every AI agent gets a visual voice. Set up in 2 minutes. Free to start.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary btn-lg">Get started</Link>
            <Link to="/docs" className="btn btn-ghost-light btn-lg">View docs</Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo />
            <p>Don&rsquo;t read it, just watch it.</p>
          </div>
          <div className="footer-columns">
            <div className="footer-col">
              <h4>Product</h4>
              <Link to="/docs">Docs</Link>
              <Link to="/dashboard/overview">Dashboard</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/blog">Blog</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/terms">Terms</Link>
              <Link to="/privacy">Privacy</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} preplai. All rights reserved.
        </div>
      </footer>
    </LandingLayout>
  );
}
