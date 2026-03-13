import { describe, it, expect } from 'vitest';
import { diagnoseJsonError, formatDiagnosticConsole, formatDiagnosticMcp, safeParseJson } from './json-diagnostic.js';

describe('diagnoseJsonError', () => {
  it('detects missing comma between array elements', () => {
    const json = '{"f":[{"e":1}{"e":2}]}';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      expect(d.line).toBe(1);
      expect(d.problem).toMatch(/comma|array/i);
      expect(d.suggestion).toMatch(/comma|array/i);
    }
  });

  it('detects single quotes', () => {
    const json = "{'name': 'test'}";
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      expect(d.suggestion).toMatch(/double quotes/i);
    }
  });

  it('detects truncated JSON', () => {
    const json = '{"frames":[{"entities":[{"type":"Server"';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      expect(d.problem).toMatch(/truncat/i);
      expect(d.suggestion).toMatch(/cut off|token limit/i);
    }
  });

  it('reports correct line number for multiline JSON', () => {
    const json = '{\n  "a": 1\n  "b": 2\n}'; // missing comma on line 2
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      expect(d.line).toBeGreaterThanOrEqual(2);
    }
  });

  it('detects missing comma between properties', () => {
    const json = '{"a": 1 "b": 2}';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      expect(d.problem).toMatch(/comma|propert/i);
    }
  });

  it('includes context snippet around the error', () => {
    const json = '{"name": "hello" "age": 5}';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      expect(d.context).toBeTruthy();
      expect(d.context.length).toBeGreaterThan(10);
      expect(d.context).toContain('^^^');
    }
  });
});

describe('formatDiagnosticConsole', () => {
  it('produces readable multi-line output', () => {
    const json = '{"a": 1 "b": 2}';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      const output = formatDiagnosticConsole(d);
      expect(output).toContain('🔍');
      expect(output).toContain('Where:');
      expect(output).toContain('Problem:');
      expect(output).toContain('Fix:');
      expect(output).toContain('Context:');
    }
  });

  it('supports custom indent', () => {
    const json = '{"a": 1 "b": 2}';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      const output = formatDiagnosticConsole(d, '  ');
      expect(output).toMatch(/^ {2}🔍/m);
    }
  });
});

describe('formatDiagnosticMcp', () => {
  it('produces concise agent-facing output', () => {
    const json = '{"a": 1 "b": 2}';
    try { JSON.parse(json); } catch (err) {
      const d = diagnoseJsonError(json, err);
      const output = formatDiagnosticMcp(d);
      expect(output).toContain('Problem:');
      expect(output).toContain('How to fix:');
      // Should NOT have the tree drawing characters (those are for console)
      expect(output).not.toContain('├─');
    }
  });
});

describe('safeParseJson', () => {
  it('returns ok: true for valid JSON', () => {
    const result = safeParseJson('{"a": 1}');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ a: 1 });
    }
  });

  it('returns ok: false with diagnostic for invalid JSON', () => {
    const result = safeParseJson('{"a": 1 "b": 2}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.problem).toBeTruthy();
      expect(result.diagnostic.suggestion).toBeTruthy();
      expect(result.diagnostic.line).toBeGreaterThanOrEqual(1);
    }
  });

  it('handles empty string', () => {
    const result = safeParseJson('');
    expect(result.ok).toBe(false);
  });

  it('handles narration with unescaped quotes', () => {
    const json = '{"n": "He said "hello" to her"}';
    const result = safeParseJson(json);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.diagnostic.suggestion).toBeTruthy();
    }
  });
});
