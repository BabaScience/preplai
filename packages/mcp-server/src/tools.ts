/**
 * @pre/mcp-server — MCP Tool Handlers
 *
 * Pure handler functions for all 5 MCP tools.
 * Dependencies (store, sse, baseUrl) are injected, enabling unit testing.
 */
import type { SessionStore } from './session-store.js';
import type { SseRegistry } from './sse.js';
import { mcpOk, mcpNotFound, mcpErr, type McpToolContent } from './errors.js';

// ── Dependency injection interfaces ───────────────────────────────────

interface CreateSessionDeps {
  store: SessionStore;
  baseUrl: string;
}

interface SceneDeps {
  store: SessionStore;
  sse: SseRegistry;
}

interface SessionUrlDeps {
  store: SessionStore;
  baseUrl: string;
}

// ── Tool 1: create_session ────────────────────────────────────────────

export async function handleCreateSession(
  args: { title: string; aspect_ratio?: string },
  deps: CreateSessionDeps,
): Promise<McpToolContent> {
  const { title, aspect_ratio = '16:9' } = args;
  const { store, baseUrl } = deps;

  const session = store.createSession(title, aspect_ratio);

  return mcpOk({
    session_id: session.id,
    player_url: `${baseUrl}/player/${session.id}`,
    embed_url: `${baseUrl}/player/${session.id}?embed=1`,
    title: session.title,
    aspect_ratio: session.aspect_ratio,
    created_at: new Date(session.created_at).toISOString(),
  });
}

// ── Tool 2: add_scene ─────────────────────────────────────────────────

export async function handleAddScene(
  args: { session_id: string; visual_script: any },
  deps: SceneDeps,
): Promise<McpToolContent> {
  const { session_id, visual_script } = args;
  const { store, sse } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  store.setScript(session_id, visual_script);

  sse.emit(session_id, { type: 'script_update', script: visual_script });

  return mcpOk({
    session_id,
    frame_count: visual_script.frames.length,
    total_duration_ms: visual_script.totalDuration,
    updated_at: new Date().toISOString(),
  });
}

// ── Tool 3: update_scene ──────────────────────────────────────────────

export async function handleUpdateScene(
  args: { session_id: string; visual_script: any },
  deps: SceneDeps,
): Promise<McpToolContent> {
  const { session_id, visual_script } = args;
  const { store, sse } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  store.setScript(session_id, visual_script);

  sse.emit(session_id, { type: 'script_update', script: visual_script });

  return mcpOk({
    session_id,
    frame_count: visual_script.frames.length,
    total_duration_ms: visual_script.totalDuration,
    updated_at: new Date().toISOString(),
  });
}

// ── Tool 4: add_narration ─────────────────────────────────────────────

export async function handleAddNarration(
  args: { session_id: string; text: string; frame_index?: number },
  deps: SceneDeps,
): Promise<McpToolContent> {
  const { session_id, text, frame_index = 0 } = args;
  const { store, sse } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  // Validate frame_index only if a script exists
  if (session.script && frame_index >= session.script.frames.length) {
    return mcpErr(
      'FRAME_NOT_FOUND',
      `frame_index ${frame_index} is out of range. Script has ${session.script.frames.length} frames.`,
      `Use frame_index 0–${session.script.frames.length - 1}.`,
    );
  }

  const result = store.addNarration(session_id, text, frame_index);

  sse.emit(session_id, {
    type: 'narration_update',
    narrationId: result.narration_id,
    text,
    frame_index,
  });

  return mcpOk({
    narration_id: result.narration_id,
    session_id,
    frame_index,
    text_length: result.text_length,
    created_at: new Date(result.created_at).toISOString(),
  });
}

// ── Tool 5: get_session_url ───────────────────────────────────────────

export async function handleGetSessionUrl(
  args: { session_id: string; include_stats?: boolean },
  deps: SessionUrlDeps,
): Promise<McpToolContent> {
  const { session_id, include_stats = false } = args;
  const { store, baseUrl } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  const data: Record<string, unknown> = {
    session_id,
    player_url: `${baseUrl}/player/${session_id}`,
    embed_url: `${baseUrl}/player/${session_id}?embed=1`,
  };

  if (include_stats) {
    data.title = session.title;
    data.aspect_ratio = session.aspect_ratio;
    data.frame_count = session.script?.frames?.length ?? 0;
    data.total_duration_ms = session.script?.totalDuration ?? 0;
    data.created_at = new Date(session.created_at).toISOString();
  }

  return mcpOk(data);
}
