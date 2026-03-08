import { Link } from 'react-router-dom';
import { Cpu, Film, LinkIcon, Zap, Layers, Mic } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';
import HeroPlayer from '../components/HeroPlayer';
import ShowcasePlayer from '../components/ShowcasePlayer';
import { CS_SCRIPT, ARCH_SCRIPT, AGENT_SCRIPT } from '../components/showcase-scripts';

export default function Landing() {
  return (
    <LandingLayout>
      {/* Hero — Dark cinematic section */}
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
              Cinema-quality<br />
              presentations.<br />
              <span className="hero-accent">Built for AI agents.</span>
            </h1>
            <p className="hero-cinema-sub hero-fade-in hero-fade-in-delay-2">
              The presentation API for AI agents. Claude, ChatGPT, or any MCP client — one access token,
              ten tools. Live, animated, voice-synced. Not slides. Cinema.
            </p>
            <div className="hero-ctas hero-fade-in hero-fade-in-delay-3">
              <Link to="/signup" className="btn btn-primary btn-lg">Get Access Token</Link>
              <Link to="/docs" className="btn btn-ghost-light btn-lg">View Docs</Link>
            </div>
          </div>
        </div>

        {/* Live player — auto-playing demo (P3.1) */}
        <div className="hero-fade-in hero-fade-in-delay-4">
          <HeroPlayer />
        </div>
      </section>

      {/* Use-case showcases — three live player embeds (P3.2) */}
      <section id="showcases" className="section-block showcase-section">
        <div className="section-label">Use Cases</div>
        <h2>See it in action</h2>
        <p className="section-desc">Every demo below is a live Preplai presentation — the same engine your AI agent will use.</p>
        <div className="showcase-grid">
          <ShowcasePlayer
            script={CS_SCRIPT}
            label="Computer Science"
            description="Data structures, algorithms, and complexity — explained visually with real-time animations."
          />
          <ShowcasePlayer
            script={ARCH_SCRIPT}
            label="System Architecture"
            description="Microservices, event-driven patterns, and infrastructure — architecture that builds itself."
          />
          <ShowcasePlayer
            script={AGENT_SCRIPT}
            label="Agent Reasoning"
            description="Watch AI agents think: reasoning pipelines, confidence metrics, and verified outputs."
          />
        </div>
      </section>

      {/* Capabilities strip — minimal, icon-driven (P3.3) */}
      <section id="features" className="capabilities-strip">
        <div className="capabilities-inner">
          <div className="capability-item fade-in"><Cpu size={18} /><span>MCP API</span></div>
          <div className="capability-item fade-in"><Film size={18} /><span>Cinema Quality</span></div>
          <div className="capability-item fade-in"><Mic size={18} /><span>Voice Narration</span></div>
          <div className="capability-item fade-in"><Layers size={18} /><span>85+ Entity Types</span></div>
          <div className="capability-item fade-in"><LinkIcon size={18} /><span>Shareable URLs</span></div>
          <div className="capability-item fade-in"><Zap size={18} /><span>Instant Setup</span></div>
        </div>
      </section>

      {/* Setup */}
      <section id="setup" className="section-block" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div className="section-label">Setup</div>
        <h2>Connect your AI agent</h2>
        <p className="section-desc">Claude Desktop: copy the config below. Claude Web, ChatGPT, or other MCP clients: see <Link to="/docs">Docs</Link> for setup.</p>
        <div className="setup-block">
          <div className="code-block">
            <pre>{`{
  `}<span className="ck">&quot;mcpServers&quot;</span>{`: {
    `}<span className="ck">&quot;preplai&quot;</span>{`: {
      `}<span className="ck">&quot;command&quot;</span>{`: `}<span className="cs">&quot;npx&quot;</span>{`,
      `}<span className="ck">&quot;args&quot;</span>{`: [`}<span className="cs">&quot;-y&quot;</span>{`, `}<span className="cs">&quot;@pyroprompts/mcp-stdio-to-streamable-http-adapter&quot;</span>{`],
      `}<span className="ck">&quot;env&quot;</span>{`: {
        `}<span className="ck">&quot;URI&quot;</span>{`: `}<span className="cs">&quot;https://player.preplai.com/mcp&quot;</span>{`,
        `}<span className="ck">&quot;BEARER_TOKEN&quot;</span>{`: `}<span className="cs">&quot;your-access-token&quot;</span>{`
      }
    }
  }
}`}</pre>
          </div>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary">Get Access Token</Link>
            <Link to="/docs" className="btn btn-ghost">Docs</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Logo />
            <p>Cinema-quality presentations.<br />Built for AI agents.</p>
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
