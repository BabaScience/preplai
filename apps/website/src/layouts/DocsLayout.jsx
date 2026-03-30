import { Link, useLocation } from 'react-router-dom';
import { Zap, MessageSquare, Bot, Lightbulb, BookOpen, Wrench, Code2 } from 'lucide-react';
import SiteNav from '../components/SiteNav';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/docs', label: 'Docs' },
  { to: '/blog', label: 'Blog' },
];

const GET_STARTED = [
  { slug: 'quick-start', label: 'Quick Start', icon: Zap },
  { slug: 'connect-claude', label: 'Connect Claude', icon: MessageSquare },
  { slug: 'connect-chatgpt', label: 'Connect ChatGPT', icon: Bot },
  { slug: 'examples', label: 'Examples', icon: BookOpen },
  { slug: 'tips', label: 'Tips & Tricks', icon: Lightbulb },
  { slug: 'mcp-tools', label: 'MCP Tools Reference', icon: Wrench },
  { slug: 'visualscript', label: 'VisualScript Schema', icon: Code2 },
];

export default function DocsLayout({ children }) {
  const location = useLocation();
  const currentSlug = location.pathname.replace('/docs/', '').replace(/\/$/, '') || 'quick-start';

  return (
    <div className="dashboard-layout docs-mode">
      <SiteNav links={NAV_LINKS} />
      <div className="docs-container">
        <aside className="docs-sidebar">
          <span className="docs-sidebar-label">Get Started</span>
          <nav className="docs-nav" aria-label="Get started documentation">
            {GET_STARTED.map(({ slug, label, icon: Icon }) => (
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
