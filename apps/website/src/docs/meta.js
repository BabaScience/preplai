/**
 * Documentation metadata for SEO and AI discoverability.
 * Used for dynamic meta tags, JSON-LD, and structured content.
 */

const BASE_URL = typeof window !== 'undefined'
  ? `${window.location.origin}${(window.location.pathname || '').replace(/\/$/, '')}`
  : 'https://preplai.com';

export const DOC_META = {
  'quick-start': {
    title: 'Quick Start — preplai',
    description: 'Create your first animated presentation in 2 minutes. Connect your AI agent (Claude, ChatGPT, or others) to preplai and start making cinema-quality visuals.',
    keywords: ['preplai', 'quick start', 'getting started', 'AI presentations', 'Claude', 'ChatGPT', 'setup'],
    schemaType: 'TechArticle',
    section: 'get-started',
  },
  'connect-claude': {
    title: 'Connect Claude — preplai',
    description: 'Step-by-step guide to connect preplai to Claude Desktop and Claude Web (claude.ai). Copy-paste config, 1 minute setup.',
    keywords: ['preplai', 'Claude Desktop', 'Claude Web', 'claude.ai', 'setup', 'config', 'MCP'],
    schemaType: 'TechArticle',
    section: 'get-started',
  },
  'connect-chatgpt': {
    title: 'Connect ChatGPT — preplai',
    description: 'Step-by-step guide to connect preplai to ChatGPT Web, Desktop, and mobile. Create a connector in 2 minutes.',
    keywords: ['preplai', 'ChatGPT', 'ChatGPT Desktop', 'ChatGPT Web', 'setup', 'connector'],
    schemaType: 'TechArticle',
    section: 'get-started',
  },
  examples: {
    title: 'Examples — preplai',
    description: 'Example prompts for preplai presentations: CS concepts, software architecture, DevOps, data structures, and reports. Copy and paste to try.',
    keywords: ['preplai', 'examples', 'prompts', 'binary search', 'microservices', 'CI/CD', 'presentations'],
    schemaType: 'TechArticle',
    section: 'get-started',
  },
  tips: {
    title: 'Tips & Tricks — preplai',
    description: 'Get better presentations with themes, color palettes, and prompt writing tips. Cinema vs minimal, prompt strategies, sharing and limits.',
    keywords: ['preplai', 'tips', 'themes', 'palettes', 'prompts', 'cinema', 'minimal'],
    schemaType: 'TechArticle',
    section: 'get-started',
  },
  'mcp-tools': {
    title: 'MCP Tools Reference — preplai API',
    description: 'Complete reference for preplai MCP tools: create_session, add_scene, update_scene, add_narration, get_session_url, list_sessions, delete_session, remove_scene.',
    keywords: ['preplai', 'MCP tools', 'create_session', 'add_scene', 'API', 'Model Context Protocol', 'AI agents'],
    schemaType: 'APIReference',
    section: 'advanced',
  },
  visualscript: {
    title: 'VisualScript Schema — preplai API',
    description: 'VisualScript JSON schema for preplai scenes: entity types (Server, Database, BinaryTree, etc.), frame structure, design guidelines, and examples.',
    keywords: ['preplai', 'VisualScript', 'schema', 'entity types', 'add_scene', 'frames', '1920x1080', 'SVG'],
    schemaType: 'APIReference',
    section: 'advanced',
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
