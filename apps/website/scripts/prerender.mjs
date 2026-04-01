#!/usr/bin/env node
/**
 * prerender.mjs — Static HTML generator for preplai.com
 *
 * Run after `vite build`. For each public route, creates a separate
 * dist/<route>/index.html with unique <head> tags (title, meta description,
 * canonical URL, OG tags, JSON-LD). nginx serves these files directly,
 * giving crawlers unique HTML per page while users still get the full SPA.
 *
 * Usage: node scripts/prerender.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '../dist');

// ---------------------------------------------------------------------------
// Route metadata
// ---------------------------------------------------------------------------

const BASE_URL = 'https://preplai.com';

/**
 * Build JSON-LD for a SoftwareApplication page (used on homepage).
 */
function homepageSchema() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Preplai',
    url: BASE_URL,
    description:
      'The MCP-native visual output layer for AI agents. Turn any AI chatbot answer into an animated, narrated visual presentation. Works with Claude, ChatGPT, Cursor, and any MCP-compatible tool. Free to start.',
    applicationCategory: 'DeveloperApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'MCP-native visual output for AI agents',
      'Works with Claude, ChatGPT, Cursor, and any MCP-compatible AI',
      'Animated visual components',
      'Voice narration',
      'Shareable presentation links',
      '2-minute setup',
      'Cinema-quality animations with depth-of-field focus',
    ],
  });
}

/**
 * Build JSON-LD for a documentation article.
 */
