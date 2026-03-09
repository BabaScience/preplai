/**
 * @preplai/mcp-server — MCP Tool Handlers
 *
 * Pure handler functions for all 5 MCP tools.
 * Dependencies (store, sse, baseUrl) are injected, enabling unit testing.
 */
import { stage0Expand } from '@preplai/compiler';
import type { SessionStore } from './session-store.js';
import type { SseRegistry } from './sse.js';
import type { TtsService } from './tts-service.js';
import { getUserPlayerPrefs, buildPlayerUrlSuffix } from './auth.js';
import { mcpOk, mcpNotFound, mcpErr, mcpValidationError, type McpToolContent } from './errors.js';
import { getIllustrationsReference, type IllustrationsReference } from './illustrations-reference.js';

// ── Dependency injection interfaces ───────────────────────────────────

interface CreateSessionDeps {
  store: SessionStore;
  baseUrl: string;
}

interface SceneDeps {
  store: SessionStore;
  sse: SseRegistry;
  ttsService?: TtsService;
}

interface SessionUrlDeps {
  store: SessionStore;
  baseUrl: string;
  apiKeyId?: string;
}

// ── Validation helpers ────────────────────────────────────────────────

/** Structural validation before compile. Returns error message or null if valid. */
function validateVisualScriptStructure(visual_script: any): string | null {
  if (!visual_script || typeof visual_script !== 'object') {
    return 'visual_script must be an object with { sceneId, frames, totalDuration }';
  }
  if (!visual_script.frames || !Array.isArray(visual_script.frames)) {
    return 'visual_script.frames must be an array of IllustrationFrame objects. Example: { "sceneId": "scene-1", "frames": [{ "id": "frame-1", "startTime": 0, "endTime": 5000, "entities": [...], "narrationSegment": "...", "description": "..." }], "totalDuration": 5000 }';
  }
  if (visual_script.frames.length === 0) {
    return 'visual_script.frames must contain at least one frame';
  }
  if (typeof visual_script.totalDuration !== 'number') {
    return 'visual_script.totalDuration must be a number (milliseconds)';
  }
  if (!visual_script.sceneId || typeof visual_script.sceneId !== 'string') {
    return 'visual_script.sceneId must be a string, e.g. "scene-1"';
  }
  // Validate each frame has at least the required fields
  for (let i = 0; i < visual_script.frames.length; i++) {
    const frame = visual_script.frames[i];
    if (!frame.id) {
      return `frames[${i}].id is required (e.g. "frame-1")`;
    }
    if (!Array.isArray(frame.entities)) {
      return `frames[${i}].entities must be an array of VisualEntity objects`;
    }
    if (typeof frame.startTime !== 'number') {
      return `frames[${i}].startTime must be a number (ms)`;
    }
    if (typeof frame.endTime !== 'number') {
      return `frames[${i}].endTime must be a number (ms)`;
    }
  }
  return null; // valid
}

function logCreateSession(obj: {
  sessionId: string;
  prefs: { theme: string; palette: string };
  theme: string;
  palette: string;
  styleOverride: boolean;
  suffix: string;
}): void {
  if (process.env.NODE_ENV === 'production') return;
  const line = JSON.stringify({
    level: 'info',
    msg: 'create_session player prefs',
    ...obj,
    time: Date.now(),
  });
  process.stderr.write(line + '\n');
}

// ── Tool 1: create_session ────────────────────────────────────────────

export async function handleCreateSession(
  args: { title: string; aspect_ratio?: string; style?: 'cinema' | 'minimal'; _apiKeyId?: string },
  deps: CreateSessionDeps,
): Promise<McpToolContent> {
  const { title, aspect_ratio = '16:9', style, _apiKeyId } = args;
  const { store, baseUrl } = deps;

  const session = await store.createSession(title, aspect_ratio, _apiKeyId ?? null);

  // Use user's saved preferences; agent's style param overrides theme when provided
  const prefs = await getUserPlayerPrefs(_apiKeyId);
  const theme = style ?? prefs.theme;
  const palette = prefs.palette;
  const suffix = buildPlayerUrlSuffix(theme, palette);
  const embedSuffix = suffix ? `?embed=1&${suffix.slice(1)}` : '?embed=1';

  logCreateSession({ sessionId: session.id, prefs, theme, palette, styleOverride: style != null, suffix });

  const themeResolved = style ?? prefs.theme;
  const paletteResolved = prefs.palette;

  // Include illustrations reference so agent discovers types + metadata in one call
  const illustrations = getIllustrationsReference();

  return mcpOk({
    session_id: session.id,
    player_url: `${baseUrl}/player/${session.id}${suffix}`,
    embed_url: `${baseUrl}/player/${session.id}${embedSuffix}`,
    title: session.title,
    aspect_ratio: session.aspect_ratio,
    created_at: new Date(session.created_at).toISOString(),
    preferences: {
      theme: themeResolved,
      palette: paletteResolved,
    },
    illustrations,
  });
}

