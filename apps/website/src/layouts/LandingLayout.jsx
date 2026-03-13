import SiteNav from '../components/SiteNav';

export default function LandingLayout({ children }) {
  return (
    <div className="dashboard-layout landing-mode">
      <SiteNav
        links={[
          { href: '#features', label: 'Features' },
          { href: '#setup', label: 'Setup' },
          { to: '/docs', label: 'Docs' },
          { to: '/blog', label: 'Blog' },
        ]}
      />
      <main>{children}</main>
    </div>
  );
}
