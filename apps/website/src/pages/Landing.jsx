import { Link } from 'react-router-dom';
import { Cpu, Film, LinkIcon } from 'lucide-react';
import LandingLayout from '../layouts/LandingLayout';
import Logo from '../components/Logo';

export default function Landing() {
  return (
    <LandingLayout>
      {/* Hero */}
      <section className="hero-section">
        <div className="hero-inner">
          <div className="hero-text">
            <h1 className="hero-fade-in hero-fade-in-delay-1">
              Cinema-quality<br />
              presentations.<br />
              <span className="gold">Built for AI agents.</span>
            </h1>
            <p className="hero-sub hero-fade-in hero-fade-in-delay-2">
              The presentation API for AI agents. Claude, ChatGPT, or any MCP client — one access token,
              eight tools. Live, animated, voice-synced. Not slides. Cinema.
            </p>
            <div className="hero-ctas hero-fade-in hero-fade-in-delay-3">
              <Link to="/signup" className="btn btn-primary btn-lg">Get Access Token</Link>
              <Link to="/docs" className="btn btn-ghost btn-lg">
                View Docs
              </Link>
            </div>
          </div>
          <div className="hero-terminal hero-fade-in hero-fade-in-delay-4">
          <div className="terminal-bar">
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-dot" />
            <span className="terminal-title">Any AI agent</span>
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
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section-block">
        <div className="section-label">Features</div>
        <h2>Built for any AI agent</h2>
        <p className="section-desc">One MCP API. Claude, ChatGPT, or any agent — create cinema-quality presentations in seconds.</p>
        <div className="features-grid">
          <div className="feature-card fade-in">
            <div className="feature-icon"><Cpu size={20} /></div>
            <h3>MCP API</h3>
            <p>8 tools any AI agent can call. create_session, add_scene, get_session_url. Works with Claude, ChatGPT, and any MCP-compatible client.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon"><Film size={20} /></div>
            <h3>Cinema Quality</h3>
            <p>1920×1080 dark canvas, smooth animations, rich entity types (Server, Database, BinaryTree, etc.). Not slides. Cinema.</p>
          </div>
          <div className="feature-card fade-in">
            <div className="feature-icon"><LinkIcon size={20} /></div>
            <h3>Shareable URLs</h3>
            <p>Every presentation gets a unique player URL. Share instantly. No downloads. Works on any device.</p>
          </div>
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
