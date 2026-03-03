/**
 * @preplai/player — player-bridge tests (TDD: RED phase)
 *
 * Tests for SSE event handling, postMessage bridge, and session ID resolution.
 * Uses jsdom environment with mocked EventSource and postMessage.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveSessionId,
  createSSEHandler,
  createPostMessageBridge,
  type SSEHandlerCallbacks,
  type PostMessageBridgeCallbacks,
} from './player-bridge.js';

// ═══════════════════════════════════════════════════════════════════════
// resolveSessionId
// ═══════════════════════════════════════════════════════════════════════

describe('resolveSessionId', () => {
  beforeEach(() => {
    document.body.removeAttribute('data-session-id');
    // Reset location to default
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/', href: 'http://localhost/' },
      writable: true,
    });
  });

  it('should resolve from body data-session-id attribute first', () => {
    document.body.setAttribute('data-session-id', 'body-session-123');
    const result = resolveSessionId();
    expect(result).toBe('body-session-123');
  });

  it('should resolve from URL search parameter ?session=...', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '?session=url-session-456', pathname: '/', href: 'http://localhost/?session=url-session-456' },
      writable: true,
    });
    const result = resolveSessionId();
    expect(result).toBe('url-session-456');
  });

  it('should resolve from URL path segment as last resort', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/player/path-session-789', href: 'http://localhost/player/path-session-789' },
      writable: true,
    });
    const result = resolveSessionId();
    expect(result).toBe('path-session-789');
  });

  it('should return null when no session ID is found', () => {
    Object.defineProperty(window, 'location', {
      value: { search: '', pathname: '/', href: 'http://localhost/' },
      writable: true,
    });
    const result = resolveSessionId();
    expect(result).toBeNull();
  });

  it('should prefer body attribute over URL parameter', () => {
    document.body.setAttribute('data-session-id', 'body-first');
    Object.defineProperty(window, 'location', {
      value: { search: '?session=url-second', pathname: '/player/path-third', href: 'http://localhost/?session=url-second' },
      writable: true,
    });
    const result = resolveSessionId();
    expect(result).toBe('body-first');
  });
});


// ═══════════════════════════════════════════════════════════════════════
// createSSEHandler
// ═══════════════════════════════════════════════════════════════════════

describe('createSSEHandler', () => {
  let callbacks: SSEHandlerCallbacks;

  beforeEach(() => {
    callbacks = {
      onScriptUpdate: vi.fn(),
      onSeek: vi.fn(),
      onEntityPatch: vi.fn(),
      onClear: vi.fn(),
      onConnectionChange: vi.fn(),
    };
  });

  it('should return a handler map with all expected event types', () => {
    const handler = createSSEHandler(callbacks);

    expect(handler).toHaveProperty('script_update');
    expect(handler).toHaveProperty('seek');
    expect(handler).toHaveProperty('entity_patch');
    expect(handler).toHaveProperty('clear');
  });

  it('should parse script_update and call onScriptUpdate', () => {
    const handler = createSSEHandler(callbacks);
    const mockScript = { sceneId: 'test', frames: [], totalDuration: 0 };

    handler.script_update(JSON.stringify({ script: mockScript }));

    expect(callbacks.onScriptUpdate).toHaveBeenCalledWith(mockScript);
  });

  it('should parse seek and call onSeek with frameIndex', () => {
    const handler = createSSEHandler(callbacks);

    handler.seek(JSON.stringify({ frameIndex: 3 }));

    expect(callbacks.onSeek).toHaveBeenCalledWith(3);
  });

  it('should parse entity_patch and call onEntityPatch', () => {
    const handler = createSSEHandler(callbacks);

    handler.entity_patch(JSON.stringify({ entityId: 'srv', patch: { label: 'New' } }));

    expect(callbacks.onEntityPatch).toHaveBeenCalledWith('srv', { label: 'New' });
  });

  it('should call onClear for clear events', () => {
    const handler = createSSEHandler(callbacks);

    handler.clear('');

    expect(callbacks.onClear).toHaveBeenCalled();
  });

  it('should handle malformed JSON gracefully', () => {
    const handler = createSSEHandler(callbacks);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    handler.script_update('not valid json{');

    expect(callbacks.onScriptUpdate).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});


// ═══════════════════════════════════════════════════════════════════════
// createPostMessageBridge
// ═══════════════════════════════════════════════════════════════════════

describe('createPostMessageBridge', () => {
  let bridgeCallbacks: PostMessageBridgeCallbacks;
  let cleanup: () => void;

  beforeEach(() => {
    bridgeCallbacks = {
      onSeek: vi.fn(),
      onPause: vi.fn(),
      onResume: vi.fn(),
      onLoadScript: vi.fn(),
    };
    cleanup = createPostMessageBridge(bridgeCallbacks, 'https://pre.app');
  });

  afterEach(() => {
    cleanup();
  });

  it('should handle seek messages from allowed origin', () => {
    const event = new MessageEvent('message', {
      data: { type: 'seek', frameIndex: 5 },
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    expect(bridgeCallbacks.onSeek).toHaveBeenCalledWith(5);
  });

  it('should handle pause messages', () => {
    const event = new MessageEvent('message', {
      data: { type: 'pause' },
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    expect(bridgeCallbacks.onPause).toHaveBeenCalled();
  });

  it('should handle resume messages', () => {
    const event = new MessageEvent('message', {
      data: { type: 'resume' },
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    expect(bridgeCallbacks.onResume).toHaveBeenCalled();
  });

  it('should handle load-script messages', () => {
    const script = { sceneId: 'test', frames: [], totalDuration: 0 };
    const event = new MessageEvent('message', {
      data: { type: 'load-script', script },
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    expect(bridgeCallbacks.onLoadScript).toHaveBeenCalledWith(script);
  });

  it('should ignore messages from disallowed origins', () => {
    const event = new MessageEvent('message', {
      data: { type: 'seek', frameIndex: 5 },
      origin: 'https://evil.com',
    });
    window.dispatchEvent(event);

    expect(bridgeCallbacks.onSeek).not.toHaveBeenCalled();
  });

  it('should ignore messages with unknown types', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const event = new MessageEvent('message', {
      data: { type: 'unknown-action' },
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('unknown-action'),
    );
    consoleSpy.mockRestore();
  });

  it('should ignore messages with null/undefined data', () => {
    const event = new MessageEvent('message', {
      data: null,
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    // Should not throw
    expect(bridgeCallbacks.onSeek).not.toHaveBeenCalled();
  });

  it('should clean up listener on dispose', () => {
    cleanup();

    const event = new MessageEvent('message', {
      data: { type: 'pause' },
      origin: 'https://pre.app',
    });
    window.dispatchEvent(event);

    expect(bridgeCallbacks.onPause).not.toHaveBeenCalled();
  });
});
