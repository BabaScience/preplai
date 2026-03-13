import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';

/**
 * SiteNav — Shared responsive navigation bar.
 *
 * Desktop: full horizontal links + CTA buttons.
 * Mobile: logo + theme toggle + sign up + hamburger that opens a slide-down drawer.
 *
 * @param {Object} props
 * @param {Array} props.links - Nav links array [{href, to, label}]. `href` for anchor, `to` for router.
 */
export default function SiteNav({ links }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const defaultLinks = [
    { href: '#showcases', label: 'Demos' },
    { href: '#setup', label: 'Setup' },
    { to: '/docs', label: 'Docs' },
    { to: '/blog', label: 'Blog' },
  ];

  const navLinks = links || defaultLinks;

  return (
    <>
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <Logo />
        </Link>

        {/* Desktop links */}
        <ul className="nav-links" role="list">
          {navLinks.map((link, i) => (
            <li key={i} className="nav-link-desktop">
              {link.to ? (
                <Link to={link.to}>{link.label}</Link>
              ) : (
                <a href={link.href}>{link.label}</a>
              )}
            </li>
          ))}
          <li><ThemeToggle /></li>
          <li><Link to="/login" className="btn btn-ghost btn-sm nav-btn-login">Log in</Link></li>
          <li>
            <Link to="/signup" className="btn btn-primary btn-sm nav-btn-cta">
              <span className="nav-cta-full">Get started free</span>
              <span className="nav-cta-short">Sign up</span>
            </Link>
          </li>
          <li className="nav-burger-wrap">
            <button
              className="nav-burger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </li>
        </ul>
      </nav>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={`mobile-nav-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-links">
          {navLinks.map((link, i) => (
            link.to ? (
              <Link key={i} to={link.to} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ) : (
              <a key={i} href={link.href} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            )
          ))}
          <div className="mobile-nav-divider" />
          <Link to="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary mobile-nav-cta" onClick={() => setMenuOpen(false)}>
            Get started free
          </Link>
        </div>
      </div>
    </>
  );
}