function techArticleSchema({ title, description, url, keywords }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description,
    url,
    keywords,
    publisher: {
      '@type': 'Organization',
      name: 'preplai',
      url: BASE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}

/**
 * Build JSON-LD for a blog post.
 */
function blogPostSchema({ title, description, url, date, keywords }) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    url,
    datePublished: date,
    keywords,
    publisher: {
      '@type': 'Organization',
      name: 'preplai',
      url: BASE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}

/**
 * All public routes to pre-render with their head metadata.
 * path: '' means the root index.html (already correct from Vite build).
 * outputDir: where to write the route's index.html.
 */
const ROUTES = [
  // -------------------------------------------------------------------------
  // Homepage — already handled by Vite's index.html, but we still regenerate
  // it to ensure consistency with any future changes.
  // -------------------------------------------------------------------------
  {
    path: '/',
    outputDir: '',
    title: 'Preplai — MCP Visual Output for AI Agents | Animated AI Presentations',
    description:
      'Turn any AI chatbot answer into an animated, narrated visual presentation. Preplai is the MCP-native visual output layer for AI agents. Works with Claude, ChatGPT, Cursor. Free to start.',
    keywords:
      'Preplai, MCP, AI presentations, visual output for AI agents, Model Context Protocol, animated presentations, Claude, ChatGPT, Cursor, voice narration, MCP server',
    ogTitle: 'Preplai — MCP Visual Output for AI Agents',
    ogDescription:
      'Turn any AI answer into an animated, narrated visual presentation. The MCP-native visual output layer for AI agents.',
    twitterTitle: 'Preplai — MCP Visual Output for AI Agents',
    twitterDescription:
      'Turn any AI answer into animated, narrated visuals. The MCP-native visual output layer. Free to start.',
    schema: homepageSchema(),
  },

  // -------------------------------------------------------------------------
  // Docs index
  // -------------------------------------------------------------------------
  {
    path: '/docs',
    outputDir: 'docs',
    title: 'Documentation — preplai',
    description:
      'Documentation for preplai — the presentation API for any AI agent. Claude, ChatGPT, or any MCP client. Cinema-quality visual experiences.',
    keywords: 'preplai, documentation, MCP, AI presentations, getting started, API reference',
    ogTitle: 'preplai Documentation',
    ogDescription:
      'Documentation for preplai — the presentation API for any AI agent.',
    twitterTitle: 'preplai Documentation',
    twitterDescription: 'The presentation API for any AI agent. Docs and guides.',
    schema: techArticleSchema({
      title: 'preplai Documentation',
      description:
        'Documentation for preplai — the presentation API for any AI agent. Claude, ChatGPT, or any MCP client.',
      url: `${BASE_URL}/docs`,
      keywords: 'preplai, documentation, MCP, AI presentations',
    }),
  },

  // -------------------------------------------------------------------------
  // Doc pages
  // -------------------------------------------------------------------------
  {
    path: '/docs/quick-start',
    outputDir: 'docs/quick-start',
    title: 'Quick Start — preplai',
    description:
      'Create your first animated presentation in 2 minutes. Connect your AI agent (Claude, ChatGPT, or others) to preplai and start making cinema-quality visuals.',
    keywords: 'preplai, quick start, getting started, AI presentations, Claude, ChatGPT, setup',
    ogTitle: 'Quick Start — preplai',
    ogDescription: 'Create your first animated presentation in 2 minutes.',
    twitterTitle: 'Quick Start — preplai',
    twitterDescription: 'Create your first animated presentation in 2 minutes.',
    schema: techArticleSchema({
      title: 'Quick Start — preplai',
      description:
        'Create your first animated presentation in 2 minutes. Connect your AI agent (Claude, ChatGPT, or others) to preplai.',
      url: `${BASE_URL}/docs/quick-start`,
      keywords: 'preplai, quick start, AI presentations, Claude, ChatGPT, setup',
    }),
  },
  {
    path: '/docs/connect-claude',
    outputDir: 'docs/connect-claude',
    title: 'Connect Claude — preplai',
    description:
      'Step-by-step guide to connect preplai to Claude Desktop and Claude Web (claude.ai). Copy-paste config, 1 minute setup.',
    keywords: 'preplai, Claude Desktop, Claude Web, claude.ai, setup, config, MCP',
    ogTitle: 'Connect Claude to preplai',
    ogDescription: 'Step-by-step guide to connect preplai to Claude Desktop and Claude Web.',
    twitterTitle: 'Connect Claude to preplai',
    twitterDescription: 'Connect Claude Desktop or Claude Web to preplai in 1 minute.',
    schema: techArticleSchema({
      title: 'Connect Claude — preplai',
      description:
        'Step-by-step guide to connect preplai to Claude Desktop and Claude Web (claude.ai). Copy-paste config, 1 minute setup.',
      url: `${BASE_URL}/docs/connect-claude`,
      keywords: 'preplai, Claude Desktop, Claude Web, claude.ai, MCP',
    }),
  },
  {
    path: '/docs/connect-chatgpt',
    outputDir: 'docs/connect-chatgpt',
    title: 'Connect ChatGPT — preplai',
    description:
      'Step-by-step guide to connect preplai to ChatGPT Web, Desktop, and mobile. Create a connector in 2 minutes.',
    keywords: 'preplai, ChatGPT, ChatGPT Desktop, ChatGPT Web, setup, connector',
    ogTitle: 'Connect ChatGPT to preplai',
    ogDescription: 'Connect preplai to ChatGPT Web, Desktop, and mobile in 2 minutes.',
    twitterTitle: 'Connect ChatGPT to preplai',
    twitterDescription: 'Connect ChatGPT to preplai and start making animated visuals.',
    schema: techArticleSchema({
      title: 'Connect ChatGPT — preplai',
      description:
        'Step-by-step guide to connect preplai to ChatGPT Web, Desktop, and mobile.',
      url: `${BASE_URL}/docs/connect-chatgpt`,
      keywords: 'preplai, ChatGPT, setup, connector',
    }),
  },
  {
    path: '/docs/examples',
    outputDir: 'docs/examples',
    title: 'Examples — preplai',
    description:
      'Example prompts for preplai presentations: incident postmortems, product walkthroughs, market analysis, portfolio reviews, and more. Copy and paste to try.',
    keywords:
      'preplai, examples, prompts, incident postmortem, product walkthrough, market analysis, portfolio review, presentations',
    ogTitle: 'Examples — preplai',
    ogDescription: 'Example prompts for incident postmortems, product walkthroughs, and more.',
    twitterTitle: 'Examples — preplai',
    twitterDescription: 'Copy-paste example prompts for any AI presentation use case.',
    schema: techArticleSchema({
      title: 'Examples — preplai',
      description:
        'Example prompts for preplai presentations: incident postmortems, product walkthroughs, market analysis.',
      url: `${BASE_URL}/docs/examples`,
      keywords: 'preplai, examples, prompts, presentations',
    }),
  },
  {
    path: '/docs/tips',
    outputDir: 'docs/tips',
    title: 'Tips & Tricks — preplai',
    description:
      'Get better presentations with themes, color palettes, and prompt writing tips. Cinema vs light themes, audience-aware prompts, sharing and limits.',
    keywords: 'preplai, tips, themes, palettes, prompts, cinema, light, sharing',
    ogTitle: 'Tips & Tricks — preplai',
    ogDescription: 'Themes, palettes, and prompt tips for better preplai presentations.',
    twitterTitle: 'Tips & Tricks — preplai',
    twitterDescription: 'Get more from preplai with themes, palettes, and prompting tips.',
    schema: techArticleSchema({
      title: 'Tips & Tricks — preplai',
      description: 'Get better presentations with themes, color palettes, and prompt writing tips.',
      url: `${BASE_URL}/docs/tips`,
      keywords: 'preplai, tips, themes, palettes, prompts',
    }),
  },
  {
    path: '/docs/mcp-tools',
    outputDir: 'docs/mcp-tools',
    title: 'MCP Tools Reference — preplai',
    description:
      'Full reference for all preplai MCP tools: create_session, add_scene, get_session_url, manage_sessions, and more.',
    keywords: 'preplai, MCP, tools, API reference, create_session, add_scene, get_session_url',
    ogTitle: 'MCP Tools Reference — preplai',
    ogDescription: 'Full reference for all preplai MCP tools.',
    twitterTitle: 'MCP Tools Reference — preplai',
    twitterDescription: 'create_session, add_scene, get_session_url and more — full MCP tools reference.',
    schema: techArticleSchema({
      title: 'MCP Tools Reference — preplai',
      description:
        'Full reference for all preplai MCP tools: create_session, add_scene, get_session_url, manage_sessions.',
      url: `${BASE_URL}/docs/mcp-tools`,
      keywords: 'preplai, MCP, tools, API reference, create_session, add_scene',
    }),
  },
  {
    path: '/docs/visualscript',
    outputDir: 'docs/visualscript',
    title: 'VisualScript Schema — preplai',
    description:
      'JSON schema for preplai VisualScript: scenes, entities, frames, animations, and the compact format for AI agents.',
    keywords: 'preplai, VisualScript, schema, JSON, entities, frames, animations',
    ogTitle: 'VisualScript Schema — preplai',
    ogDescription: 'The JSON schema AI agents use to define cinema-quality preplai scenes.',
    twitterTitle: 'VisualScript Schema — preplai',
    twitterDescription: 'JSON schema for scenes, entities, frames, and animations in preplai.',
    schema: techArticleSchema({
      title: 'VisualScript Schema — preplai',
      description:
        'JSON schema for preplai VisualScript: scenes, entities, frames, animations, and the compact format for AI agents.',
      url: `${BASE_URL}/docs/visualscript`,
      keywords: 'preplai, VisualScript, schema, JSON, entities, animations',
    }),
  },

  // -------------------------------------------------------------------------
  // Blog index
  // -------------------------------------------------------------------------
  {
    path: '/blog',
    outputDir: 'blog',
    title: 'Blog — preplai',
    description:
      'The preplai blog: guides on MCP presentations, AI agent output, VisualScript, and the future of visual AI.',
    keywords: 'preplai, blog, MCP, AI presentations, VisualScript, AI agents',
    ogTitle: 'preplai Blog',
    ogDescription: 'Guides on MCP presentations, AI agent output, and the future of visual AI.',
    twitterTitle: 'preplai Blog',
    twitterDescription: 'Guides on MCP presentations, AI agent output, and visual AI.',
    schema: techArticleSchema({
      title: 'preplai Blog',
      description: 'The preplai blog: guides on MCP presentations, AI agent output, and VisualScript.',
      url: `${BASE_URL}/blog`,
      keywords: 'preplai, blog, MCP, AI presentations',
    }),
  },

  // -------------------------------------------------------------------------
  // Blog posts
  // -------------------------------------------------------------------------
  {
    path: '/blog/how-ai-agents-create-presentations',
    outputDir: 'blog/how-ai-agents-create-presentations',
    title: 'How AI Agents Create Presentations — preplai Blog',
    description:
      'Learn how AI agents like Claude and ChatGPT create cinema-quality presentations in real time. From user prompt to shareable URL in seconds.',
    keywords: 'AI agents, presentations, Claude, ChatGPT, MCP, preplai, cinema presentations',
    ogTitle: 'How AI Agents Create Presentations',
    ogDescription: 'From user prompt to shareable cinematic visual in seconds — how AI agents use preplai.',
    twitterTitle: 'How AI Agents Create Presentations',
    twitterDescription: 'Claude, ChatGPT, and any AI agent can create cinema-quality visuals with preplai.',
    schema: blogPostSchema({
      title: 'How AI Agents Create Presentations',
      description:
        'Learn how AI agents like Claude and ChatGPT create cinema-quality presentations in real time.',
      url: `${BASE_URL}/blog/how-ai-agents-create-presentations`,
      date: '2026-03-05',
      keywords: 'AI agents, presentations, Claude, ChatGPT, MCP, preplai',
    }),
  },
  {
    path: '/blog/mcp-for-presentations',
    outputDir: 'blog/mcp-for-presentations',
    title: 'MCP for Presentations: A Developer Guide — preplai Blog',
    description:
      'The Model Context Protocol (MCP) enables any AI agent to create presentations. Learn how MCP works and why it matters for visual content.',
    keywords: 'MCP, Model Context Protocol, AI agents, presentations, API, preplai',
    ogTitle: 'MCP for Presentations: A Developer Guide',
    ogDescription: 'How the Model Context Protocol enables any AI to create visual presentations.',
    twitterTitle: 'MCP for Presentations: A Developer Guide',
    twitterDescription: 'MCP enables any AI agent to create presentations. Here is how.',
    schema: blogPostSchema({
      title: 'MCP for Presentations: A Developer Guide',
      description:
        'The Model Context Protocol (MCP) enables any AI agent to create presentations. Learn how MCP works.',
      url: `${BASE_URL}/blog/mcp-for-presentations`,
      date: '2026-03-05',
      keywords: 'MCP, Model Context Protocol, AI agents, presentations, API',
    }),
  },
  {
    path: '/blog/visualscript-explained',
    outputDir: 'blog/visualscript-explained',
    title: 'VisualScript: The Schema for AI-Generated Scenes — preplai Blog',
    description:
      'VisualScript is the JSON schema that AI agents use to define cinema-quality scenes. Entity types, frames, and design guidelines.',
    keywords: 'VisualScript, schema, AI presentations, add_scene, entity types, preplai',
    ogTitle: 'VisualScript: The Schema for AI-Generated Scenes',
    ogDescription: 'The JSON schema AI agents use to define animated, narrated visual scenes.',
    twitterTitle: 'VisualScript: The Schema for AI-Generated Scenes',
    twitterDescription: 'Entity types, frames, and design guidelines for AI-generated preplai scenes.',
    schema: blogPostSchema({
      title: 'VisualScript: The Schema for AI-Generated Scenes',
      description:
        'VisualScript is the JSON schema that AI agents use to define cinema-quality scenes.',
      url: `${BASE_URL}/blog/visualscript-explained`,
      date: '2026-03-05',
      keywords: 'VisualScript, schema, AI presentations, entity types',
    }),
  },

  // -------------------------------------------------------------------------
  // Legal / other
  // -------------------------------------------------------------------------
  {
    path: '/terms',
    outputDir: 'terms',
    title: 'Terms of Service — preplai',
    description:
      'preplai Terms of Service. Read the terms governing your use of preplai, the MCP-native visual output layer for AI agents.',
    keywords: 'preplai, terms of service, legal',
    ogTitle: 'Terms of Service — preplai',
    ogDescription: 'Terms governing your use of preplai.',
    twitterTitle: 'Terms of Service — preplai',
    twitterDescription: 'Terms governing your use of preplai.',
    schema: null,
  },
  {
    path: '/privacy',
    outputDir: 'privacy',
    title: 'Privacy Policy — preplai',
    description:
      'preplai Privacy Policy. How we collect, use, and protect your data.',
    keywords: 'preplai, privacy policy, data protection',
    ogTitle: 'Privacy Policy — preplai',
    ogDescription: 'How preplai collects, uses, and protects your data.',
    twitterTitle: 'Privacy Policy — preplai',
    twitterDescription: 'How preplai collects, uses, and protects your data.',
    schema: null,
  },
  {
    path: '/contact',
    outputDir: 'contact',
    title: 'Contact — preplai',
    description:
      'Get in touch with the preplai team for enterprise inquiries, custom integrations, partnerships, or support.',
    keywords: 'preplai, contact, enterprise, support, integration',
    ogTitle: 'Contact preplai',
    ogDescription: 'Enterprise, integrations, partnerships, and support inquiries.',
    twitterTitle: 'Contact preplai',
    twitterDescription: 'Get in touch with the preplai team.',
    schema: null,
  },
];

// ---------------------------------------------------------------------------
// HTML injection helpers
// ---------------------------------------------------------------------------

/**
 * Replace the <title> tag in HTML.
 */
function replaceTitle(html, title) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
}

