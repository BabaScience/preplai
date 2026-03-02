import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Key, BarChart3, Film, Settings, LogOut, Menu } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: '/dashboard/overview' },
  { id: 'keys', label: 'API Keys', icon: Key, path: '/dashboard/keys' },
  { id: 'sessions', label: 'Sessions', icon: Film, path: '/dashboard/sessions' },
  { id: 'usage', label: 'Usage', icon: BarChart3, path: '/dashboard/usage' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/dashboard/settings' },
];

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { email, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} id="dash-sidebar">
        <div className="sidebar-logo">
          <Link to="/" style={{ textDecoration: 'none' }} onClick={closeSidebar}>
            <Logo />
          </Link>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`sidebar-nav-item${isActive ? ' active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-email">{email}</div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={14} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Header */}
      <header className="dash-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Menu"
          >
            <Menu size={20} />
          </button>
          <h1>{title}</h1>
        </div>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="dash-main">
        {children}
      </main>
    </div>
  );
}
