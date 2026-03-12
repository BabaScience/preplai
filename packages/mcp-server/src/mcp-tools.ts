/**
 * @preplai/mcp-server — Shared MCP Tool Registration
 *
 * Registers all 5 MCP tools on an McpServer instance. Used by both:
 * - stdio-bridge (StdioServerTransport for Claude Desktop)
 * - server (Streamable HTTP via fastify-mcp-server)
 *
 * Consolidated from 10 tools → 5 so Claude.ai always loads all tools
 * (its Tool Search system picks 3-5 per query from the available set).
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { SessionStore } from './session-store.js';
import type { SseRegistry } from './sse.js';
import type { TtsService } from './tts-service.js';
import type { AudioStore } from './audio-store.js';
import {
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
  handleListSessions,
  handleDeleteSession,
  handleRemoveScene,
} from './tools.js';
import { getUserPlayerPrefs } from './auth.js';
import { withErrorBoundary, mcpForbidden, mcpUnauthorized } from './errors.js';
import { verifySessionOwnership } from './session-utils.js';
import { scoreVisualScript } from './quality-scorer.js';
import {
  qualityScoreOverall,
  qualityScoreDimension,
  qualityFrameCount,
  qualityEntityCount,
  sceneAddedTotal,
  sessionCreatedTotal,
} from './metrics.js';

// ── MCP App constants ─────────────────────────────────────────────────
const PLAYER_RESOURCE_URI = 'ui://preplai/player.html';

/**
 * Resolve path to built MCP App HTML.
 * - Production: copied to dist/mcp-app.html alongside compiled JS
 * - Dev (monorepo): falls back to ../../player/dist/mcp-app.html
 */
async function resolveMcpAppHtmlPath(): Promise<string> {
  // 1. Check local dist/ (production deploy)
  const localPath = path.resolve(import.meta.dirname, 'mcp-app.html');
  try {
    await fs.access(localPath);
    return localPath;
  } catch {}
  // 2. Fallback to monorepo sibling package (dev)
  return path.resolve(import.meta.dirname, '../../player/dist/mcp-app.html');
}

// ── Rich tool descriptions ────────────────────────────────────────────

