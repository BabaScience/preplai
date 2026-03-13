import { Link } from 'react-router-dom';
import { Cpu, Film, LinkIcon, Zap, Layers, Mic, Globe, MonitorPlay } from 'lucide-react';
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
              What did your agent<br />
              actually do?
            </h1>
            <p className="hero-cinema-sub hero-fade-in hero-fade-in-delay-2">
              Your AI agents execute complex workflows, make decisions, and call tools — but you never see what happened.
              Preplai turns every agent run into a cinematic visual report. Animated, narrated, shareable. No more sifting through logs.
            </p>
            <div className="hero-ctas hero-fade-in hero-fade-in-delay-3">
              <Link to="/signup" className="btn btn-primary btn-lg">Get started free</Link>
              <a href="#showcases" className="btn btn-ghost-light btn-lg">See it in action</a>
            </div>
          </div>
        </div>

        <div className="hero-fade-in hero-fade-in-delay-4">
          <HeroPlayer />
        </div>
      </section>

      {/* 2. Problem Statement — VoC language */}
      <section className="problem-section">
        <div className="section-block" style={{ borderTop: 'none' }}>
          <div className="section-label">The Problem</div>
          <h2>90% of AI agents never leave demo stage.</h2>
          <div className="problem-statements">
            <p>Your agent ran 47 steps overnight. You got a JSON log file and no explanation.</p>
            <p>Something went wrong in production. You spent 40% of your sprint investigating, not building.</p>
            <p>Your observability tools gave you traces and metrics. They still didn't answer the question: <em>what did the agent actually do?</em></p>
          </div>
          <p className="problem-kicker">
            The black box problem is real. Logs don't solve it. Dashboards don't solve it. Cinema does.
          </p>
        </div>
      </section>

      {/* 3. Live Demos */}
      <section id="showcases" className="section-block showcase-section" style={{ borderTop: 'none' }}>
        <div className="section-label">See It In Action</div>
        <h2>From explanation to presentation</h2>
        <p className="section-desc">Every demo below is a live Preplai presentation. The same engine your AI will use.</p>
        <ShowcaseCarousel items={SHOWCASE_ITEMS} />
      </section>

      {/* 4. Who It's For — Persona bento cards */}
      <section className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">Who It's For</div>
        <h2>Built for engineers who use AI every day</h2>
        <div className="bento-grid" style={{ marginTop: 'var(--space-10)' }}>
          <div className="bento-card">
            <div className="bento-icon"><Film size={20} /></div>
            <h3>Students and educators</h3>
            <p>
              Ask any LLM to explain quicksort, TCP handshakes, or B-trees — and watch the concepts animate.
              Arrays sort themselves, trees grow, data flows through pipelines. Learning becomes visual.
            </p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Cpu size={20} /></div>
            <h3>Programmers using AI coding tools</h3>
            <p>
              Cursor, Copilot, and Claude Code build complex systems in seconds. But what did they actually create?
              Preplai lets your AI show the architecture it built — servers, data flows, dependencies — animated and narrated.
            </p>
          </div>
          <div className="bento-card">
            <div className="bento-icon"><Layers size={20} /></div>
            <h3>Teams running AI agents</h3>
            <p>
              Your agent ran 47 steps, made 12 API calls, and hit a decision branch.
              Instead of parsing logs, get a visual report: every action, every decision, every data source. Shareable with your team in one click.
            </p>
          </div>
        </div>
      </section>

      {/* 5. How It Works — 3 steps + config */}
      <section id="setup" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">How It Works</div>
        <h2>Three steps. Two minutes.</h2>
        <div className="steps-grid">
          <div className="step-item">
            <div className="step-number">1</div>
            <h3>Connect your AI</h3>
            <p>Add one config block to Claude, Cursor, or any AI tool. No SDK, no code changes.</p>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <h3>Ask your AI to present</h3>
            <p>Tell your AI: &ldquo;Show me what you built.&rdquo; It creates animated presentations automatically.</p>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <h3>Share and review</h3>
            <p>Every presentation gets a shareable link. Send it to your team or review it later.</p>
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

      {/* 6. Capabilities strip — simplified language */}
      <section id="features" className="capabilities-strip">
        <div className="capabilities-inner">
          <div className="capability-item fade-in"><Globe size={18} /><span>Works with any AI</span></div>
          <div className="capability-item fade-in"><MonitorPlay size={18} /><span>Animated diagrams</span></div>
          <div className="capability-item fade-in"><Mic size={18} /><span>Voice narration</span></div>
          <div className="capability-item fade-in"><Layers size={18} /><span>85+ visual components</span></div>
          <div className="capability-item fade-in"><LinkIcon size={18} /><span>Shareable links</span></div>
          <div className="capability-item fade-in"><Zap size={18} /><span>2-minute setup</span></div>
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
            Stop sifting through logs.<br />
            Start seeing what your agent did.
          </h2>
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
            <p>See what your agent actually did.</p>
          </div>
          <div className="footer-links">
            <Link to="/docs">Docs</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/dashboard/overview">Dashboard</Link>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} preplai. All rights reserved.
        </div>
      </footer>
    </LandingLayout>
  );
}
