import SiteNav from '../components/SiteNav';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/docs', label: 'Docs' },
  { to: '/blog', label: 'Blog' },
];

export default function BlogLayout({ children }) {
  return (
    <div className="dashboard-layout blog-mode">
      <SiteNav links={NAV_LINKS} />
      <main className="blog-main">{children}</main>
    </div>
  );
}
