/**
 * Documentation metadata for SEO and AI discoverability.
 * Used for dynamic meta tags, JSON-LD, and structured content.
 */

const BASE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}${(window.location.pathname || '').replace(/\/$/, '')}`
  : 'https://preplai.com';

export const DOC_META = {
  'quick-start': {
    title: 'Quick Start — preplai Documentation',
    description: 'Get started with preplai in 3 steps: get an access token, connect Claude, ChatGPT, or any MCP client, and create your first cinema-quality presentation.',
    keywords: ['preplai', 'quick start', 'MCP', 'AI agents', 'Claude', 'ChatGPT', 'AI presentations', 'access token', 'setup'],
    schemaType: 'TechArticle',
  },
  'claude-desktop': {
    title: 'Claude Desktop & Web — preplai Documentation',
    description: 'Connect preplai to Claude Desktop and Claude Web (claude.ai) via hosted MCP. OAuth for claude.ai, access token for Claude Desktop.',
    keywords: ['preplai', 'Claude Desktop', 'Claude Web', 'MCP', 'claude_desktop_config', 'hosted', 'OAuth', 'claude.ai'],
    schemaType: 'TechArticle',
  },
  chatgpt: {
    title: 'ChatGPT Integration — preplai Documentation',
    description: 'Connect preplai to ChatGPT Web (chat.openai.com) and ChatGPT Desktop via ChatGPT Apps. Create cinema-quality presentations with MCP tools.',
    keywords: ['preplai', 'ChatGPT', 'ChatGPT Desktop', 'ChatGPT Web', 'MCP', 'chat.openai.com', 'ChatGPT Apps', 'Connectors'],
    schemaType: 'TechArticle',
  },
  'mcp-tools': {
    title: 'MCP Tools Reference — preplai API',
    description: 'Complete reference for preplai MCP tools. Any AI agent can call get_preferences, get_illustrations, create_session, add_scene, update_scene, add_narration, get_session_url, list_sessions, delete_session, remove_scene.',
    keywords: ['preplai', 'MCP tools', 'create_session', 'add_scene', 'API', 'Model Context Protocol', 'AI agents'],
    schemaType: 'APIReference',
  },
  visualscript: {
    title: 'VisualScript Schema — preplai Documentation',
    description: 'VisualScript schema for preplai scenes: entity types (Server, Database, BinaryTree, etc.), frame structure, design guidelines, and JSON examples.',
    keywords: ['preplai', 'VisualScript', 'schema', 'entity types', 'add_scene', 'frames', '1920x1080', 'SVG'],
    schemaType: 'TechArticle',
  },
};

export function getDocSchema(slug, meta) {
  const url = `${BASE_URL}#/docs/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': meta.schemaType === 'APIReference' ? 'TechArticle' : meta.schemaType,
    headline: meta.title,
    description: meta.description,
    url,
    keywords: meta.keywords.join(', '),
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

export function getDocsIndexSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'preplai Documentation',
    description: 'Documentation for preplai — the presentation API for any AI agent. Claude, ChatGPT, or any MCP client. Cinema-quality visual experiences.',
    url: `${BASE_URL}#/docs`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: Object.entries(DOC_META).map(([slug, meta], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: meta.title,
        url: `${BASE_URL}#/docs/${slug}`,
      })),
    },
  };
}
