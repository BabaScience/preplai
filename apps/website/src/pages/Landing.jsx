import { Link } from 'react-router-dom';
import { Cpu, Film, LinkIcon, Zap, Layers, Mic, Globe, MonitorPlay, Briefcase, Scale } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';
import HeroPlayer from '../components/HeroPlayer';
import ShowcaseCarousel from '../components/ShowcaseCarousel';
import { SHOWCASE_ITEMS } from '../components/showcase-scripts';

export default function Landing() {
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
              Don&rsquo;t read it.<br />
              Watch it.
            </h1>
            <p className="hero-cinema-sub hero-fade-in hero-fade-in-delay-2">
              Your AI gives you walls of text. PreplAI turns every answer into an animated, narrated visual you can watch in minutes and share with anyone. Works with Claude, ChatGPT, Cursor, and any MCP-compatible tool.
            </p>
            <div className="hero-ctas hero-fade-in hero-fade-in-delay-3">
              <Link to="/signup" className="btn btn-primary btn-lg">Get started free</Link>
              <a href="#showcases" className="btn btn-ghost-light btn-lg">See it in action</a>
            </div>
            <p className="hero-social-proof hero-fade-in hero-fade-in-delay-4">
              Works with any AI &middot; Voice narration &middot; Shareable links &middot; 2-minute setup
            </p>
          </div>
        </div>

        <div className="hero-fade-in hero-fade-in-delay-4">
          <HeroPlayer />
        </div>
      </section>

      {/* 2. Problem Statement */}
      <section className="problem-section">
        <div className="section-block" style={{ borderTop: 'none' }}>
          <div className="section-label">The Problem</div>
          <h2>AI is brilliant. Its output is unreadable.</h2>
          <div className="problem-statements">
            <p>You asked your AI a great question. It gave you 2,000 words of text. You skimmed the first paragraph. You missed the key insight. You forgot everything by tomorrow.</p>
            <p>You&rsquo;re not alone. <strong>65%</strong> of people are visual learners. We retain <strong>95%</strong> of a message from video — but only <strong>10%</strong> from text. Yet every AI chatbot in the world produces the same thing: text.</p>
          </div>
          <p className="problem-kicker">
            PreplAI closes the gap between what AI produces and what humans actually want to consume.
          </p>
        </div>
      </section>

      {/* 3. Live Demos */}
      <section id="showcases" className="section-block showcase-section" style={{ borderTop: 'none' }}>
        <div className="section-label">See It In Action</div>
        <h2>From explanation to presentation</h2>
        <p className="section-desc">Every demo below is a live PreplAI presentation. The same engine your AI will use.</p>
        <ShowcaseCarousel items={SHOWCASE_ITEMS} />
      </section>

      {/* 4. Who It's For — Persona bento cards */}
      <section className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">Who It&rsquo;s For</div>
        <h2>Built for professionals who use AI every day</h2>
        <div className="bento-grid" style={{ marginTop: 'var(--space-10)' }}>
          <div className="bento-card">
            <div className="bento-icon"><Cpu size={20} /></div>
            <h3>Engineers &amp; SRE Teams</h3>
            <p>
              Turn incident postmortems into animated walkthroughs. Visualize pull request changes before code review. See what your AI coding assistant actually built — architecture diagrams, data flows, dependencies — narrated and shareable.
            </p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Film size={20} /></div>
            <h3>Product Managers</h3>
            <p>
              You ask AI to explain how the recommendation engine works. You get 1,500 words. Now you need slides for the executive review. With PreplAI, ask your AI to explain it visually — and share the animated walkthrough directly. 30 seconds instead of 30 minutes.
            </p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Briefcase size={20} /></div>
            <h3>Consultants &amp; Strategists</h3>
            <p>
              Your AI researched the market, analyzed the data, and drafted recommendations. Now turn that analysis into a client-ready visual presentation — automatically.
            </p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Scale size={20} /></div>
            <h3>Financial Advisors &amp; Legal</h3>
            <p>
              Explain portfolio allocations, risk models, or contract structures to clients who don&rsquo;t speak your language. PreplAI turns complex AI analysis into visual walkthroughs your clients will actually understand.
            </p>
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
            <p>Add one config block to Claude, ChatGPT, Cursor, or any MCP-compatible AI tool. No SDK. No code changes. No setup headaches.</p>
          </div>
          <div className="step-item" data-step="2">
            <div className="step-number">2</div>
            <h3>Ask your AI to present</h3>
            <p>Tell your AI: &ldquo;Explain this visually&rdquo; or &ldquo;Create a presentation.&rdquo; It generates animated, narrated visual walkthroughs automatically.</p>
          </div>
          <div className="step-item" data-step="3">
            <div className="step-number">3</div>
            <h3>Watch and share</h3>
            <p>Every presentation gets a shareable link. Watch it yourself, send it to your team, embed it in a doc, or present it in a meeting. No downloads, no installs, no friction.</p>
          </div>
        </div>
        <div className="setup-block" style={{ marginTop: 'var(--space-10)' }}>
          <div className="code-block">
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
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary">Get started free</Link>
            <Link to="/docs" className="btn btn-ghost">Read the docs</Link>
          </div>
        </div>
      </section>

      {/* 6. Features grid */}
      <section id="features" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="bento-grid">
          <div className="bento-card">
            <div className="bento-icon"><Globe size={20} /></div>
            <h3>Works with any AI</h3>
            <p>Claude, ChatGPT, Cursor, Gemini — any MCP-compatible tool.</p>
          </div>
          <div className="bento-card bento-wide">
            <div className="bento-icon"><MonitorPlay size={20} /></div>
            <h3>Animated diagrams</h3>
            <p>Servers, databases, queues, pipelines, charts, and more — all animated.</p>
          </div>
          <div className="bento-card bento-wide">
            <div className="bento-icon"><Mic size={20} /></div>
            <h3>Voice narration</h3>
            <p>Every presentation is narrated automatically. Watch, don&rsquo;t read.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><LinkIcon size={20} /></div>
            <h3>Shareable links</h3>
            <p>Every presentation gets a unique URL. Share with anyone, anywhere.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Zap size={20} /></div>
            <h3>2-minute setup</h3>
            <p>One config block. No SDK, no code changes, no onboarding calls.</p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Layers size={20} /></div>
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
            Every AI answer, now in cinema. Set up in 2 minutes. Free to start.
          </p>
          <div className="hero-ctas">
            <Link to="/signup" className="btn btn-primary btn-lg">Get started free</Link>
            <Link to="/docs" className="btn btn-ghost-light btn-lg">View docs</Link>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo />
            <p>Don&rsquo;t read it. Watch it.</p>
          </div>
          <div className="footer-columns">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="https://docs.preplai.com" target="_blank" rel="noopener noreferrer">Docs</a>
              <Link to="/pricing">Pricing</Link>
              <Link to="/dashboard/overview">Dashboard</Link>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <Link to="/blog">Blog</Link>
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