export const ADD_SCENE_DESCRIPTION = `Add or replace a visual scene in a presentation session. The scene is rendered as animated SVG on a 1920x1080 dark canvas.

MODE: "append" (default) appends frames to existing scene. "replace" replaces the entire visual script.

REQUIRED — USE COMPACT FORMAT (reduces tokens significantly):
- Short keys: sid (sceneId), td (totalDuration), f (frames), e (entities), n (narrationSegment), p (position), l (label), m (metadata), src (sourceEntityId), tgt (targetEntityId), a (animation), lang (language), hl (highlight), sz (size), c (color), fc (focusCues), tr (transitions), d (description), par (parentEntityId), tc (textContent)
- Position: [50,50] NOT {x:50,y:50}
- Omit: color (palette used), frame id/startTime/endTime/description, entity id for non-connected entities
- Aliases: BT, BTR, ARR, CST, CB, G2, COORD, BC, DNS, SVC, GW, SL, PS, GC, CH, ML, CKT, CYC

Example (REQUIRED format — 5–7 entities per frame, with entity persistence):
{"sid":"<session_id>","td":10000,"f":[{"e":[{"id":"h1","type":"H1","p":[50,6],"l":"API Architecture"},{"id":"srv","type":"Server","p":[25,45],"l":"API Server"},{"id":"db","type":"Database","p":[50,45],"l":"PostgreSQL","highlight":true},{"id":"a1","type":"Arrow","p":[37,45],"src":"srv","tgt":"db","l":"SQL Queries"},{"id":"l1","type":"Label","p":[50,80],"l":"Read-through caching pattern"}],"n":"The API server queries PostgreSQL for user data. Each request hits the database directly, adding 50ms of latency per query."},{"e":[{"id":"h1","type":"H1","p":[50,6],"l":"API Architecture"},{"id":"srv","type":"Server","p":[25,45],"l":"API Server"},{"id":"db","type":"Database","p":[65,45],"l":"PostgreSQL"},{"id":"cache","type":"Cache","p":[45,45],"l":"Redis","highlight":true},{"id":"a1","type":"Arrow","p":[35,45],"src":"srv","tgt":"cache","l":"Check cache"},{"id":"a2","type":"Arrow","p":[55,45],"src":"cache","tgt":"db","l":"Cache miss"},{"id":"l1","type":"Label","p":[50,80],"l":"Cache reduces DB load by 90%"}],"n":"Adding Redis as a caching layer between the API and database. Frequently accessed data is served from memory in under 1ms, with cache misses falling through to PostgreSQL."}]}

LANGUAGE & VOICE: Set lang at script level for the whole presentation, or per-frame to mix languages. Supported: "en" (default), "fr" (French), "it" (Italian). Script-level: {"sid":"...","td":10000,"lang":"fr","f":[...]}. Frame override: {"e":[...],"n":"Voici le serveur","lang":"fr"}. Frame language overrides script language. If unset, defaults to English.

═══ CINEMATIC ENGINE — How your frames render ═══

ENTITY PERSISTENCE: Same entity id across frames = entity STAYS in DOM (no rebuild). New ids animate in, removed ids slide out. This is the #1 feature — use it to build narrative continuity. Keep core entities (Server, Database, User) persistent across frames and add/remove detail entities around them.

DEPTH OF FIELD: Set "highlight": true on the entity you're narrating about. The engine dims/blurs everything else (0.35 opacity, blur, 0.88x scale) and enlarges the focused entity (1.15x). Creates cinematic focus pull. Use ONE highlight per frame, matching narration.

CAMERA: ViewBox auto-pans/zooms to frame your entities. Control through positioning:
- Cluster entities tightly → camera zooms in (detail shot)
- Spread entities wide → camera zooms out (establishing shot)
- Shift cluster between frames → camera pans (reveal)

MOTIVATED ENTRANCE (automatic): Entities near edges fly in from that edge. Entities near existing entities grow from that point. Center entities fade up. You just place entities — the engine animates intelligently.

IDLE ANIMATIONS (automatic): Servers pulse LEDs, databases shimmer, neural nets glow, concepts breathe. Entities feel alive.

═══ CONTENT & COMPOSITION ═══

CONTENT DENSITY (critical): Aim for 5–7 entities per frame. Avoid sparse slides with only 1–3 items — each frame should feel complete and informative.

CONTENT QUALITY: Match the richness and detail of GPT/Claude chat explanations — not stripped-down summaries. Avoid generic, templated, or synthetic phrasing. Use specific labels when possible (e.g. "PostgreSQL" not "DB", "SQL queries" not "Queries"). Each narration sentence should be substantive — include context, specifics, or examples.

NARRATION QUALITY: Good — "Binary search works by repeatedly halving the search space. We maintain two pointers, lo and hi; each comparison eliminates half the remaining elements, giving O(log n) time." Bad — "Binary search divides the array. It's efficient."

NARRATIVE ARC: Structure frames like a film — (1) Establish the scene with core entities, (2) Focus on one part with highlight, (3) Expand with new entities, (4) Resolve with complete picture. Build complexity gradually across frames.

DESIGN GUIDELINES:
- COLORS — Omit entity.color by default (palette auto-assigns). Use c (color) to override when a specific color is needed (e.g. "#e74c3c" for error states).
- Title: type H1 (main heading), H2 (section), or H3 (subsection). Use metadata.label or l.
- Space entities evenly. Minimum 15% gap between entity positions.
- Entities use a tuned default size. Omit sz by default. Use sz (0.5–3.0) to scale entities when needed.
- Each entity type has a smart default entrance animation. Override via a (animation): {entrance, delay (ms), duration (ms), easing (CSS)}. Example: "a":{"entrance":"scaleIn","delay":500,"duration":800}.
- Focus cues: Auto-generated from narration when TTS is active. Override with fc (focusCues) per frame. Single entity: [{"t":1.5,"eid":"srv","w":"server"}]. Multi-entity: [{"t":1.5,"eids":["srv","db"],"conf":[1.0,0.6],"w":"server queries database"}]. The engine supports graduated focus — higher confidence entities appear more prominent.

FRAME PACING: 3–5 seconds per frame for readability. Build complexity gradually — simpler frames first, add entities in later frames.

ENTITY TYPES & METADATA: create_session returns full illustrations reference (entityTypes, aliases, topicHints, metadataHints). Key types: Server, Database, Cache, User, Cloud, Service (metadata.kind: API|Service|APIGateway), Queue, LoadBalancer, Container, Pod, Lambda, Pipeline, Monitor, Firewall, Network, Volume, CodeBlock, BinaryTree, Array, StepList, BigO, BarChart, Graph2D, CoordinateSystem, ProcessState, CallStack, Stack, H1/H2/H3, Concept, Arrow, DataFlow. Avoid generic Entity/Group — use dedicated types for rich visuals.

Connection types: Arrow, DataFlow (animated dashes), BidirectArrow, DottedArrow. Use metadata.curved=true for curved arrows. Connections: use src (sourceEntityId) and tgt (targetEntityId).

Entrance animations: fadeInUp, fadeIn, scaleIn, drawIn, floatIn, slideInLeft, dropIn. Omit a (animation) to use smart defaults.`;

