import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Link } from 'react-router-dom';
import DocsLayout from '../layouts/DocsLayout';
import { DOC_META, getDocSchema, getDocsIndexSchema } from '../docs/meta';
import 'highlight.js/styles/github-dark.css';

import quickStartMd from '../docs/quick-start.md?raw';
import claudeDesktopMd from '../docs/claude-desktop.md?raw';
import chatgptMd from '../docs/chatgpt.md?raw';
import mcpToolsMd from '../docs/mcp-tools.md?raw';
import visualscriptMd from '../docs/visualscript.md?raw';

const DOC_SLUGS = ['quick-start', 'claude-desktop', 'chatgpt', 'mcp-tools', 'visualscript'];
const DOC_CONTENT = {
  'quick-start': quickStartMd,
  'claude-desktop': claudeDesktopMd,
  chatgpt: chatgptMd,
  'mcp-tools': mcpToolsMd,
  visualscript: visualscriptMd,
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

function DocContent({ slug }) {
  const markdown = DOC_CONTENT[slug];
  const meta = DOC_META[slug];
  if (!markdown) return <p>Document not found.</p>;

  return (
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
          a: ({ href, children, ...props }) => {
            if (href?.startsWith('/docs/')) {
              return <Link to={href} {...props}>{children}</Link>;
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
          },
        }}
      >
        {markdown}
        </ReactMarkdown>
      </article>
    );
}

function DocPage() {
  const { slug } = useParams();
  if (!slug) return <Navigate to="/docs/quick-start" replace />;
  if (!DOC_SLUGS.includes(slug)) return <Navigate to="/docs/quick-start" replace />;

  return (
    <DocsLayout>
      <DocMeta slug={slug} />
      <DocContent slug={slug} />
    </DocsLayout>
  );
}

function DocsIndex() {
  return (
    <DocsLayout>
      <Navigate to="/docs/quick-start" replace />
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