/**
 * Replace a <meta name="..."> tag. Handles both self-closing and non-self-closing.
 */
function replaceMeta(html, name, content) {
  const re = new RegExp(`<meta\\s+name="${name}"[^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  // Insert after <title> if not found
  return html.replace('</title>', `</title>\n  ${tag}`);
}

/**
 * Replace a <meta property="..."> tag (Open Graph).
 */
function replaceOgMeta(html, property, content) {
  const re = new RegExp(`<meta\\s+property="${property}"[^>]*>`, 'i');
  const tag = `<meta property="${property}" content="${escapeAttr(content)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace('</title>', `</title>\n  ${tag}`);
}

/**
 * Replace <link rel="canonical">.
 */
function replaceCanonical(html, url) {
  const re = /<link\s+rel="canonical"[^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeAttr(url)}" />`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace('</title>', `</title>\n  ${tag}`);
}

/**
 * Replace the first <script type="application/ld+json"> block.
 * If schema is null, removes the existing block.
 */
function replaceJsonLd(html, schema) {
  const re = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i;
  if (!schema) {
    return html.replace(re, '');
  }
  const tag = `<script type="application/ld+json">\n  ${schema}\n  </script>`;
  if (re.test(html)) {
    return html.replace(re, tag);
  }
  return html.replace('</head>', `  ${tag}\n</head>`);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function buildRouteHtml(template, route) {
  let html = template;

  html = replaceTitle(html, route.title);
  html = replaceMeta(html, 'description', route.description);
  html = replaceMeta(html, 'keywords', route.keywords);
  html = replaceCanonical(html, `${BASE_URL}${route.path === '/' ? '/' : route.path}`);

  // Open Graph
  html = replaceOgMeta(html, 'og:title', route.ogTitle);
  html = replaceOgMeta(html, 'og:description', route.ogDescription);
  html = replaceOgMeta(html, 'og:url', `${BASE_URL}${route.path}`);

  // Twitter
  html = replaceMeta(html, 'twitter:title', route.twitterTitle);
  html = replaceMeta(html, 'twitter:description', route.twitterDescription);

  // JSON-LD
  html = replaceJsonLd(html, route.schema);

  return html;
}

async function main() {
  const templatePath = resolve(distDir, 'index.html');
  if (!existsSync(templatePath)) {
    console.error(`❌  dist/index.html not found. Run \`vite build\` first.`);
    process.exit(1);
  }

  const template = readFileSync(templatePath, 'utf-8');
  let generated = 0;

  for (const route of ROUTES) {
    const html = buildRouteHtml(template, route);

    let outputPath;
    if (route.outputDir === '') {
      // Homepage — overwrite the root index.html
      outputPath = resolve(distDir, 'index.html');
    } else {
      const dir = resolve(distDir, route.outputDir);
      mkdirSync(dir, { recursive: true });
      outputPath = resolve(dir, 'index.html');
    }

    writeFileSync(outputPath, html, 'utf-8');
    console.log(`  ✓  ${route.path}  →  ${outputPath.replace(distDir, 'dist')}`);
    generated++;
  }

  console.log(`\n✅  Prerendered ${generated} routes.`);
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
