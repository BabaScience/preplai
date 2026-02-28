/**
 * @pre/player — Player Bridge
 *
 * Handles SSE event dispatching, postMessage bridge for iframe embed,
 * and session ID resolution. No direct DOM manipulation — delegates to
 * SceneController and NarratorController via callbacks.
 */
import type { VisualScript } from '@pre/shared';

// ── Session ID Resolution ────────────────────────────────────────────

/**
 * Resolve the session ID from multiple sources (priority order):
 * 1. `data-session-id` attribute on `<body>`
 * 2. URL search parameter `?session=...`
 * 3. Last path segment of the URL
 *
 * @returns The session ID string, or null if not found
 */
export function resolveSessionId(): string | null {
  // 1. Body attribute
  const bodyAttr = document.body?.getAttribute('data-session-id');
  if (bodyAttr) return bodyAttr;

  // 2. URL search parameter
  const searchParams = new URLSearchParams(window.location.search);
  const sessionParam = searchParams.get('session');
  if (sessionParam) return sessionParam;

  // 3. Last path segment
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const lastSegment = pathParts[pathParts.length - 1];
  if (lastSegment && lastSegment !== '') return lastSegment;

  return null;
}


// ── SSE Event Handler ────────────────────────────────────────────────

export interface SSEHandlerCallbacks {
  onScriptUpdate: (script: VisualScript) => void;
  onSeek: (frameIndex: number) => void;
  onEntityPatch: (entityId: string, patch: Record<string, unknown>) => void;
  onClear: () => void;
  onConnectionChange?: (status: 'connected' | 'reconnecting' | 'error') => void;
}

/**
 * Create a map of SSE event name → handler function.
 * Each handler parses JSON data and delegates to the appropriate callback.
 */
export function createSSEHandler(
  callbacks: SSEHandlerCallbacks,
): Record<string, (data: string) => void> {
  return {
    script_update(data: string) {
      try {
        const { script } = JSON.parse(data);
        callbacks.onScriptUpdate(script);
      } catch (err) {
        console.warn('[SSE] Failed to parse script_update:', err);
      }
    },

    seek(data: string) {
      try {
        const { frameIndex } = JSON.parse(data);
        callbacks.onSeek(frameIndex);
      } catch (err) {
        console.warn('[SSE] Failed to parse seek:', err);
      }
    },

    entity_patch(data: string) {
      try {
        const { entityId, patch } = JSON.parse(data);
        callbacks.onEntityPatch(entityId, patch);
      } catch (err) {
        console.warn('[SSE] Failed to parse entity_patch:', err);
      }
    },

    clear(_data: string) {
      callbacks.onClear();
    },
  };
}


// ── PostMessage Bridge ───────────────────────────────────────────────

export interface PostMessageBridgeCallbacks {
  onSeek: (frameIndex: number) => void;
  onPause: () => void;
  onResume: () => void;
  onLoadScript: (script: VisualScript) => void;
}

/**
 * Create a postMessage listener for iframe-hosted players.
 * Returns a cleanup function to remove the listener.
 *
 * @param callbacks    Handler functions for each message type
 * @param allowedOrigin  The trusted origin to accept messages from
 * @returns A cleanup function to call on dispose
 */
export function createPostMessageBridge(
  callbacks: PostMessageBridgeCallbacks,
  allowedOrigin: string,
): () => void {
  const handler = (e: MessageEvent) => {
    // Security: only accept messages from known origin
    if (e.origin !== allowedOrigin) return;

    const data = e.data;
    if (!data || typeof data !== 'object') return;

    const { type, ...payload } = data;

    switch (type) {
      case 'seek':
        if (typeof payload.frameIndex === 'number') {
          callbacks.onSeek(payload.frameIndex);
        }
        break;

      case 'pause':
        callbacks.onPause();
        break;

      case 'resume':
        callbacks.onResume();
        break;

      case 'load-script':
        if (payload.script) {
          callbacks.onLoadScript(payload.script);
        }
        break;

      default:
        console.warn(`[postMessage] Unknown message type: "${type}"`);
    }
  };

  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler);
  };
}


// ── Emit to Parent ───────────────────────────────────────────────────

/**
 * Emit a player event to the host page (parent iframe).
 */
export function emitToParent(
  type: string,
  payload: Record<string, unknown> = {},
  targetOrigin: string = 'https://pre.app',
): void {
  if (window.parent !== window) {
    window.parent.postMessage({ type, payload }, targetOrigin);
  }
}
