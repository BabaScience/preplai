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
import { scoreVisualScript, type QualityReport } from './quality-scorer.js';
import { runQualityGuards } from './quality-guards.js';
import { trackEntityTypes } from './entity-tracker.js';
import { classifySession } from './session-classifier.js';
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

// ── Rich tool descriptions (loaded from versioned files) ─────────────
// Source of truth: tool-descriptions/*.v1.md — edit those files, not these constants.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __toolDescDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'tool-descriptions');

export const ADD_SCENE_DESCRIPTION = readFileSync(path.join(__toolDescDir, 'add-scene.v1.md'), 'utf-8').trim();

export const CREATE_SESSION_DESCRIPTION = readFileSync(path.join(__toolDescDir, 'create-session.v1.md'), 'utf-8').trim();

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

// ── Quality hints for agent self-correction ──────────────────────────

const QUALITY_THRESHOLD = 60; // dimensions scoring below this get a hint

function generateQualityHints(report: QualityReport): string[] {
  const hints: string[] = [];
  const d = report.dimensions;

  if (d.entityPersistence.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Entity Persistence (${d.entityPersistence.score}/100): Entities are being rebuilt each frame. ` +
      `Keep 2–3 anchor entities (like your title H1 and main Server/Concept) with the SAME id across ALL frames. ` +
      `Only add/remove 1–3 detail entities per transition.`
    );
  }

  if (d.connectionCompleteness.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Connection Completeness (${d.connectionCompleteness.score}/100): Some entities are orphaned (no connections). ` +
      `Every content entity (Server, Database, User, etc.) should connect to at least one other via Arrow or DataFlow. ` +
      `Add src/tgt connections to show relationships.`
    );
  }

  if (d.visualBalance.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Visual Balance (${d.visualBalance.score}/100): Entities are clustered to one side. ` +
      `Spread entities across x: 20–80 and y: 20–80. The center of mass should be near [50, 50]. ` +
      `Example balanced positions: [20,40], [50,30], [80,40].`
    );
  }

  if (d.entityDensity.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Entity Density (${d.entityDensity.score}/100): Frames have too few or too many entities. ` +
      `Aim for 5–7 content entities per frame (excluding connections and headings).`
    );
  }

  if (d.narrationQuality.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Narration Quality (${d.narrationQuality.score}/100): Narration is too generic or redundant. ` +
      `Add specifics: metrics (e.g. '50ms latency'), technology names (e.g. 'PostgreSQL'), or quantities. ` +
      `Good narration adds WHY and context, not restates WHAT the visual already shows. Use specific entity labels, not generic names.`
    );
  }

  if (d.narrativeArc.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Narrative Arc (${d.narrativeArc.score}/100): Presentation lacks narrative structure. ` +
      `Start simple (3–4 entities in frame 1), build complexity across frames, and use highlight:true ` +
      `on a different entity each frame to create cinematic focus pull. Aim for 3–7 total frames.`
    );
  }

  if (d.narrationCoverage.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Narration Coverage (${d.narrationCoverage.score}/100): Some frames are missing narration. ` +
      `Every frame needs narrationSegment text — it drives the voice-over and subtitle display.`
    );
  }

  if (d.layoutQuality.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Layout Quality (${d.layoutQuality.score}/100): Entities overlap or are unevenly spaced. ` +
      `Maintain at least 15% distance between entity positions and spread them evenly across the canvas.`
    );
  }

  if (d.formatCompliance.score < QUALITY_THRESHOLD) {
    hints.push(
      `- Format Compliance (${d.formatCompliance.score}/100): Some entities have invalid positions or missing fields. ` +
      `Ensure all positions are in 0–100 range and every entity has an id and type. ` +
      `Connection entities (Arrow, DataFlow) need src and tgt references.`
    );
  }

  return hints;
}

// ── Tool registration (5 consolidated tools) ─────────────────────────

