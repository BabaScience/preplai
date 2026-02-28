/**
 * @pre/mcp-server — SSE Emit Tests (TDD)
 *
 * Tests for SSE subscriber registry and emit helper.
 * Uses mock reply objects to simulate Fastify SSE responses.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SseRegistry } from './sse.js';

/** Minimal mock of a Fastify reply's raw stream for SSE testing */
function createMockReply() {
  const chunks: string[] = [];
  return {
    raw: {
      write: vi.fn((data: string) => { chunks.push(data); return true; }),
    },
    _chunks: chunks,
  };
}

describe('SseRegistry', () => {
  let registry: SseRegistry;

  beforeEach(() => {
    registry = new SseRegistry();
  });

  // ── Subscribe / Unsubscribe ─────────────────────────────────────
  describe('subscribe + unsubscribe', () => {
    it('adds a subscriber for a session', () => {
      const reply = createMockReply();
      registry.subscribe('session-1', reply as any);
      expect(registry.subscriberCount('session-1')).toBe(1);
    });

    it('allows multiple subscribers per session', () => {
      const r1 = createMockReply();
      const r2 = createMockReply();
      registry.subscribe('session-1', r1 as any);
      registry.subscribe('session-1', r2 as any);
      expect(registry.subscriberCount('session-1')).toBe(2);
    });

    it('unsubscribe removes a subscriber', () => {
      const reply = createMockReply();
      registry.subscribe('session-1', reply as any);
      registry.unsubscribe('session-1', reply as any);
      expect(registry.subscriberCount('session-1')).toBe(0);
    });

    it('unsubscribe is safe for unknown session', () => {
      const reply = createMockReply();
      expect(() => registry.unsubscribe('unknown', reply as any)).not.toThrow();
    });

    it('subscriberCount returns 0 for unknown session', () => {
      expect(registry.subscriberCount('unknown')).toBe(0);
    });
  });

  // ── Emit ────────────────────────────────────────────────────────
  describe('emit', () => {
    it('sends JSON data to all subscribers of a session', () => {
      const r1 = createMockReply();
      const r2 = createMockReply();
      registry.subscribe('s1', r1 as any);
      registry.subscribe('s1', r2 as any);

      registry.emit('s1', { type: 'script_update', script: {} });

      expect(r1.raw.write).toHaveBeenCalledOnce();
      expect(r2.raw.write).toHaveBeenCalledOnce();
      // Verify SSE format: "data: <JSON>\n\n"
      const written = r1._chunks[0];
      expect(written).toMatch(/^data: \{.*\}\n\n$/);
      const parsed = JSON.parse(written.replace('data: ', '').trim());
      expect(parsed.type).toBe('script_update');
    });

    it('does nothing when no subscribers exist', () => {
      // Should not throw
      expect(() => registry.emit('no-session', { type: 'test' })).not.toThrow();
    });

    it('removes subscriber when write throws', () => {
      const badReply = {
        raw: { write: vi.fn(() => { throw new Error('closed'); }) },
      };
      const goodReply = createMockReply();

      registry.subscribe('s1', badReply as any);
      registry.subscribe('s1', goodReply as any);

      // Emit should not throw even with bad subscriber
      registry.emit('s1', { type: 'test' });

      // Bad subscriber should have been removed
      expect(registry.subscriberCount('s1')).toBe(1);
      // Good subscriber should have received the event
      expect(goodReply.raw.write).toHaveBeenCalledOnce();
    });

    it('does not send to subscribers of other sessions', () => {
      const r1 = createMockReply();
      const r2 = createMockReply();
      registry.subscribe('s1', r1 as any);
      registry.subscribe('s2', r2 as any);

      registry.emit('s1', { type: 'test' });

      expect(r1.raw.write).toHaveBeenCalledOnce();
      expect(r2.raw.write).not.toHaveBeenCalled();
    });
  });
});
