import { Link, useLocation } from 'react-router-dom';
import { Zap, MessageSquare, Bot, Wrench, FileCode } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const DOC_SECTIONS = [
  { slug: 'quick-start', label: 'Quick Start', icon: Zap },
  { slug: 'claude-desktop', label: 'Claude Desktop & Web', icon: MessageSquare },
  { slug: 'chatgpt', label: 'ChatGPT Desktop & Web', icon: Bot },
  { slug: 'mcp-tools', label: 'MCP Tools Reference', icon: Wrench },
  { slug: 'visualscript', label: 'VisualScript Schema', icon: FileCode },
];

export default function DocsLayout({ children }) {
  const location = useLocation();
  const currentSlug = location.pathname.replace('/docs/', '').replace(/\/$/, '') || 'quick-start';

  return (
    <div className="dashboard-layout docs-mode">
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <Logo />
        </Link>
        <ul className="nav-links" role="list">
          <li className="nav-link-desktop"><Link to={{ pathname: '/', hash: 'features' }}>Features</Link></li>
          <li className="nav-link-desktop"><Link to={{ pathname: '/', hash: 'setup' }}>Setup</Link></li>
          <li className="nav-link-desktop"><Link to="/docs">Docs</Link></li>
          <li className="nav-link-desktop"><Link to="/blog">Blog</Link></li>
          <li><ThemeToggle /></li>
          <li><Link to="/login" className="btn btn-ghost btn-sm">Log in</Link></li>
          <li><Link to="/signup" className="btn btn-primary btn-sm">Get Access Token</Link></li>
        </ul>
      </nav>
      <div className="docs-container">
        <aside className="docs-sidebar">
          <span className="docs-sidebar-label">Documentation</span>
          <nav className="docs-nav" aria-label="Documentation">
            {DOC_SECTIONS.map(({ slug, label, icon: Icon }) => (
              <Link
                key={slug}
                to={`/docs/${slug}`}
                className={`docs-nav-link ${currentSlug === slug ? 'active' : ''}`}
              >
                <Icon size={16} strokeWidth={2} className="docs-nav-icon" aria-hidden />
                {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="docs-main">{children}</main>
      </div>
    </div>
  );
}
