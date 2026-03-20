/**
 * @preplai/mcp-server — Illustrations Reference Tests
 *
 * Tests the getIllustrationsReference() function that provides
 * agent discovery data for composable shapes, icons, and metadata.
 */
import { describe, it, expect } from 'vitest';
import { getIllustrationsReference } from './illustrations-reference.js';
import type { IllustrationsReference } from './illustrations-reference.js';

describe('getIllustrationsReference', () => {
  let ref: IllustrationsReference;

  // Call once — it's a pure function with no side effects
  ref = getIllustrationsReference();

  it('should return composableShapes array', () => {
    expect(ref.composableShapes).toBeDefined();
    expect(Array.isArray(ref.composableShapes)).toBe(true);
  });

  it('should return composableIcons object', () => {
    expect(ref.composableIcons).toBeDefined();
    expect(typeof ref.composableIcons).toBe('object');
  });

  it('should have 15 composable shapes', () => {
    expect(ref.composableShapes).toHaveLength(15);
  });

  it('should have multiple icon categories', () => {
    const categories = Object.keys(ref.composableIcons);
    expect(categories.length).toBeGreaterThan(3);
  });

  it('should include expected shape names', () => {
    const expected = ['rect', 'circle', 'hexagon', 'diamond', 'shield', 'cylinder', 'document'];
    for (const shape of expected) {
      expect(ref.composableShapes, `Missing shape: ${shape}`).toContain(shape);
    }
  });

  it('should include expected icon categories', () => {
    const expected = ['finance', 'business', 'tech', 'healthcare'];
    for (const cat of expected) {
      expect(ref.composableIcons[cat], `Missing icon category: ${cat}`).toBeDefined();
    }
  });

  it('should have Composable metadata hint in metadataHints', () => {
    expect(ref.metadataHints['Composable']).toBeDefined();
    expect(typeof ref.metadataHints['Composable']).toBe('string');
    expect(ref.metadataHints['Composable'].length).toBeGreaterThan(0);
  });

  it('should have Composable in entityTypes', () => {
    expect(ref.entityTypes).toContain('Composable');
  });

  it('should have Finance topic hints that reference Composable', () => {
    // Find a finance-related topic hint
    const financeKey = Object.keys(ref.topicHints).find(
      (k) => k.includes('fund') || k.includes('capital') || k.includes('portfolio'),
    );
    expect(financeKey, 'Should have a finance-related topic key').toBeDefined();
    expect(ref.topicHints[financeKey!]).toContain('Composable');
  });

  it('should return positionFormat and defaultSize', () => {
    expect(ref.positionFormat).toBe('[x,y]');
    expect(typeof ref.defaultSize).toBe('number');
    expect(ref.defaultSize).toBeGreaterThan(0);
  });
});
