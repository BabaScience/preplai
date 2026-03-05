import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ArrowRight } from 'lucide-react';
import BlogLayout from '../layouts/BlogLayout';
import { BLOG_POSTS, getPostBySlug, getBlogPostSchema, getReadTime } from '../blog/posts';
import 'highlight.js/styles/github-dark.css';

function BlogPostMeta({ post }) {
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — preplai Blog`;
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.name = 'description';
      document.head.appendChild(descEl);
    }
    descEl.content = post.description;

    let keywordsEl = document.querySelector('meta[name="keywords"]');
    if (!keywordsEl) {
      keywordsEl = document.createElement('meta');
      keywordsEl.name = 'keywords';
      document.head.appendChild(keywordsEl);
    }
    keywordsEl.content = post.keywords.join(', ');

    const schema = getBlogPostSchema(post);
    let scriptEl = document.getElementById('blog-json-ld');
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'blog-json-ld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema);

    return () => {
      document.title = 'preplai — Cinema-quality presentations. Built for AI agents.';
      if (scriptEl) scriptEl.remove();
    };
  }, [post]);

  return null;
}

/** Strip leading H1 from markdown if it matches post title (avoids duplicate title) */
function stripDuplicateTitle(content, title) {
  const match = content.match(/^#\s+(.+?)(?:\n|$)/);
  if (match && match[1].trim() === title) {
    return content.replace(/^#\s+.+?\n+/, '').trim();
  }
  return content;
}

function BlogPostContent({ post }) {
  const bodyContent = stripDuplicateTitle(post.content, post.title);

  return (
    <div
      className="blog-content"
      itemScope
      itemType="https://schema.org/BlogPosting"
    >
      <header className="blog-post-header">
        <div className="blog-post-meta">
          <time dateTime={post.date} className="blog-date">
            {new Date(post.date).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}
          </time>
          <span className="blog-post-dot" aria-hidden>·</span>
          <span className="blog-read-time">{getReadTime(post.content)} min read</span>
        </div>
        <h1 id="blog-title" className="blog-title">{post.title}</h1>
      </header>
      <div className="blog-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            a: ({ href, children, ...props }) => {
              if (href?.startsWith('/docs/') || href?.startsWith('/blog/')) {
                return <Link to={href} {...props}>{children}</Link>;
              }
              return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
            },
          }}
        >
          {bodyContent}
        </ReactMarkdown>
      </div>
      <footer className="blog-post-footer">
        <Link to="/blog" className="btn btn-ghost btn-sm">← Back to blog</Link>
        <Link to="/docs" className="btn btn-ghost btn-sm">Docs</Link>
      </footer>
    </div>
  );
}

function BlogPostPage() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <BlogLayout>
      <BlogPostMeta post={post} />
      <div className="blog-post-page">
        <nav className="blog-breadcrumb" aria-label="Breadcrumb">
          <Link to="/blog">Blog</Link>
          <span className="blog-breadcrumb-sep">/</span>
          <span aria-current="page">{post.title}</span>
        </nav>
        <article className="blog-article">
          <BlogPostContent post={post} />
        </article>
      </div>
    </BlogLayout>
  );
}

function BlogIndex() {
  useEffect(() => {
    document.title = 'Blog — preplai';
    let descEl = document.querySelector('meta[name="description"]');
    if (!descEl) {
      descEl = document.createElement('meta');
      descEl.name = 'description';
      document.head.appendChild(descEl);
    }
    descEl.content = 'Articles on AI presentations, MCP, VisualScript, and how AI agents create cinema-quality visual experiences.';
    return () => {
      document.title = 'preplai — Cinema-quality presentations. Built for AI agents.';
    };
  }, []);

  return (
    <BlogLayout>
      <div className="blog-index">
        <header className="blog-index-header">
          <span className="blog-index-label">Blog</span>
          <h1>Articles & guides</h1>
          <p className="blog-index-desc">
            AI presentations, MCP, and how agents create cinema-quality visual experiences.
          </p>
        </header>
        <div className="blog-grid">
          {BLOG_POSTS.map((post, i) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className={`blog-card blog-card-fade-in`}
              style={{ animationDelay: `${0.1 + i * 0.08}s` }}
            >
              <div className="blog-card-meta">
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })}
                </time>
                <span className="blog-card-dot" aria-hidden>·</span>
                <span>{getReadTime(post.content)} min read</span>
              </div>
              <h2 className="blog-card-title">{post.title}</h2>
              <p className="blog-card-desc">{post.description}</p>
              <span className="blog-card-cta">
                Read article <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </BlogLayout>
  );
}

export default function Blog() {
  return (
    <Routes>
      <Route index element={<BlogIndex />} />
      <Route path=":slug" element={<BlogPostPage />} />
    </Routes>
  );
}
