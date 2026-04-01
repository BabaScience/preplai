/**
 * @preplai/illustrations — Core Component Render Function Tests
 * TDD: Tests written FIRST, implementation follows.
 *
 * Tests the actual SVG DOM output of render functions.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderServer } from './components/server.js';
import { renderDatabase } from './components/database.js';
import { renderUser } from './components/user.js';
import { renderCloud } from './components/cloud.js';
import { renderConcept } from './components/concept.js';
import { renderCodeBlock } from './components/codeblock.js';
import { renderArrow, renderDataFlow } from './components/arrow.js';
import { renderGraph2D } from './components/graph2d.js';
import { renderCoordinateSystem } from './components/coordinatesystem.js';
import { renderArray } from './components/array.js';
import { renderCallout } from './components/callout.js';
import { renderComparison } from './components/comparison.js';
import { SVG_NS } from './utils.js';
import type { VisualEntity } from '@preplai/shared';

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: 'test-entity',
    type: 'Server',
    position: { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

function makeSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 1920 1080');
  return svg;
}

// ── Server ────────────────────────────────────────────────────────────

describe('renderServer', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should return an SVGGElement', () => {
    const entity = makeEntity({ id: 'srv-1', type: 'Server' });
    const result = renderServer(entity, parentEl);
    expect(result).toBeDefined();
    expect(result!.tagName).toBe('g');
  });

  it('should set id and data-type on outerG', () => {
    const entity = makeEntity({ id: 'my-server', type: 'Server' });
    const result = renderServer(entity, parentEl)!;
    expect(result.getAttribute('id')).toBe('my-server');
    expect(result.getAttribute('data-type')).toBe('Server');
  });

  it('should append to parentEl', () => {
    const entity = makeEntity({ id: 'srv-app', type: 'Server' });
    renderServer(entity, parentEl);
    expect(parentEl.querySelector('#srv-app')).toBeTruthy();
  });

  it('should contain a rect (server body)', () => {
    const entity = makeEntity({ type: 'Server' });
    renderServer(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    expect(innerG.querySelector('rect')).toBeTruthy();
  });

  it('should contain rack slot divider lines', () => {
    const entity = makeEntity({ type: 'Server' });
    renderServer(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    // Rack bars are rendered as gradient rects (visual depth redesign)
    const rects = innerG.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(2);
  });

  it('should contain server rack lines', () => {
    const entity = makeEntity({ type: 'Server' });
    renderServer(entity, parentEl);
    const innerG = parentEl.querySelector('.animate-element')!;
    // Rack bars are rendered as gradient rects (visual depth redesign)
    const rects = innerG.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThanOrEqual(2);
  });

  it('should render label when provided', () => {
    const entity = makeEntity({ type: 'Server', label: 'Auth Service' });
    renderServer(entity, parentEl);
    const text = parentEl.querySelector('text');
    expect(text).toBeTruthy();
    expect(text!.textContent).toBe('Auth Service');
  });

  it('should NOT render label text when label is absent', () => {
    const entity = makeEntity({ type: 'Server' });
    renderServer(entity, parentEl);
    const text = parentEl.querySelector('text');
    expect(text).toBeNull();
  });

  it('should use custom color', () => {
    const entity = makeEntity({ type: 'Server', color: '#ff0000' });
    renderServer(entity, parentEl);
    const rect = parentEl.querySelector('.animate-element rect')!;
    expect(rect.getAttribute('stroke')).toBe('#ff0000');
  });
});

// ── Database ──────────────────────────────────────────────────────────

describe('renderDatabase', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should return an SVGGElement with correct id', () => {
    const entity = makeEntity({ id: 'db-1', type: 'Database' });
    const result = renderDatabase(entity, parentEl)!;
    expect(result.getAttribute('id')).toBe('db-1');
    expect(result.getAttribute('data-type')).toBe('Database');
  });

  it('should contain ellipses (top cap + bottom base)', () => {
    const entity = makeEntity({ type: 'Database' });
    renderDatabase(entity, parentEl);
    const ellipses = parentEl.querySelectorAll('ellipse');
    expect(ellipses.length).toBeGreaterThanOrEqual(2);
  });

  it('should contain vertical side lines', () => {
    const entity = makeEntity({ type: 'Database' });
    renderDatabase(entity, parentEl);
    const lines = parentEl.querySelectorAll('.animate-element line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('should render label when provided', () => {
    const entity = makeEntity({ type: 'Database', label: 'Users DB' });
    renderDatabase(entity, parentEl);
    const text = parentEl.querySelector('text');
    expect(text!.textContent).toBe('Users DB');
  });
});

// ── User ──────────────────────────────────────────────────────────────

describe('renderUser', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should return an SVGGElement', () => {
    const entity = makeEntity({ id: 'user-1', type: 'User' });
    const result = renderUser(entity, parentEl)!;
    expect(result.getAttribute('data-type')).toBe('User');
  });

  it('should contain a head circle', () => {
    const entity = makeEntity({ type: 'User' });
    renderUser(entity, parentEl);
    const circles = parentEl.querySelectorAll('.animate-element circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it('should contain a body path', () => {
    const entity = makeEntity({ type: 'User' });
    renderUser(entity, parentEl);
    const paths = parentEl.querySelectorAll('.animate-element path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Cloud ─────────────────────────────────────────────────────────────

describe('renderCloud', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should return an SVGGElement with Cloud data-type', () => {
    const entity = makeEntity({ id: 'cloud-1', type: 'Cloud' });
    const result = renderCloud(entity, parentEl)!;
    expect(result.getAttribute('data-type')).toBe('Cloud');
  });

  it('should contain overlapping ellipses (simplified cloud shape)', () => {
    const entity = makeEntity({ type: 'Cloud' });
    renderCloud(entity, parentEl);
    const ellipses = parentEl.querySelectorAll('.animate-element ellipse');
    // 3 cloud bumps + 1 flat base + radial halo + highlight = 6 ellipses (visual depth redesign)
    expect(ellipses.length).toBeGreaterThanOrEqual(4);
  });
});

// ── Concept ───────────────────────────────────────────────────────────

describe('renderConcept', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should contain rounded rect shape', () => {
    const entity = makeEntity({ type: 'Concept', label: 'API' });
    renderConcept(entity, parentEl);
    const rects = parentEl.querySelectorAll('.animate-element rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('should render centered label text', () => {
    const entity = makeEntity({ type: 'Concept', label: 'REST' });
    renderConcept(entity, parentEl);
    const text = parentEl.querySelector('text');
    expect(text!.textContent).toBe('REST');
    expect(text!.getAttribute('text-anchor')).toBe('middle');
  });
});

// ── CodeBlock ─────────────────────────────────────────────────────────

describe('renderCodeBlock', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should return an SVGGElement with CodeBlock data-type', () => {
    const entity = makeEntity({ id: 'code-1', type: 'CodeBlock', label: 'main.js' });
    const result = renderCodeBlock(entity, parentEl)!;
    expect(result.getAttribute('data-type')).toBe('CodeBlock');
  });

  it('should contain a dark background rect', () => {
    const entity = makeEntity({
      type: 'CodeBlock',
      metadata: { code: 'const x = 1;', language: 'js' },
    });
    renderCodeBlock(entity, parentEl);
    const rects = parentEl.querySelectorAll('.animate-element rect');
    expect(rects.length).toBeGreaterThanOrEqual(1);
  });

  it('should render traffic-light dots', () => {
    const entity = makeEntity({ type: 'CodeBlock' });
    renderCodeBlock(entity, parentEl);
    const circles = parentEl.querySelectorAll('.animate-element circle');
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  it('should expand tabs to spaces (tab-stop aligned, default tabSize 2)', () => {
    const entity = makeEntity({
      type: 'CodeBlock',
      metadata: {
        lines: ['\tconst x = 1;', ' \treturn x;', '\t\tnested;'],
      },
    });
    renderCodeBlock(entity, parentEl);
    const texts = parentEl.querySelectorAll('.animate-element text');
    const codeTexts = Array.from(texts).filter(
      (t) =>
        t.textContent?.includes('const') ||
        t.textContent?.includes('return') ||
        t.textContent?.includes('nested'),
    );
    // Non-breaking spaces (\u00A0) are used to preserve indentation in SVG <text>
    expect(codeTexts.some((t) => t.textContent?.startsWith('\u00A0\u00A0const'))).toBe(true);
    expect(codeTexts.some((t) => t.textContent?.startsWith('\u00A0\u00A0return'))).toBe(true);
    expect(codeTexts.some((t) => t.textContent?.startsWith('\u00A0\u00A0\u00A0\u00A0nested'))).toBe(true);
  });
});

// ── Arrow ─────────────────────────────────────────────────────────────

describe('renderArrow', () => {
  let parentEl: SVGSVGElement;
  const allEntities: VisualEntity[] = [
    makeEntity({ id: 'src', type: 'Server', position: { x: 20, y: 40 } }),
    makeEntity({ id: 'tgt', type: 'Database', position: { x: 80, y: 60 } }),
  ];

  beforeEach(() => { parentEl = makeSvg(); });

  it('should render a line between resolved source and target', () => {
    const arrow = makeEntity({
      id: 'arr-1',
      type: 'Arrow',
      sourceEntityId: 'src',
      targetEntityId: 'tgt',
    });
    const result = renderArrow(arrow, allEntities, parentEl);
    expect(result).not.toBeNull();
    const path = parentEl.querySelector('path');
    expect(path).toBeTruthy();
    expect(path!.getAttribute('d')).toBeTruthy();
  });

  it('should set correct x1/y1 and x2/y2 from source/target positions (edge-to-edge)', () => {
    const arrow = makeEntity({
      id: 'arr-2',
      type: 'Arrow',
      sourceEntityId: 'src',
      targetEntityId: 'tgt',
    });
    renderArrow(arrow, allEntities, parentEl);
    const path = parentEl.querySelector('path')!;
    expect(path).toBeTruthy();
    const d = path.getAttribute('d')!;
    // Path format: M x1 y1 L x2 y2 or M x1 y1 Q cx cy x2 y2
    const nums = d.match(/[\d.]+/g);
    expect(nums).toBeTruthy();
    expect(nums!.length).toBeGreaterThanOrEqual(4);
    const x1 = Number(nums![0]);
    const x2 = Number(nums![nums!.length - 2]);
    // Arrows connect at entity edges + gap, not centers. Source exit + gap: ~546, target entry - gap: ~1374
    expect(x1).toBeGreaterThan(384);
    expect(x1).toBeLessThanOrEqual(580);
    expect(x2).toBeLessThan(1536);
    expect(x2).toBeGreaterThanOrEqual(1360);
  });

  it('should return null when source is not resolvable', () => {
    const arrow = makeEntity({
      id: 'arr-3',
      type: 'Arrow',
      sourceEntityId: 'nonexistent',
      targetEntityId: 'tgt',
    });
    const result = renderArrow(arrow, allEntities, parentEl);
    expect(result).toBeNull();
  });

  it('should render midpoint label when provided', () => {
    const arrow = makeEntity({
      id: 'arr-4',
      type: 'Arrow',
      sourceEntityId: 'src',
      targetEntityId: 'tgt',
      label: 'HTTPS',
    });
    renderArrow(arrow, allEntities, parentEl);
    const text = parentEl.querySelector('text');
    expect(text).toBeTruthy();
    expect(text!.textContent).toBe('HTTPS');
  });

  it('should create arrowhead marker in defs', () => {
    const arrow = makeEntity({
      id: 'arr-5',
      type: 'Arrow',
      sourceEntityId: 'src',
      targetEntityId: 'tgt',
    });
    renderArrow(arrow, allEntities, parentEl);
    const marker = parentEl.querySelector('defs marker');
    expect(marker).toBeTruthy();
  });
});

// ── DataFlow ──────────────────────────────────────────────────────────

describe('renderDataFlow', () => {
  let parentEl: SVGSVGElement;
  const allEntities: VisualEntity[] = [
    makeEntity({ id: 'a', type: 'Server', position: { x: 10, y: 50 } }),
    makeEntity({ id: 'b', type: 'Database', position: { x: 90, y: 50 } }),
  ];

  beforeEach(() => { parentEl = makeSvg(); });

  it('should render a dashed line between source and target', () => {
    const df = makeEntity({
      id: 'df-1',
      type: 'DataFlow',
      sourceEntityId: 'a',
      targetEntityId: 'b',
    });
    const result = renderDataFlow(df, allEntities, parentEl);
    expect(result).not.toBeNull();
    const path = parentEl.querySelector('path');
    expect(path).toBeTruthy();
    expect(path!.getAttribute('stroke-dasharray')).toBeTruthy();
  });

  it('should include SMIL animation element', () => {
    const df = makeEntity({
      id: 'df-2',
      type: 'DataFlow',
      sourceEntityId: 'a',
      targetEntityId: 'b',
    });
    renderDataFlow(df, allEntities, parentEl);
    const anim = parentEl.querySelector('animate');
    expect(anim).toBeTruthy();
    expect(anim!.getAttribute('attributeName')).toBe('stroke-dashoffset');
  });
});

// ── Graph2D ───────────────────────────────────────────────────────────

describe('renderGraph2D', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should render grid and axes lines', () => {
    const entity = makeEntity({
      type: 'Graph2D',
      metadata: { expression: 'Math.sin(x)', domain: [-5, 5], range: [-2, 2] },
    });
    renderGraph2D(entity, parentEl);
    const lines = parentEl.querySelectorAll('.animate-element line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('should render axes lines', () => {
    const entity = makeEntity({
      type: 'Graph2D',
      metadata: { domain: [-5, 5], range: [-5, 5] },
    });
    renderGraph2D(entity, parentEl);
    const lines = parentEl.querySelectorAll('.animate-element line');
    // At minimum 2 axes + grid lines
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('should render curve path for explicit expression', () => {
    const entity = makeEntity({
      type: 'Graph2D',
      metadata: { expression: 'x*x', domain: [-3, 3], range: [0, 9] },
    });
    renderGraph2D(entity, parentEl);
    const paths = parentEl.querySelectorAll('.animate-element path');
    expect(paths.length).toBeGreaterThanOrEqual(1);
  });

  it('should render scatter points when metadata.points provided', () => {
    const entity = makeEntity({
      type: 'Graph2D',
      metadata: {
        points: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
        domain: [0, 5],
        range: [0, 5],
      },
    });
    renderGraph2D(entity, parentEl);
    const circles = parentEl.querySelectorAll('.animate-element circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('should render title label', () => {
    const entity = makeEntity({
      type: 'Graph2D',
      label: 'y = sin(x)',
    });
    renderGraph2D(entity, parentEl);
    const texts = parentEl.querySelectorAll('text');
    const titleText = Array.from(texts).find(t => t.textContent === 'y = sin(x)');
    expect(titleText).toBeTruthy();
  });
});

// ── CoordinateSystem ──────────────────────────────────────────────────

describe('renderCoordinateSystem', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should return an SVGGElement with CoordinateSystem data-type', () => {
    const entity = makeEntity({ id: 'coords-1', type: 'CoordinateSystem' });
    const result = renderCoordinateSystem(entity, parentEl)!;
    expect(result.getAttribute('id')).toBe('coords-1');
    expect(result.getAttribute('data-type')).toBe('CoordinateSystem');
  });

  it('should render grid and axes lines', () => {
    const entity = makeEntity({
      type: 'CoordinateSystem',
      metadata: { xRange: [-5, 5], yRange: [-5, 5] },
    });
    renderCoordinateSystem(entity, parentEl);
    const lines = parentEl.querySelectorAll('.animate-element line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('should render axes lines', () => {
    const entity = makeEntity({
      type: 'CoordinateSystem',
      metadata: { xRange: [-5, 5], yRange: [-5, 5] },
    });
    renderCoordinateSystem(entity, parentEl);
    const lines = parentEl.querySelectorAll('.animate-element line');
    expect(lines.length).toBeGreaterThanOrEqual(2);
  });

  it('should render grid when showGrid is true', () => {
    const entity = makeEntity({
      type: 'CoordinateSystem',
      metadata: { xRange: [-5, 5], yRange: [-5, 5], gridSpacing: 1, showGrid: true },
    });
    renderCoordinateSystem(entity, parentEl);
    const lines = parentEl.querySelectorAll('.animate-element line');
    expect(lines.length).toBeGreaterThan(2);
  });

  it('should render points when metadata.points provided', () => {
    const entity = makeEntity({
      type: 'CoordinateSystem',
      metadata: {
        xRange: [0, 5],
        yRange: [0, 5],
        points: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
      },
    });
    renderCoordinateSystem(entity, parentEl);
    const circles = parentEl.querySelectorAll('.animate-element circle');
    expect(circles.length).toBeGreaterThanOrEqual(2);
  });

  it('should render vectors when metadata.vectors provided', () => {
    const entity = makeEntity({
      type: 'CoordinateSystem',
      metadata: {
        xRange: [-5, 5],
        yRange: [-5, 5],
        vectors: [{ dx: 3, dy: 2, label: 'v' }],
      },
    });
    renderCoordinateSystem(entity, parentEl);
    const polygons = parentEl.querySelectorAll('.animate-element polygon');
    expect(polygons.length).toBeGreaterThanOrEqual(1);
  });

  it('should render title label', () => {
    const entity = makeEntity({
      type: 'CoordinateSystem',
      label: 'xy-plane',
    });
    renderCoordinateSystem(entity, parentEl);
    const texts = parentEl.querySelectorAll('text');
    const titleText = Array.from(texts).find(t => t.textContent === 'xy-plane');
    expect(titleText).toBeTruthy();
  });
});

// ── Array ────────────────────────────────────────────────────────────────

describe('renderArray', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should render cells with values', () => {
    const entity = makeEntity({
      id: 'arr-1',
      type: 'Array',
      metadata: {
        values: ['5', '12', '17'],
      },
    });
    renderArray(entity, parentEl);
    const rects = parentEl.querySelectorAll('.animate-element rect');
    expect(rects.length).toBeGreaterThanOrEqual(3);
    const texts = parentEl.querySelectorAll('text');
    const valText = Array.from(texts).find(t => t.textContent === '5');
    expect(valText).toBeTruthy();
  });

  it('should render index labels above cells', () => {
    const entity = makeEntity({
      id: 'arr-2',
      type: 'Array',
      metadata: {
        values: ['a', 'b', 'c'],
      },
    });
    renderArray(entity, parentEl);
    const texts = parentEl.querySelectorAll('text');
    const indexText = Array.from(texts).find(t => t.textContent === '0');
    expect(indexText).toBeTruthy();
  });

  it('should show value when showValue or value provided', () => {
    const entity = makeEntity({
      id: 'arr-3',
      type: 'Array',
      metadata: {
        values: ['5', '12', '42'],
        pointerLabels: [
          { index: 1, label: 'mid', showValue: true },
          { index: 2, label: 'high', value: 42 },
        ],
      },
    });
    renderArray(entity, parentEl);
    const texts = parentEl.querySelectorAll('text');
    const midText = Array.from(texts).find(t => t.textContent?.includes('12'));
    const highText = Array.from(texts).find(t => t.textContent?.includes('42'));
    expect(midText).toBeTruthy();
    expect(highText).toBeTruthy();
  });
});

// ── Callout (flexible body: newlines + wrap) ────────────────────────────────

describe('renderCallout', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should render info circle icon', () => {
    const entity = makeEntity({
      id: 'callout-1',
      type: 'Callout',
    });
    renderCallout(entity, parentEl);
    const circles = parentEl.querySelectorAll('.animate-element circle');
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it('should render label below when provided', () => {
    const entity = makeEntity({
      id: 'callout-2',
      type: 'Callout',
      label: 'Important',
    });
    renderCallout(entity, parentEl);
    const texts = parentEl.querySelectorAll('text');
    const labelText = Array.from(texts).find(t => t.textContent === 'Important');
    expect(labelText).toBeTruthy();
  });
});

// ── Comparison ───────────────────────────────────────────────────

describe('renderComparison', () => {
  let parentEl: SVGSVGElement;
  beforeEach(() => { parentEl = makeSvg(); });

  it('should render two boxes with vs when left and right provided', () => {
    const entity = makeEntity({
      type: 'Comparison',
      metadata: { left: 'Array', right: 'LinkedList' },
    });
    renderComparison(entity, parentEl);
    const rects = parentEl.querySelectorAll('.animate-element rect');
    expect(rects.length).toBe(2);
    const texts = parentEl.querySelectorAll('.animate-element text');
    const vsText = Array.from(texts).find((t) => t.textContent === 'vs');
    expect(vsText).toBeTruthy();
  });

  it('should parse label for "X vs Y" when left/right omitted', () => {
    const entity = makeEntity({
      type: 'Comparison',
      metadata: { label: 'REST vs GraphQL' },
    });
    renderComparison(entity, parentEl);
    const rects = parentEl.querySelectorAll('.animate-element rect');
    expect(rects.length).toBe(2);
  });
});