// ── Tool 2: get_preferences ────────────────────────────────────────────

interface GetPreferencesDeps {
  apiKeyId?: string;
}

export async function handleGetPreferences(
  args: { _apiKeyId?: string },
  deps: GetPreferencesDeps,
): Promise<McpToolContent> {
  const { _apiKeyId } = args;
  const apiKeyId = _apiKeyId ?? deps.apiKeyId;
  const prefs = await getUserPlayerPrefs(apiKeyId);
  return mcpOk({
    theme: prefs.theme,
    palette: prefs.palette,
  });
}

// ── Tool: get_illustrations ────────────────────────────────────────────

export async function handleGetIllustrations(): Promise<McpToolContent> {
  const data = getIllustrationsReference();
  return mcpOk({ ...data });
}

// ── Tool 3: add_scene ─────────────────────────────────────────────────

export async function handleAddScene(
  args: { session_id: string; visual_script: any },
  deps: SceneDeps,
): Promise<McpToolContent> {
  const { session_id, visual_script } = args;
  const { store, sse } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  // Expand compact format (short keys, aliases) before validation
  const expandResult = stage0Expand(visual_script);
  if (!expandResult.ok) {
    const firstError = expandResult.errors[0];
    return mcpValidationError(firstError?.message ?? 'Invalid visual_script structure.');
  }
  const expandedScript = expandResult.expanded as any;

  // Validate visual_script structure
  const validationError = validateVisualScriptStructure(expandedScript);
  if (validationError) {
    return mcpValidationError(validationError);
  }

  // Merge: append new frames to existing script (if any)
  let mergedScript: any;
  if (session.script && session.script.frames && session.script.frames.length > 0) {
    const existingFrames = session.script.frames;
    const existingDuration = session.script.totalDuration || 0;

    // Offset the new frames' startTime/endTime so they continue after the existing ones
    const offsetFrames = expandedScript.frames.map((f: any) => ({
      ...f,
      startTime: f.startTime + existingDuration,
      endTime: f.endTime + existingDuration,
    }));

    mergedScript = {
      ...session.script,
      frames: [...existingFrames, ...offsetFrames],
      totalDuration: existingDuration + expandedScript.totalDuration,
      style: expandedScript.style ?? session.script?.style,
    };
  } else {
    // First scene — no merge needed
    mergedScript = expandedScript;
  }

  await store.setScript(session_id, mergedScript);

  sse.emit(session_id, { type: 'script_update', script: mergedScript });

  // Fire-and-forget: generate ElevenLabs TTS audio for new frames
  const startIndex = session.script?.frames?.length ?? 0;
  const hasNarration = mergedScript.frames.slice(startIndex).some(
    (f: any) => f.narrationSegment?.trim(),
  );
  const audioStatus = deps.ttsService && hasNarration ? 'generating' : 'unavailable';
  if (deps.ttsService && hasNarration) {
    deps.ttsService.generateForFrames(session_id, mergedScript.frames, startIndex);
  }

  return mcpOk({
    session_id,
    frame_count: mergedScript.frames.length,
    total_duration_ms: mergedScript.totalDuration,
    entity_count: mergedScript.frames.reduce(
      (sum: number, f: any) => sum + (f.entities?.length ?? 0), 0
    ),
    audio_status: audioStatus,
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

  // Expand compact format before validation
  const expandResult = stage0Expand(visual_script);
  if (!expandResult.ok) {
    const firstError = expandResult.errors[0];
    return mcpValidationError(firstError?.message ?? 'Invalid visual_script structure.');
  }
  const expandedScript = expandResult.expanded as any;

  // Validate visual_script structure
  const validationError = validateVisualScriptStructure(expandedScript);
  if (validationError) {
    return mcpValidationError(validationError);
  }

  await store.setScript(session_id, expandedScript);

  sse.emit(session_id, { type: 'script_update', script: expandedScript });

  // Fire-and-forget: generate ElevenLabs TTS audio for all frames (replace mode)
  const hasNarration = expandedScript.frames.some(
    (f: any) => f.narrationSegment?.trim(),
  );
  const audioStatus = deps.ttsService && hasNarration ? 'generating' : 'unavailable';
  if (deps.ttsService && hasNarration) {
    deps.ttsService.generateForFrames(session_id, expandedScript.frames, 0);
  }

  return mcpOk({
    session_id,
    frame_count: expandedScript.frames.length,
    total_duration_ms: expandedScript.totalDuration,
    entity_count: expandedScript.frames.reduce(
      (sum: number, f: any) => sum + (f.entities?.length ?? 0), 0
    ),
    audio_status: audioStatus,
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

  const result = await store.addNarration(session_id, text, frame_index);

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
  const { store, baseUrl, apiKeyId } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  const prefs = await getUserPlayerPrefs(apiKeyId);
  const suffix = buildPlayerUrlSuffix(prefs.theme, prefs.palette);
  const embedSuffix = suffix ? `?embed=1&${suffix.slice(1)}` : '?embed=1';

  const data: Record<string, unknown> = {
    session_id,
    player_url: `${baseUrl}/player/${session_id}${suffix}`,
    embed_url: `${baseUrl}/player/${session_id}${embedSuffix}`,
    preferences: {
      theme: prefs.theme,
      palette: prefs.palette,
    },
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

// ── Tool 6: list_sessions ─────────────────────────────────────────────

export async function handleListSessions(
  args: { limit?: number },
  deps: { store: SessionStore; baseUrl: string; apiKeyId?: string },
): Promise<McpToolContent> {
  const { limit = 20 } = args;
  const { store, baseUrl, apiKeyId } = deps;

  const sessions = (apiKeyId ? store.listSessionsByKey(apiKeyId) : store.listSessions())
    .slice(0, Math.min(limit, 100));

  const prefs = await getUserPlayerPrefs(apiKeyId);
  const suffix = buildPlayerUrlSuffix(prefs.theme, prefs.palette);

  return mcpOk({
    sessions: sessions.map(s => ({
      session_id: s.id,
      title: s.title,
      player_url: `${baseUrl}/player/${s.id}${suffix}`,
      frame_count: s.script?.frames?.length ?? 0,
      created_at: new Date(s.created_at).toISOString(),
    })),
    total: sessions.length,
  });
}

// ── Tool 8: remove_scene ─────────────────────────────────────────────

export async function handleRemoveScene(
  args: { session_id: string; frame_indices?: number[]; last_n?: number },
  deps: SceneDeps,
): Promise<McpToolContent> {
  const { session_id, frame_indices, last_n } = args;
  const { store, sse } = deps;

  const session = store.getSession(session_id);
  if (!session) return mcpNotFound(session_id);

  if (!session.script || !session.script.frames || session.script.frames.length === 0) {
    return mcpErr(
      'NO_FRAMES',
      'Session has no frames to remove.',
      'Add scenes first with add_scene.',
    );
  }

  let newFrames = [...session.script.frames];
  let removedCount = 0;

  if (frame_indices && frame_indices.length > 0) {
    // Remove specific frames by index (descending order to preserve indices during splice)
    const sorted = [...frame_indices].sort((a, b) => b - a);
    for (const idx of sorted) {
      if (idx >= 0 && idx < newFrames.length) {
        newFrames.splice(idx, 1);
        removedCount++;
      }
    }
  } else if (last_n && last_n > 0) {
    // Remove last N frames
    const toRemove = Math.min(last_n, newFrames.length);
    newFrames = newFrames.slice(0, newFrames.length - toRemove);
    removedCount = toRemove;
  } else {
    // Remove all frames
    removedCount = newFrames.length;
    newFrames = [];
  }

  // Recalculate totalDuration from remaining frames
  const totalDuration = newFrames.length > 0
    ? Math.max(...newFrames.map((f: any) => f.endTime || 0))
    : 0;

  const updatedScript = {
    ...session.script,
    frames: newFrames,
    totalDuration,
  };

  await store.setScript(session_id, updatedScript);

  // Push SSE update so player reflects the removal immediately
  sse.emit(session_id, { type: 'script_update', script: updatedScript });

  return mcpOk({
    session_id,
    removed_count: removedCount,
    remaining_frames: newFrames.length,
    total_duration_ms: totalDuration,
  });
}

// ── Tool 7: delete_session ────────────────────────────────────────────

export async function handleDeleteSession(
  args: { session_id: string },
  deps: { store: SessionStore; audioStore?: import('./audio-store.js').AudioStore },
): Promise<McpToolContent> {
  const { session_id } = args;
  const { store, audioStore } = deps;

  const existed = await store.deleteSession(session_id);
  if (!existed) return mcpNotFound(session_id);

  // Clean up audio buffers for this session
  if (audioStore) {
    audioStore.deleteSession(session_id);
  }

  return mcpOk({
    session_id,
    deleted: true,
  });
}