// ── Dependencies for tool handlers ────────────────────────────────────

export interface McpToolDeps {
  store: SessionStore;
  sse: SseRegistry;
  baseUrl: string;
  /** Resolves API key for the current request. For stdio: fixed local key. For HTTP: from extra.authInfo (MCP transport) or AsyncLocalStorage. */
  getApiKey: (extra?: unknown) => { id: string; tier: string } | null;
  /** Optional: auto-open player URL in browser (stdio bridge only) */
  openPlayerInBrowser?: (url: string) => void;
  /** Optional: ElevenLabs TTS service for audio generation */
  ttsService?: TtsService;
  /** Optional: audio buffer store for cleanup on session delete */
  audioStore?: AudioStore;
}

// ── Tool registration (5 consolidated tools) ─────────────────────────

export function registerMcpTools(mcp: McpServer, deps: McpToolDeps): void {
  const { store, sse, baseUrl, getApiKey, openPlayerInBrowser, ttsService } = deps;
  const sceneDeps = { store, sse, ttsService };
  const createDeps = { store, baseUrl };

  // ── Tool 1: create_session ──────────────────────────────────────────
  // Consolidates: create_session + get_preferences + get_illustrations
  mcp.tool(
    'create_session',
    `Create a new cinematic presentation session. Returns a session_id and a player_url.

PREREQUISITE — MANDATORY: NEVER call this tool until you have asked the user at least one clarifying question. Even vague requests ("make me a simple presentation", "the simplest example possible") require you to ask first — e.g. "What topic would you like this to cover?" or "What do you want to understand better?" Gather topic, purpose, depth, and style before proceeding. Do NOT call immediately when the user says "create a presentation" without context.

THEMES: "cinema" (rich gradients) or "minimal" (flat, algorithm-viz). PALETTES: "default", "ocean", "sunset", "forest", "mono". The user's dashboard preference is used unless you pass style. Omit entity.color in add_scene by default — the player uses the palette automatically. Player URL: open in browser for user to watch.

RETURNS: session_id, player_url, embed_url (for iframe embedding), preferences (theme, palette), AND illustrations reference (entityTypes, aliases, shortKeys, topicHints, metadataHints). Use the illustrations data to choose the right entity types for add_scene.

LANGUAGE: For non-English presentations, set lang in the visual_script passed to add_scene. Supported: "en" (default), "fr", "it". TTS generates voice in the matching language.

CALLBACK: When running locally, the player URL is auto-opened. For remote clients, share the player_url.`,
    {
      title: z.string().describe('Clear, descriptive title matching the user\'s topic (e.g. "Binary Search Tree Insertion", "System Architecture Overview")'),
      aspect_ratio: z.string().optional().describe('Aspect ratio, default "16:9". Options: "16:9", "4:3"'),
      style: z.enum(['cinema', 'minimal']).optional().describe('Override theme: "cinema" (rich gradients) or "minimal" (flat). Omit to use the user\'s dashboard preference.'),
    },
    async (args, extra) => {
      const { trackUsage, checkSessionLimit } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const limitCheck = await checkSessionLimit(apiKey.id, apiKey.tier);
      if (!limitCheck.allowed) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'LIMIT_EXCEEDED', message: limitCheck.reason, suggestion: 'Delete old sessions or upgrade.' } }) }] };
      }

      const result = await withErrorBoundary(
        (a: any) => handleCreateSession({ ...a, _apiKeyId: apiKey.id }, createDeps),
      )(args);

      try {
        const data = JSON.parse(result.content[0].text);
        if (data.success) {
          await trackUsage(apiKey.id, 'create_session', data.data.session_id);
          sessionCreatedTotal.inc();
        }
      } catch {}

      if (openPlayerInBrowser) {
        try {
          const data = JSON.parse(result.content[0].text);
          if (data.success && data.data.player_url) {
            openPlayerInBrowser(data.data.player_url);
          }
        } catch {}
      }

      return { content: result.content };
    },
  );

  // ── Tool 2: add_scene (MCP App — renders inline player) ────────────
  // Consolidates: add_scene + update_scene (via mode param)
  registerAppTool(
    mcp,
    'add_scene',
    {
      description: ADD_SCENE_DESCRIPTION,
      inputSchema: {
        session_id: z.string().describe('Session ID from create_session'),
        visual_script: z.record(z.unknown()).describe('REQUIRED compact format: sid, td, f, e, p, n, l, src, tgt; position [x,y]; omit color. Use session_id as sid.'),
        mode: z.enum(['append', 'replace']).optional().describe('Mode: "append" (default) appends frames to existing scene. "replace" replaces the entire visual script.'),
      },
      _meta: { ui: { resourceUri: PLAYER_RESOURCE_URI } },
    },
    async (args: { session_id: string; visual_script: any; mode?: 'append' | 'replace' }, extra: any) => {
      const { trackUsage, checkSceneLimit } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as any;

      const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        return mcpForbidden() as any;
      }

      const mode = args.mode ?? 'append';
      const handler = mode === 'replace' ? handleUpdateScene : handleAddScene;

      if (!ownership.ok && ownership.notFound) {
        const result = await withErrorBoundary((a: any) => handler(a, sceneDeps))({ session_id: args.session_id, visual_script: args.visual_script });
        return { content: result.content };
      }

      const sceneCheck = await checkSceneLimit(apiKey.id, apiKey.tier);
      if (!sceneCheck.allowed) {
        return { content: [{ type: 'text' as const, text: JSON.stringify({ success: false, error: { code: 'LIMIT_EXCEEDED', message: sceneCheck.reason, suggestion: 'Upgrade your plan or delete scenes.' } }) }] };
      }

      const result = await withErrorBoundary(
        (a: any) => handler(a, sceneDeps),
      )({ session_id: args.session_id, visual_script: args.visual_script });

      const toolName = mode === 'replace' ? 'update_scene' : 'add_scene';
      await trackUsage(apiKey.id, toolName, args.session_id);

      // Attach full script + palette/theme + player URL for MCP App inline rendering
      const session = store.getSession(args.session_id);
      const prefs = await getUserPlayerPrefs(apiKey.id);
      const suffix = apiKey ? `?key=${apiKey.id}` : '';

      // Fire-and-forget: quality scoring + Prometheus metrics (non-blocking)
      sceneAddedTotal.inc({ mode });
      if (session?.script) {
        Promise.resolve().then(() => {
          try {
            const report = scoreVisualScript(session.script);

            // Prometheus histograms
            qualityScoreOverall.observe(report.overall);
            qualityFrameCount.observe(report.frameCount);
            qualityEntityCount.observe(report.totalEntities);
            for (const [dim, val] of Object.entries(report.dimensions)) {
              qualityScoreDimension.observe({ dimension: dim }, val.score);
            }

            console.log(
              `[quality] session=${args.session_id} overall=${report.overall} ` +
              `density=${report.dimensions.entityDensity.score} ` +
              `layout=${report.dimensions.layoutQuality.score} ` +
              `balance=${report.dimensions.visualBalance.score} ` +
              `persistence=${report.dimensions.entityPersistence.score} ` +
              `narration=${report.dimensions.narrationCoverage.score} ` +
              `format=${report.dimensions.formatCompliance.score} ` +
              `frames=${report.frameCount} entities=${report.totalEntities}`,
            );
          } catch (err) {
            console.error('[quality] scoring failed:', err);
          }
        });
      }

      return {
        content: result.content,
        _meta: {
          script: session?.script ?? null,
          palette: prefs.palette || 'default',
          theme: prefs.theme || 'cinema',
          playerUrl: `${baseUrl}/player/${args.session_id}${suffix}`,
        },
      };
    },
  );

  // ── Tool 3: get_session_url (MCP App — renders inline player) ───────
  registerAppTool(
    mcp,
    'get_session_url',
    {
      description: 'Get the player URL for a session. Returns player_url, embed_url (iframe), and preferences (theme, palette). Set include_stats to true for frame count and duration. Open the player_url in a browser to view the presentation.',
      inputSchema: {
        session_id: z.string().describe('Session ID'),
        include_stats: z.boolean().optional().describe('Include frame count, duration, etc.'),
      },
      _meta: { ui: { resourceUri: PLAYER_RESOURCE_URI } },
    },
    async (args: { session_id: string; include_stats?: boolean }, extra: any) => {
      const apiKey = getApiKey(extra);
      if (apiKey) {
        const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
        if (!ownership.ok && !ownership.notFound) {
          return mcpForbidden() as any;
        }
      }

      const result = await withErrorBoundary(
        (a: any) => handleGetSessionUrl(a, { store, baseUrl, apiKeyId: apiKey?.id }),
      )(args);

      // Attach full script + palette/theme + player URL for MCP App inline rendering
      const session = store.getSession(args.session_id);
      const prefs = await getUserPlayerPrefs(apiKey?.id);
      const suffix = apiKey ? `?key=${apiKey.id}` : '';
      return {
        content: result.content,
        _meta: {
          script: session?.script ?? null,
          palette: prefs.palette || 'default',
          theme: prefs.theme || 'cinema',
          playerUrl: `${baseUrl}/player/${args.session_id}${suffix}`,
        },
      };
    },
  );

  // ── Tool 4: manage_sessions ─────────────────────────────────────────
  // Consolidates: list_sessions + delete_session + remove_scene
  mcp.tool(
    'manage_sessions',
    `Manage presentation sessions. Actions:
- "list": List all sessions with titles, player URLs, and frame counts. Most recent first.
- "delete": Permanently delete a session and all its data. Cannot be undone.
- "remove_frames": Remove frames from a session. Use frame_indices for specific frames (0-based), last_n for the last N frames, or neither to clear all frames.`,
    {
      action: z.enum(['list', 'delete', 'remove_frames']).describe('Action to perform'),
      session_id: z.string().optional().describe('Session ID (required for "delete" and "remove_frames")'),
      limit: z.number().optional().describe('Max sessions to return for "list" action (default 20, max 100)'),
      frame_indices: z.array(z.number()).optional().describe('For "remove_frames": specific frame indices to remove (0-based)'),
      last_n: z.number().optional().describe('For "remove_frames": remove the last N frames'),
    },
    async (args, extra) => {
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const { action, session_id, limit, frame_indices, last_n } = args;

      if (action === 'list') {
        const result = await withErrorBoundary(
          (a: any) => handleListSessions(a, { store, baseUrl, apiKeyId: apiKey.id }),
        )({ limit });
        return { content: result.content };
      }

      if (action === 'delete') {
        if (!session_id) {
          return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: 'session_id is required for "delete" action.' } }) }] };
        }
        const ownership = verifySessionOwnership(store, session_id, apiKey.id);
        if (!ownership.ok && !ownership.notFound) {
          return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
        }

        const result = await withErrorBoundary(
          (a: any) => handleDeleteSession(a, { store, audioStore: deps.audioStore }),
        )({ session_id });
        return { content: result.content };
      }

      if (action === 'remove_frames') {
        if (!session_id) {
          return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: 'session_id is required for "remove_frames" action.' } }) }] };
        }
        const ownership = verifySessionOwnership(store, session_id, apiKey.id);
        if (!ownership.ok && !ownership.notFound) {
          return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
        }

        const result = await withErrorBoundary(
          (a: any) => handleRemoveScene(a, sceneDeps),
        )({ session_id, frame_indices, last_n });
        return { content: result.content };
      }

      return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'VALIDATION_ERROR', message: `Unknown action: ${action}` } }) }] };
    },
  );

  // ── Tool 5: add_narration ───────────────────────────────────────────
  mcp.tool(
    'add_narration',
    'Add narration text to a specific frame in a session. The text appears as a subtitle overlay in the player. 2–4 sentences, informative and detailed. Match tone to the user\'s question (technical vs beginner-friendly).',
    {
      session_id: z.string().describe('Session ID'),
      text: z.string().describe('Narration text to display'),
      frame_index: z.number().optional().describe('Frame index (0-based, default 0)'),
    },
    async (args, extra) => {
      const { trackUsage } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
      }
      if (!ownership.ok && ownership.notFound) {
        const result = await withErrorBoundary((a: any) => handleAddNarration(a, sceneDeps))(args);
        return { content: result.content };
      }

      const result = await withErrorBoundary(
        (a: any) => handleAddNarration(a, sceneDeps),
      )(args);

      await trackUsage(apiKey.id, 'add_narration', args.session_id);
      return { content: result.content };
    },
  );

  // ── MCP App Resource: Preplai Player HTML ─────────────────────────
  // Shared by add_scene and get_session_url tools.
  // CSP allows GSAP CDN and Google Fonts for dynamic loading in sandbox.
  registerAppResource(
    mcp,
    'Preplai Player',
    PLAYER_RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const htmlPath = await resolveMcpAppHtmlPath();
      const html = await fs.readFile(htmlPath, 'utf-8');
      return {
        contents: [
          {
            uri: PLAYER_RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  resourceDomains: [
                    'https://cdnjs.cloudflare.com',
                    'https://fonts.googleapis.com',
                    'https://fonts.gstatic.com',
                  ],
                },
              },
            },
          },
        ],
      };
    },
  );
}