export function registerMcpTools(mcp: McpServer, deps: McpToolDeps): void {
  const { store, sse, baseUrl, getApiKey, openPlayerInBrowser, ttsService } = deps;
  const sceneDeps = { store, sse, ttsService, audioStore: deps.audioStore };
  const createDeps = { store, baseUrl };

  // ── Tool 1: create_session ──────────────────────────────────────────
  // Consolidates: create_session + get_preferences + get_illustrations
  // IMPORTANT: Returns existing active session if one was created recently,
  // so the LLM appends to it instead of creating duplicates.
  mcp.tool(
    'create_session',
    CREATE_SESSION_DESCRIPTION,
    {
      title: z.string().describe('Clear, descriptive title matching the user\'s topic (e.g. "Binary Search Tree Insertion", "System Architecture Overview")'),
      aspect_ratio: z.string().optional().describe('Aspect ratio, default "16:9". Options: "16:9", "4:3"'),
      style: z.enum(['cinema', 'light']).optional().describe('Override theme: "cinema" (rich gradients, dark) or "light" (warm beige, light mode). Omit to use the user\'s dashboard preference.'),
      force_new: z.boolean().optional().describe('Set to true to force creating a new session even if one already exists. Default: false — reuses the most recent active session.'),
    },
    async (args, extra) => {
      const { trackUsage, checkSessionLimit } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      // ── Active session reuse ──────────────────────────────────────
      // If the API key already has a recent session (< 1 hour old),
      // return it instead of creating a new one. This prevents the LLM
      // from creating duplicate presentations on follow-up requests
      // like "explain deeper" or "add more slides".
      if (!args.force_new) {
        const existingSessions = store.listSessionsByKey(apiKey.id);
        const ONE_HOUR = 60 * 60 * 1000;
        const recentSession = existingSessions.find(
          (s) => Date.now() - s.created_at < ONE_HOUR,
        );
        if (recentSession) {
          const prefs = await getUserPlayerPrefs(apiKey.id);
          const theme = args.style ?? prefs.theme;
          const palette = prefs.palette;
          const { buildPlayerUrlSuffix } = await import('./auth.js');
          const suffix = buildPlayerUrlSuffix(theme, palette);
          const embedSuffix = suffix ? `?embed=1&${suffix.slice(1)}` : '?embed=1';
          const { getIllustrationsReference } = await import('./illustrations-reference.js');
          const illustrations = getIllustrationsReference();

          const frameCount = recentSession.script?.frames?.length ?? 0;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                reused_existing_session: true,
                data: {
                  session_id: recentSession.id,
                  player_url: `${baseUrl}/player/${recentSession.id}${suffix}`,
                  embed_url: `${baseUrl}/player/${recentSession.id}${embedSuffix}`,
                  title: recentSession.title,
                  aspect_ratio: recentSession.aspect_ratio,
                  created_at: new Date(recentSession.created_at).toISOString(),
                  frame_count: frameCount,
                  preferences: { theme, palette },
                  illustrations,
                },
                hint: `Active session "${recentSession.title}" already exists with ${frameCount} frame(s). ` +
                  `Use add_scene with session_id "${recentSession.id}" and mode:"append" to add more content. ` +
                  `Only call create_session with force_new:true if the user explicitly asks for a completely new/separate presentation.`,
              }),
            }],
          };
        }
      }

      const limitCheck = await checkSessionLimit(apiKey.id, apiKey.tier);
      if (!limitCheck.allowed) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'LIMIT_EXCEEDED', message: limitCheck.reason, suggestion: 'Delete an existing presentation using manage_sessions with action "delete", or upgrade your plan.' } }) }] };
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

  // ── Tool 2: add_scene (data-only — no inline UI) ───────────────────
  // Consolidates: add_scene + update_scene (via mode param)
  // NOTE: This is a regular tool, NOT an App tool. No iframe is rendered.
  // The AI calls add_scene to build/update the presentation, then calls
  // get_session_url once at the end to show the inline player.
  mcp.tool(
    'add_scene',
    ADD_SCENE_DESCRIPTION,
    {
      session_id: z.string().describe('Session ID from create_session'),
      visual_script: z.record(z.unknown()).describe('REQUIRED compact format: sid, td, f, e, p, n, l, src, tgt; position [x,y]; omit color. Use session_id as sid.'),
      mode: z.enum(['append', 'replace']).optional().describe('Mode: "append" (default) appends frames to existing scene. "replace" replaces the entire visual script.'),
    },
    async (args, extra) => {
      const { trackUsage } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
      }

      const mode = args.mode ?? 'append';
      const handler = mode === 'replace' ? handleUpdateScene : handleAddScene;

      if (!ownership.ok && ownership.notFound) {
        const result = await withErrorBoundary((a: any) => handler(a, sceneDeps))({ session_id: args.session_id, visual_script: args.visual_script });
        return { content: result.content };
      }

      const result = await withErrorBoundary(
        (a: any) => handler(a, sceneDeps),
      )({ session_id: args.session_id, visual_script: args.visual_script });

      const toolName = mode === 'replace' ? 'update_scene' : 'add_scene';
      await trackUsage(apiKey.id, toolName, args.session_id);

      // Quality scoring: run synchronously so we can return feedback to the agent
      const session = store.getSession(args.session_id);
      sceneAddedTotal.inc({ mode });

      // Track entity type usage + classify session (fire-and-forget, don't block response)
      if (session?.script && apiKey) {
        trackEntityTypes(session.script, apiKey.id).catch(() => {});
        classifySession(args.session_id, session.script).catch(() => {});
      }

      let qualityHints: string[] = [];
      if (session?.script) {
        try {
          // Preventive quality guards (lightweight anti-pattern checks)
          const guardWarnings = runQualityGuards(session.script);
          if (guardWarnings.length > 0) {
            qualityHints.push(...guardWarnings.map((w) => `- ${w.message}`));
          }

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
            `connections=${report.dimensions.connectionCompleteness.score} ` +
            `frames=${report.frameCount} entities=${report.totalEntities}`,
          );

          // Generate actionable hints for weak dimensions (threshold: 60)
          qualityHints = generateQualityHints(report);
        } catch (err) {
          console.error('[quality] scoring failed:', err);
        }
      }

      // Append quality hints to the response so the agent can self-correct
      if (qualityHints.length > 0) {
        const hintsText = `\n⚠️ QUALITY HINTS (fix with add_scene mode="replace"):\n${qualityHints.join('\n')}`;
        const resultContent = [...result.content];
        // Append hints to the last text content block
        const lastText = [...resultContent].reverse().find((c: any) => c.type === 'text');
        if (lastText && 'text' in lastText) {
          (lastText as any).text += hintsText;
        } else {
          resultContent.push({ type: 'text' as const, text: hintsText });
        }
        return { content: resultContent };
      }

      return { content: result.content };
    },
  );

  // ── Tool 3: get_session_url (MCP App — renders inline player) ───────
  // This is the ONLY App tool — it renders the cinematic player inline.
  // The AI should call add_scene to build the presentation, then call
  // get_session_url ONCE at the end to display it. On follow-up questions,
  // the AI adds more scenes and calls get_session_url again to refresh.
  registerAppTool(
    mcp,
    'get_session_url',
    {
      description: 'Show the presentation inline and get its player URL. Call this ONCE after all add_scene calls are done — it renders the cinematic player directly in the conversation. Returns player_url, embed_url (iframe), and preferences (theme, palette). Set include_stats to true for frame count and duration. For follow-up requests, add more scenes first, then call this again to refresh the player.',
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
      const theme = prefs.theme || 'cinema';
      const palette = prefs.palette || 'default';
      const params = new URLSearchParams();
      params.set('style', theme);
      params.set('palette', palette);
      if (apiKey) params.set('key', apiKey.id);
      return {
        content: result.content,
        _meta: {
          script: session?.script ?? null,
          palette,
          theme,
          baseUrl,
          playerUrl: `${baseUrl}/player/${args.session_id}?${params.toString()}`,
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
  // CSP:
  // - resourceDomains: GSAP CDN, Google Fonts, AND our server (for audio media-src)
  // - connectDomains: our server (for fetching audio via HTMLAudioElement)
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
                prefersBorder: false,
                csp: {
                  resourceDomains: [
                    'https://cdnjs.cloudflare.com',
                    'https://fonts.googleapis.com',
                    'https://fonts.gstatic.com',
                    baseUrl,  // e.g. https://player.preplai.com — for audio media-src
                  ],
                  connectDomains: [
                    baseUrl,  // for HTMLAudioElement fetching /audio/:sessionId/:frame.mp3
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
