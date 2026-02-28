/**
 * @pre/mcp-server — Error Helper Tests (TDD)
 *
 * Tests for MCP tool result formatting helpers.
 */
import { describe, it, expect } from 'vitest';
import { mcpOk, mcpErr, mcpNotFound, mcpValidationError, withErrorBoundary } from './errors.js';

describe('Error helpers', () => {

  // ── mcpOk ───────────────────────────────────────────────────────
  describe('mcpOk', () => {
    it('wraps data in MCP content format', () => {
      const result = mcpOk({ session_id: 'abc', title: 'Test' });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
      expect(parsed.data.session_id).toBe('abc');
    });

    it('serializes nested objects', () => {
      const result = mcpOk({ nested: { deep: [1, 2, 3] } });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.data.nested.deep).toEqual([1, 2, 3]);
    });
  });

  // ── mcpErr ──────────────────────────────────────────────────────
  describe('mcpErr', () => {
    it('formats structured error response', () => {
      const result = mcpErr('VALIDATION_ERROR', 'Bad input', 'Fix it');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      expect(parsed.error.message).toBe('Bad input');
      expect(parsed.error.suggestion).toBe('Fix it');
    });
  });

  // ── mcpNotFound ─────────────────────────────────────────────────
  describe('mcpNotFound', () => {
    it('returns SESSION_NOT_FOUND error with session ID', () => {
      const result = mcpNotFound('abc-123');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('SESSION_NOT_FOUND');
      expect(parsed.error.message).toContain('abc-123');
      expect(parsed.error.suggestion).toBeTruthy();
    });
  });

  // ── mcpValidationError ──────────────────────────────────────────
  describe('mcpValidationError', () => {
    it('formats Zod-like issues into a message', () => {
      const issues = [
        { path: ['position', 'x'], message: 'Too large' },
        { path: ['title'], message: 'Required' },
      ];
      const result = mcpValidationError(issues);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      expect(parsed.error.message).toContain('position.x: Too large');
      expect(parsed.error.message).toContain('title: Required');
    });

    it('handles empty issues array', () => {
      const result = mcpValidationError([]);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── withErrorBoundary ───────────────────────────────────────────
  describe('withErrorBoundary', () => {
    it('passes through successful handler result', async () => {
      const handler = async () => mcpOk({ done: true });
      const wrapped = withErrorBoundary(handler);
      const result = await wrapped({ foo: 'bar' });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it('catches thrown errors and returns INTERNAL_ERROR', async () => {
      const handler = async () => { throw new Error('boom'); };
      const wrapped = withErrorBoundary(handler);
      const result = await wrapped({});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INTERNAL_ERROR');
      expect(parsed.error.message).toContain('boom');
    });

    it('handles non-Error throws', async () => {
      const handler = async () => { throw 'string error'; };
      const wrapped = withErrorBoundary(handler);
      const result = await wrapped({});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(false);
      expect(parsed.error.code).toBe('INTERNAL_ERROR');
    });
  });
});
