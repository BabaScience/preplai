import React, { useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ArrowRight, ArrowLeft, ChevronRight } from 'lucide-react';
import DocsLayout from '../layouts/DocsLayout';
import { DOC_META, getDocSchema } from '../docs/meta';
import 'highlight.js/styles/github-dark.css';

import quickStartMd from '../docs/quick-start.md?raw';
import connectClaudeMd from '../docs/connect-claude.md?raw';
import connectChatgptMd from '../docs/connect-chatgpt.md?raw';
import examplesMd from '../docs/examples.md?raw';
import tipsMd from '../docs/tips.md?raw';
import mcpToolsMd from '../docs/mcp-tools.md?raw';
import visualscriptMd from '../docs/visualscript.md?raw';

const DOC_SLUGS = [
  'quick-start',
  'connect-claude',
  'connect-chatgpt',
  'examples',
  'tips',
  'mcp-tools',
  'visualscript',
];
const DOC_CONTENT = {
  'quick-start': quickStartMd,
  'connect-claude': connectClaudeMd,
  'connect-chatgpt': connectChatgptMd,
  examples: examplesMd,
  tips: tipsMd,
  'mcp-tools': mcpToolsMd,
  visualscript: visualscriptMd,
};

/* Redirect old slugs to new ones */
const SLUG_REDIRECTS = {
  'claude-desktop': 'connect-claude',
  chatgpt: 'connect-chatgpt',
};

function DocMeta({ slug }) {
  const meta = DOC_META[slug];

  useEffect(() => {
    if (!meta) return;
    document.title = meta.title;
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.name = 'description';
      document.head.appendChild(descEl);
    }
    descEl.content = meta.description;

    let keywordsEl = document.querySelector('meta[name="keywords"]');
    if (!keywordsEl) {
      keywordsEl = document.createElement('meta');
      keywordsEl.name = 'keywords';
      document.head.appendChild(keywordsEl);
    }
    keywordsEl.content = meta.keywords.join(', ');

    const schema = getDocSchema(slug, meta);
    let scriptEl = document.getElementById('doc-json-ld');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'doc-json-ld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema);

    return () => {
      document.title = 'preplai — Cinema-quality presentations. Built for AI agents.';
      if (scriptEl) scriptEl.remove();
    };
  }, [slug, meta]);

  return null;
}

function slugify(text) {
  return String(text)
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase() || 'section';
}

function getTextFromChildren(children) {
  if (!children) return '';
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(getTextFromChildren).join('');
  if (children?.props?.children !== undefined) return getTextFromChildren(children.props.children);
  return '';
}

