import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

export default function BlogLayout({ children }) {
  return (
    <div className="dashboard-layout blog-mode">
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
      <main className="blog-main">{children}</main>
    </div>
  );
}
