import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

export default function LandingLayout({ children }) {
  return (
    <div className="dashboard-layout landing-mode">
      <nav className="landing-nav">
        <Link to="/" className="nav-logo">
          <Logo />
        </Link>
        <ul className="nav-links" role="list">
          <li className="nav-link-desktop"><a href="#features">Features</a></li>
          <li className="nav-link-desktop"><a href="#pricing">Pricing</a></li>
          <li className="nav-link-desktop"><a href="#setup">Setup</a></li>
          <li><ThemeToggle /></li>
          <li><Link to="/login" className="btn btn-ghost btn-sm">Log in</Link></li>
          <li><Link to="/signup" className="btn btn-primary btn-sm">Get API Key</Link></li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  );
}
