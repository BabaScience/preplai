/**
 * @preplai/illustrations — Composable Illustration Engine Tests
 * Tests for composable-shapes, icon-paths, composable renderer,
 * semantic-resolver, and registry fallback chain.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderShape, COMPOSABLE_SHAPES } from './components/composable-shapes.js';
import { ICON_PATHS, ICON_CATEGORIES, ICON_NAMES } from './components/icon-paths.js';
import { renderComposable } from './components/composable.js';
import { resolveSemanticType } from './components/semantic-resolver.js';
import { registry, renderEntity } from './registry.js';
import { SVG_NS } from './utils.js';
import type { VisualEntity } from '@preplai/shared';
import type { ComposableShape } from './components/composable-shapes.js';

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: 'test-entity',
    type: 'Composable',
    position: { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

function makeSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 1920 1080');
  return svg;
}

// ── composable-shapes.ts ─────────────────────────────────────────────────

describe('COMPOSABLE_SHAPES', () => {
  it('should have exactly 15 shapes', () => {
    expect(COMPOSABLE_SHAPES).toHaveLength(15);
  });

  it('should contain all expected shape names', () => {
    const expected: ComposableShape[] = [
      'rect', 'circle', 'hexagon', 'diamond', 'shield', 'cylinder',
      'document', 'stadium', 'pill', 'parallelogram', 'pentagon',
      'octagon', 'triangle', 'trapezoid', 'cloud',
    ];
    for (const shape of expected) {
      expect(COMPOSABLE_SHAPES).toContain(shape);
    }
  });
});

describe('renderShape', () => {
  let parentEl: SVGSVGElement;
  let innerG: SVGGElement;

  beforeEach(() => {
    parentEl = makeSvg();
    innerG = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    parentEl.appendChild(innerG);
  });

  it('should return { width, height } for every shape type', () => {
    for (const shape of COMPOSABLE_SHAPES) {
      // Fresh innerG for each shape
      const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
      parentEl.appendChild(g);
      const result = renderShape(shape, g, parentEl, {
        size: 80,
        color: '#00e5ff',
      });
      expect(result, `renderShape('${shape}') should return dimensions`).toBeDefined();
      expect(typeof result.width).toBe('number');
      expect(typeof result.height).toBe('number');
      expect(result.width).toBeGreaterThan(0);
      expect(result.height).toBeGreaterThan(0);
    }
  });

  it('should fall back to rect for unknown shape', () => {
    const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    parentEl.appendChild(g);
    const result = renderShape('nonexistent' as ComposableShape, g, parentEl, {
      size: 80,
      color: '#00e5ff',
    });
    // Should succeed (rect fallback) and return dimensions
    expect(result).toBeDefined();
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    // Should have appended a rect element
    expect(g.querySelector('rect')).toBeTruthy();
  });

  it('should add extra SVG elements when highlight is true', () => {
    const gNoHighlight = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    parentEl.appendChild(gNoHighlight);
    renderShape('rect', gNoHighlight, parentEl, {
      size: 80,
      color: '#00e5ff',
      highlight: false,
    });
    const countWithout = gNoHighlight.childElementCount;

    const gHighlight = document.createElementNS(SVG_NS, 'g') as SVGGElement;
    parentEl.appendChild(gHighlight);
    renderShape('rect', gHighlight, parentEl, {
      size: 80,
      color: '#00e5ff',
      highlight: true,
    });
    const countWith = gHighlight.childElementCount;

    expect(countWith).toBeGreaterThan(countWithout);
  });

  it('should create SVG elements in innerG for all shapes', () => {
    for (const shape of COMPOSABLE_SHAPES) {
      const g = document.createElementNS(SVG_NS, 'g') as SVGGElement;
      parentEl.appendChild(g);
      renderShape(shape, g, parentEl, {
        size: 80,
        color: '#00e5ff',
      });
      expect(g.childElementCount, `Shape '${shape}' should append elements to innerG`).toBeGreaterThan(0);
    }
  });
});

// ── icon-paths.ts ────────────────────────────────────────────────────────

describe('ICON_PATHS', () => {
  it('should have more than 100 entries', () => {
    expect(Object.keys(ICON_PATHS).length).toBeGreaterThan(100);
  });

  it('should have a non-empty string path for every icon', () => {
    for (const [name, path] of Object.entries(ICON_PATHS)) {
      expect(typeof path, `Icon '${name}' should be a string`).toBe('string');
      expect(path.length, `Icon '${name}' should have non-empty path`).toBeGreaterThan(0);
    }
  });
});

describe('ICON_CATEGORIES', () => {
  it('should cover all major categories', () => {
    const expected = ['finance', 'business', 'product', 'general', 'tech', 'healthcare', 'arrows', 'shapes'];
    for (const cat of expected) {
      expect(ICON_CATEGORIES[cat], `Category '${cat}' should exist`).toBeDefined();
      expect(Array.isArray(ICON_CATEGORIES[cat])).toBe(true);
    }
  });

  it('should only reference icons that exist in ICON_PATHS', () => {
    for (const [category, icons] of Object.entries(ICON_CATEGORIES)) {
      for (const iconName of icons) {
        expect(
          ICON_PATHS[iconName],
          `Icon '${iconName}' in category '${category}' should exist in ICON_PATHS`,
        ).toBeDefined();
      }
    }
  });
});

describe('ICON_NAMES', () => {
  it('should match Object.keys(ICON_PATHS)', () => {
    expect(ICON_NAMES).toEqual(Object.keys(ICON_PATHS));
  });
});

// ── composable.ts (renderer) ─────────────────────────────────────────────

describe('renderComposable', () => {
  let parentEl: SVGSVGElement;

  beforeEach(() => {
    parentEl = makeSvg();
  });

  it('should create outerG with correct id and data-type', () => {
    const entity = makeEntity({ id: 'comp-1', type: 'Composable' });
    const result = renderComposable(entity, parentEl);
    expect(result.getAttribute('id')).toBe('comp-1');
    expect(result.getAttribute('data-type')).toBe('Composable');
  });

  it('should append to parentEl', () => {
    const entity = makeEntity({ id: 'comp-2' });
    renderComposable(entity, parentEl);
    expect(parentEl.querySelector('#comp-2')).toBeTruthy();
  });

  it('should default shape to rect when metadata.shape is missing', () => {
    const entity = makeEntity({ id: 'comp-no-shape', metadata: {} });
    const result = renderComposable(entity, parentEl);
    expect(result).toBeDefined();
    // Should have rendered successfully (rect fallback)
    const innerG = parentEl.querySelector('.animate-element');
    expect(innerG).toBeTruthy();
    expect(innerG!.querySelector('rect')).toBeTruthy();
  });

  it('should render icon when metadata.icon is provided and valid', () => {
    const entity = makeEntity({
      id: 'comp-icon',
      metadata: { shape: 'circle', icon: 'landmark' },
    });
    renderComposable(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    // Icon renders as a <g> containing a <path>
    const iconPath = innerG.querySelector('g path');
    expect(iconPath).toBeTruthy();
    expect(iconPath!.getAttribute('d')).toBeTruthy();
  });

  it('should NOT render icon when metadata.icon is invalid', () => {
    const entity = makeEntity({
      id: 'comp-bad-icon',
      metadata: { shape: 'rect', icon: 'nonexistent-icon-xyz' },
    });
    renderComposable(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    // No icon group should be rendered
    const iconGroups = innerG.querySelectorAll('g');
    expect(iconGroups.length).toBe(0);
  });

  it('should NOT render icon when metadata.icon is missing', () => {
    const entity = makeEntity({
      id: 'comp-no-icon',
      metadata: { shape: 'hexagon' },
    });
    renderComposable(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    const iconGroups = innerG.querySelectorAll('g');
    expect(iconGroups.length).toBe(0);
  });

  it('should render label below shape when entity.label is set', () => {
    const entity = makeEntity({
      id: 'comp-label',
      label: 'My Label',
      metadata: { shape: 'rect' },
    });
    renderComposable(entity, parentEl);
    const text = parentEl.querySelector('text');
    expect(text).toBeTruthy();
    expect(text!.textContent).toBe('My Label');
    expect(text!.getAttribute('text-anchor')).toBe('middle');
  });

  it('should NOT render label when entity.label is absent', () => {
    const entity = makeEntity({
      id: 'comp-no-label',
      metadata: { shape: 'rect' },
    });
    renderComposable(entity, parentEl);
    // No label text element (badge might still exist, so check content)
    const texts = parentEl.querySelectorAll('text');
    // Filter to only those that would be labels (not badges)
    const labelTexts = Array.from(texts).filter(
      (t) => Number(t.getAttribute('y') ?? 0) > 0,
    );
    expect(labelTexts.length).toBe(0);
  });

  it('should render badge when metadata.badgeLabel is set', () => {
    const entity = makeEntity({
      id: 'comp-badge',
      metadata: { shape: 'rect', badgeLabel: 'FUND' },
    });
    renderComposable(entity, parentEl);
    const texts = parentEl.querySelectorAll('text');
    const badgeText = Array.from(texts).find((t) => t.textContent === 'FUND');
    expect(badgeText).toBeTruthy();
  });

  it('should make fill transparent for outlined style', () => {
    const entity = makeEntity({
      id: 'comp-outlined',
      metadata: { shape: 'rect', style: 'outlined' },
    });
    renderComposable(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    const firstShape = innerG.firstElementChild as SVGElement;
    const fill = firstShape.getAttribute('fill');
    // Outlined style sets fill to a very transparent color (contains '08' alpha)
    expect(fill).toBeTruthy();
    expect(fill).not.toMatch(/^url\(#/); // Should NOT be a gradient URL
  });

  it('should use thicker stroke for emphasized style', () => {
    const entity = makeEntity({
      id: 'comp-emphasized',
      metadata: { shape: 'rect', style: 'emphasized' },
    });
    renderComposable(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    const rect = innerG.querySelector('rect');
    expect(rect).toBeTruthy();
    const sw = Number(rect!.getAttribute('stroke-width'));
    // Emphasized uses STROKE.emphasized which should be greater than STROKE.default
    expect(sw).toBeGreaterThan(1);
  });

  it('should trigger highlight rendering when highlight is true', () => {
    const entityNoHighlight = makeEntity({
      id: 'comp-no-hl',
      metadata: { shape: 'rect' },
    });
    renderComposable(entityNoHighlight, parentEl);
    const innerGNoHl = parentEl.querySelector('#comp-no-hl .animate-element')!;
    const countWithout = innerGNoHl.childElementCount;

    const entityHighlight = makeEntity({
      id: 'comp-hl',
      highlight: true,
      metadata: { shape: 'rect' },
    });
    renderComposable(entityHighlight, parentEl);
    const innerGHl = parentEl.querySelector('#comp-hl .animate-element')!;
    const countWith = innerGHl.childElementCount;

    expect(countWith).toBeGreaterThan(countWithout);
  });
});

// ── semantic-resolver.ts ─────────────────────────────────────────────────

describe('resolveSemanticType', () => {
  it('should return null for completely unknown types', () => {
    expect(resolveSemanticType('XyzzyPlugh')).toBeNull();
  });

  it('should match "FundVehicle" to shield + landmark', () => {
    const hint = resolveSemanticType('FundVehicle');
    expect(hint).not.toBeNull();
    expect(hint!.shape).toBe('shield');
    expect(hint!.icon).toBe('landmark');
  });

  it('should match "ContractAgreement" to document + scroll', () => {
    const hint = resolveSemanticType('ContractAgreement');
    expect(hint).not.toBeNull();
    expect(hint!.shape).toBe('document');
    expect(hint!.icon).toBe('scroll');
  });

  it('should match "MarketAnalysis" to hexagon + globe', () => {
    const hint = resolveSemanticType('MarketAnalysis');
    expect(hint).not.toBeNull();
    expect(hint!.shape).toBe('hexagon');
    expect(hint!.icon).toBe('globe');
  });

  it('should match "PatientRecord" to circle + heart-pulse', () => {
    const hint = resolveSemanticType('PatientRecord');
    expect(hint).not.toBeNull();
    expect(hint!.shape).toBe('circle');
    expect(hint!.icon).toBe('heart-pulse');
  });

  it('should be case-insensitive', () => {
    const upper = resolveSemanticType('FUNDVEHICLE');
    const lower = resolveSemanticType('fundvehicle');
    const mixed = resolveSemanticType('FundVehicle');
    expect(upper).toEqual(lower);
    expect(lower).toEqual(mixed);
  });

  it('should return SemanticHint with shape and icon fields', () => {
    const hint = resolveSemanticType('FundVehicle');
    expect(hint).not.toBeNull();
    expect(hint).toHaveProperty('shape');
    expect(hint).toHaveProperty('icon');
    expect(typeof hint!.shape).toBe('string');
    expect(typeof hint!.icon).toBe('string');
  });
});

// ── Registry fallback chain ──────────────────────────────────────────────

describe('Registry fallback chain', () => {
  let parentEl: SVGSVGElement;

  beforeEach(() => {
    parentEl = makeSvg();
  });

  it('should dispatch known type (Server) to dedicated renderer', () => {
    const entity = makeEntity({ id: 'srv-fc', type: 'Server' });
    const result = renderEntity(entity, parentEl);
    expect(result).not.toBeNull();
    expect(result!.getAttribute('data-type')).toBe('Server');
  });

  it('should dispatch Composable type to renderComposable', () => {
    const entity = makeEntity({
      id: 'comp-fc',
      type: 'Composable',
      metadata: { shape: 'hexagon', icon: 'landmark' },
    });
    const result = renderEntity(entity, parentEl);
    expect(result).not.toBeNull();
    expect(result!.getAttribute('data-type')).toBe('Composable');
  });

  it('should dispatch unknown type with metadata.shape to composable renderer (Tier 2)', () => {
    const entity = makeEntity({
      id: 'tier2-fc',
      type: 'CustomWidget' as any,
      metadata: { shape: 'shield', icon: 'briefcase' },
    });
    const result = renderEntity(entity, parentEl);
    expect(result).not.toBeNull();
    expect(parentEl.querySelector('#tier2-fc')).toBeTruthy();
  });

  it('should dispatch unknown type with no metadata to semantic resolver then composable (Tier 3)', () => {
    const entity = makeEntity({
      id: 'tier3-fc',
      type: 'FundVehicle' as any,
    });
    const result = renderEntity(entity, parentEl);
    expect(result).not.toBeNull();
    expect(parentEl.querySelector('#tier3-fc')).toBeTruthy();
  });

  it('should return null for completely unknown type with no matches', () => {
    const entity = makeEntity({
      id: 'null-fc',
      type: 'XyzzyPlughNothing' as any,
    });
    const result = renderEntity(entity, parentEl);
    expect(result).toBeNull();
  });
});
