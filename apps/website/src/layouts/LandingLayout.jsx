import SiteNav from '../components/SiteNav';

export default function LandingLayout({ children }) {
  return (
    <div className="dashboard-layout landing-mode">
      <SiteNav
        links={[
          { href: '#showcases', label: 'Demos' },
          { href: '#setup', label: 'Setup' },
          { to: '/docs', label: 'Docs' },
          { to: '/blog', label: 'Blog' },
        ]}
      />
      <main>{children}</main>
    </div>
  );
}
