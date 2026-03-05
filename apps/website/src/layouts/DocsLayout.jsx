import { Link, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const DOC_SECTIONS = [
  { slug: 'quick-start', label: 'Quick Start' },
  { slug: 'claude-desktop', label: 'Claude Desktop & Web' },
  { slug: 'chatgpt', label: 'ChatGPT Desktop & Web' },
  { slug: 'mcp-tools', label: 'MCP Tools Reference' },
  { slug: 'visualscript', label: 'VisualScript Schema' },
];

export default function DocsLayout({ children }) {
  const location = useLocation();
  const currentSlug = location.pathname.replace('/docs/', '') || 'quick-start';

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
          <nav className="docs-nav" aria-label="Documentation">
            {DOC_SECTIONS.map(({ slug, label }) => (
              <Link
                key={slug}
                to={`/docs/${slug}`}
                className={`docs-nav-link ${currentSlug === slug ? 'active' : ''}`}
              >
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
