/**
 * Blog posts metadata and content.
 * Used for SEO (meta tags, JSON-LD) and rendering.
 */

import howAiAgentsCreatePresentations from './content/how-ai-agents-create-presentations.md?raw';
import mcpForPresentations from './content/mcp-for-presentations.md?raw';
import visualscriptExplained from './content/visualscript-explained.md?raw';

const BASE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}${(window.location.pathname || '').replace(/\/$/, '')}`
  : 'https://preplai.com';

export const BLOG_POSTS = [
  {
    slug: 'how-ai-agents-create-presentations',
    title: 'How AI Agents Create Presentations',
    description: 'Learn how AI agents like Claude and ChatGPT create cinema-quality presentations in real time. From user prompt to shareable URL in seconds.',
    date: '2026-03-05',
    keywords: ['AI agents', 'presentations', 'Claude', 'ChatGPT', 'MCP', 'preplai', 'cinema presentations'],
    content: howAiAgentsCreatePresentations,
  },
  {
    slug: 'mcp-for-presentations',
    title: 'MCP for Presentations: A Developer Guide',
    description: 'The Model Context Protocol (MCP) enables any AI agent to create presentations. Learn how MCP works and why it matters for visual content.',
    date: '2026-03-05',
    keywords: ['MCP', 'Model Context Protocol', 'AI agents', 'presentations', 'API', 'preplai'],
    content: mcpForPresentations,
  },
  {
    slug: 'visualscript-explained',
    title: 'VisualScript: The Schema for AI-Generated Scenes',
    description: 'VisualScript is the JSON schema that AI agents use to define cinema-quality scenes. Entity types, frames, and design guidelines.',
    date: '2026-03-05',
    keywords: ['VisualScript', 'schema', 'AI presentations', 'add_scene', 'entity types', 'preplai'],
    content: visualscriptExplained,
  },
];

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** ~200 wpm reading speed */
export function getReadTime(content) {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function getBlogPostSchema(post) {
  const url = `${BASE_URL}#/blog/${post.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url,
    datePublished: post.date,
    keywords: post.keywords.join(', '),
    publisher: {
      '@type': 'Organization',
      name: 'preplai',
      url: BASE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}