function extractHeadings(markdown) {
  const matches = markdown.matchAll(/^##\s+(.+)$/gm);
  return [...matches].map(([, text]) => ({ text: text.trim(), id: slugify(text) }));
}

function DocContent({ slug }) {
  const markdown = DOC_CONTENT[slug];
  const meta = DOC_META[slug];
  if (!markdown) return <p>Document not found.</p>;

  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const showToc = headings.length >= 2;

  return (
    <div className="docs-page-inner">
      <nav className="docs-breadcrumb" aria-label="Breadcrumb">
        <Link to="/docs">Docs</Link>
        <ChevronRight size={14} className="docs-breadcrumb-icon" aria-hidden />
        <span aria-current="page">{meta?.title?.split(' — ')[0] || slug}</span>
      </nav>
      <div className={`docs-article-wrap ${showToc ? 'has-toc' : ''}`}>
        <article
          className="docs-content"
          aria-labelledby={meta ? 'doc-title' : undefined}
          itemScope
          itemType="https://schema.org/TechArticle"
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: (props) => <h1 id="doc-title" {...props} />,
              h2: ({ children, ...props }) => {
                const text = getTextFromChildren(children);
                const id = slugify(text);
                return <h2 id={id} className="docs-h2" {...props}>{children}</h2>;
              },
              a: ({ href, children, ...props }) => {
                if (href?.startsWith('/docs/') || href?.startsWith('/blog/')) {
                  return <Link to={href} {...props}>{children}</Link>;
                }
                return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
        {showToc && (
          <aside className="docs-toc" aria-label="On this page">
            <span className="docs-toc-title">On this page</span>
            <nav className="docs-toc-nav">
              {headings.map(({ text, id }) => (
                <a key={id} href={`#${id}`} className="docs-toc-link">
                  {text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
    </div>
  );
}

function DocPage() {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/docs/quick-start" replace />;

  /* Handle old URLs */
  if (SLUG_REDIRECTS[slug]) return <Navigate to={`/docs/${SLUG_REDIRECTS[slug]}`} replace />;

  if (!DOC_SLUGS.includes(slug)) return <Navigate to="/docs/quick-start" replace />;

  const idx = DOC_SLUGS.indexOf(slug);
  const prevSlug = idx > 0 ? DOC_SLUGS[idx - 1] : null;
  const nextSlug = idx < DOC_SLUGS.length - 1 ? DOC_SLUGS[idx + 1] : null;
  const prevLabel = prevSlug ? DOC_META[prevSlug]?.title?.split(' — ')[0] : null;
  const nextLabel = nextSlug ? DOC_META[nextSlug]?.title?.split(' — ')[0] : null;

  return (
    <DocsLayout>
      <DocMeta slug={slug} />
      <DocContent slug={slug} />
      <nav className="docs-pagination" aria-label="Documentation navigation">
        {prevSlug ? (
          <Link to={`/docs/${prevSlug}`} className="docs-pagination-link docs-pagination-prev">
            <ArrowLeft size={16} aria-hidden />
            <span className="docs-pagination-label">Previous</span>
            <span className="docs-pagination-page">{prevLabel}</span>
          </Link>
        ) : <span />}
        {nextSlug ? (
          <Link to={`/docs/${nextSlug}`} className="docs-pagination-link docs-pagination-next">
            <span className="docs-pagination-label">Next</span>
            <span className="docs-pagination-page">{nextLabel}</span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        ) : <span />}
      </nav>
    </DocsLayout>
  );
}

function DocsIndex() {
  useEffect(() => {
    document.title = 'Documentation — preplai';
    return () => { document.title = 'preplai — Cinema-quality presentations. Built for AI agents.'; };
  }, []);

  const getStarted = [
    { slug: 'quick-start', title: 'Quick Start', desc: 'Your first presentation in 2 minutes.' },
    { slug: 'connect-claude', title: 'Connect Claude', desc: 'Set up Claude Desktop or claude.ai.' },
    { slug: 'connect-chatgpt', title: 'Connect ChatGPT', desc: 'Set up ChatGPT Web, Desktop, or mobile.' },
    { slug: 'examples', title: 'Examples', desc: 'Prompts you can copy and paste right now.' },
    { slug: 'tips', title: 'Tips & Tricks', desc: 'Themes, palettes, and better prompts.' },
  ];

  const advanced = [
    { slug: 'mcp-tools', title: 'MCP Tools Reference', desc: 'Complete API reference for all 10 tools.' },
    { slug: 'visualscript', title: 'VisualScript Schema', desc: 'Entity types, frames, and JSON format.' },
  ];

  return (
    <DocsLayout>
      <div className="docs-index">
        <header className="docs-index-header">
          <span className="docs-index-label">Documentation</span>
          <h1>Get started</h1>
          <p className="docs-index-desc">
            Connect any AI to preplai and create animated presentations. No design skills needed.
          </p>
        </header>
        <div className="docs-grid">
          {getStarted.map(({ slug, title, desc }) => (
            <Link key={slug} to={`/docs/${slug}`} className="docs-card">
              <h2 className="docs-card-title">{title}</h2>
              <p className="docs-card-desc">{desc}</p>
              <span className="docs-card-cta">
                Read guide <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            </Link>
          ))}
        </div>

        <header className="docs-index-header docs-index-header-section">
          <h2>For developers</h2>
          <p className="docs-index-desc">
            Building an integration? These docs cover the full API.
          </p>
        </header>
        <div className="docs-grid">
          {advanced.map(({ slug, title, desc }) => (
            <Link key={slug} to={`/docs/${slug}`} className="docs-card">
              <h2 className="docs-card-title">{title}</h2>
              <p className="docs-card-desc">{desc}</p>
              <span className="docs-card-cta">
                Read reference <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </DocsLayout>
  );
}

export default function Docs() {
  return (
    <Routes>
      <Route index element={<DocsIndex />} />
      <Route path=":slug" element={<DocPage />} />
    </Routes>
  );
}
