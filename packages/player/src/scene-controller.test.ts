/**
 * @preplai/player — scene-controller tests (TDD: RED phase)
 *
 * Tests for the SceneController class — frame management, entity
 * rendering orchestration, patchEntity, clear. Uses jsdom environment.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VisualScript, VisualEntity, IllustrationFrame } from '@preplai/shared';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@preplai/shared';
import { SceneController } from './scene-controller.js';

// ── Helpers ──────────────────────────────────────────────────────────

/** Wait for double-rAF (connections render asynchronously) */
function waitForConnections(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: overrides.id ?? 'e1',
    type: overrides.type ?? 'Server',
    position: overrides.position ?? { x: 50, y: 50 },
    label: overrides.label ?? 'Test Entity',
    ...overrides,
  } as VisualEntity;
}

function makeFrame(overrides: Partial<IllustrationFrame> = {}): IllustrationFrame {
  return {
    id: overrides.id ?? 'f1',
    startTime: overrides.startTime ?? 0,
    endTime: overrides.endTime ?? 4500,
    entities: overrides.entities ?? [makeEntity()],
    narrationSegment: overrides.narrationSegment ?? 'Test narration',
    description: overrides.description ?? 'Test frame',
    ...overrides,
  };
}

function makeScript(frames?: IllustrationFrame[]): VisualScript {
  return {
    sceneId: 'test-scene',
    frames: frames ?? [makeFrame()],
    totalDuration: 9000,
  };
}

// ── Setup SVG DOM (mimics player.html) ──────────────────────────────

let controller: SceneController;
let entityLayer: SVGGElement;
let connectionLayer: SVGGElement;

beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = '';

  // Create SVG structure matching player.html
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'canvas');
  svg.setAttribute('viewBox', '0 0 1920 1080');

  entityLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  entityLayer.setAttribute('id', 'entity-layer');

  connectionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  connectionLayer.setAttribute('id', 'connection-layer');

  svg.appendChild(entityLayer);
  svg.appendChild(connectionLayer);
  document.body.appendChild(svg);

  controller = new SceneController({
    entityLayer,
    connectionLayer,
  });
});


// ═══════════════════════════════════════════════════════════════════════
// Construction & Initial State
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — initial state', () => {
  it('should initialize with null script and frame index 0', () => {
    expect(controller.currentScript).toBeNull();
    expect(controller.currentFrameIdx).toBe(0);
    expect(controller.renderedEntityIds.size).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// loadScript
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — loadScript', () => {
  it('should set currentScript and reset frame index to 0', () => {
    const script = makeScript();
    controller.loadScript(script);

    expect(controller.currentScript).toBe(script);
    expect(controller.currentFrameIdx).toBe(0);
  });

  it('should clear renderedEntityIds on new script load', () => {
    controller.loadScript(makeScript());
    expect(controller.renderedEntityIds.size).toBeGreaterThan(0);

    controller.loadScript(makeScript([makeFrame({ entities: [] })]));
    expect(controller.renderedEntityIds.size).toBe(0);
  });

  it('should render the first frame entities into the entity layer', () => {
    const script = makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
          makeEntity({ id: 'db', type: 'Database', position: { x: 75, y: 50 } }),
        ],
      }),
    ]);
    controller.loadScript(script);

    // Should render both entities
    expect(controller.renderedEntityIds.has('srv')).toBe(true);
    expect(controller.renderedEntityIds.has('db')).toBe(true);

    // Entity layer should have DOM children
    expect(entityLayer.children.length).toBeGreaterThanOrEqual(2);
  });

  it('should render arrows to the connection layer', async () => {
    const script = makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'srv', position: { x: 25, y: 50 } }),
          makeEntity({ id: 'db', position: { x: 75, y: 50 } }),
          makeEntity({
            id: 'arrow-1',
            type: 'Arrow',
            position: { x: 50, y: 50 },
            sourceEntityId: 'srv',
            targetEntityId: 'db',
          }),
        ],
      }),
    ]);
    controller.loadScript(script);
    await waitForConnections();

    // Connection layer should have arrow element(s)
    expect(connectionLayer.children.length).toBeGreaterThanOrEqual(1);
  });

  it('should apply position transforms to entity outer <g>', () => {
    const script = makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'srv', position: { x: 25, y: 50 } }),
        ],
      }),
    ]);
    controller.loadScript(script);

    const outerG = document.getElementById('srv');
    expect(outerG).not.toBeNull();
    const transform = outerG!.getAttribute('transform');
    expect(transform).toContain('translate');

    // 25% of 1920 = 480, 50% of 1080 = 540
    expect(transform).toContain('480');
    expect(transform).toContain('540');
  });
});


// ═══════════════════════════════════════════════════════════════════════
// seekToFrame
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — seekToFrame', () => {
  it('should update currentFrameIdx', () => {
    const script = makeScript([
      makeFrame({ id: 'f0', entities: [makeEntity({ id: 'a' })] }),
      makeFrame({ id: 'f1', startTime: 4500, endTime: 9000, entities: [makeEntity({ id: 'b' })] }),
    ]);
    controller.loadScript(script);
    expect(controller.currentFrameIdx).toBe(0);

    controller.seekToFrame(1);
    expect(controller.currentFrameIdx).toBe(1);
  });

  it('should render the new frame entities', () => {
    const script = makeScript([
      makeFrame({ entities: [makeEntity({ id: 'a' })] }),
      makeFrame({ startTime: 4500, endTime: 9000, entities: [makeEntity({ id: 'b' })] }),
    ]);
    controller.loadScript(script);
    expect(controller.renderedEntityIds.has('a')).toBe(true);

    controller.seekToFrame(1);
    expect(controller.renderedEntityIds.has('b')).toBe(true);
  });

  it('should be a no-op for invalid frame index', () => {
    controller.loadScript(makeScript());
    controller.seekToFrame(99);
    // Should still be at frame 0
    expect(controller.currentFrameIdx).toBe(0);
  });

  it('should be a no-op when no script is loaded', () => {
    controller.seekToFrame(0);
    expect(controller.currentFrameIdx).toBe(0);
    expect(controller.renderedEntityIds.size).toBe(0);
  });

  it('should clear previous frame entities on seek', () => {
    const script = makeScript([
      makeFrame({ entities: [makeEntity({ id: 'a' })] }),
      makeFrame({ startTime: 4500, endTime: 9000, entities: [makeEntity({ id: 'b' })] }),
    ]);
    controller.loadScript(script);

    // Frame 0 has entity 'a'
    const aBefore = document.getElementById('a');
    expect(aBefore).not.toBeNull();

    controller.seekToFrame(1);

    // Frame 1 should NOT have entity 'a'
    expect(controller.renderedEntityIds.has('a')).toBe(false);
    expect(controller.renderedEntityIds.has('b')).toBe(true);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// _renderFrame (internal, tested via loadScript/seekToFrame)
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — frame rendering', () => {
  it('should separate arrows from non-arrow entities (two-pass render)', async () => {
    const script = makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'srv', position: { x: 20, y: 50 } }),
          makeEntity({ id: 'db', position: { x: 80, y: 50 } }),
          makeEntity({
            id: 'arr',
            type: 'Arrow',
            position: { x: 50, y: 50 },
            sourceEntityId: 'srv',
            targetEntityId: 'db',
          }),
        ],
      }),
    ]);
    controller.loadScript(script);
    await waitForConnections();

    // Non-arrow entities tracked
    expect(controller.renderedEntityIds.has('srv')).toBe(true);
    expect(controller.renderedEntityIds.has('db')).toBe(true);
    // Arrow also rendered
    expect(connectionLayer.children.length).toBeGreaterThanOrEqual(1);
  });

  it('should skip child entities at top level (parentEntityId set)', () => {
    const script = makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'parent', type: 'Cloud', position: { x: 50, y: 50 } }),
          makeEntity({ id: 'child', type: 'Server', position: { x: 50, y: 50 }, parentEntityId: 'parent' }),
        ],
      }),
    ]);
    controller.loadScript(script);

    // Parent is rendered
    expect(controller.renderedEntityIds.has('parent')).toBe(true);
    // Child should NOT be in renderedEntityIds at top level
    // (it's rendered inside the parent — implementation may vary)
  });

  it('should use the double-<g> pattern for non-arrow entities', () => {
    const script = makeScript([
      makeFrame({
        entities: [makeEntity({ id: 'srv' })],
      }),
    ]);
    controller.loadScript(script);

    const outerG = document.getElementById('srv');
    expect(outerG).not.toBeNull();
    expect(outerG!.tagName.toLowerCase()).toBe('g');

    // Inner <g> should exist with animate-element class
    const innerG = outerG!.querySelector('.animate-element');
    expect(innerG).not.toBeNull();
  });

  it('should set data-type attribute on outer <g>', () => {
    const script = makeScript([
      makeFrame({
        entities: [makeEntity({ id: 'srv', type: 'Server' })],
      }),
    ]);
    controller.loadScript(script);

    const outerG = document.getElementById('srv');
    expect(outerG!.getAttribute('data-type')).toBe('Server');
  });

  it('should handle frames with no entities gracefully', () => {
    const script = makeScript([
      makeFrame({ entities: [] }),
    ]);

    expect(() => controller.loadScript(script)).not.toThrow();
    expect(controller.renderedEntityIds.size).toBe(0);
  });

  it('should handle DataFlow type on connection layer like Arrow', async () => {
    const script = makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'a', position: { x: 20, y: 50 } }),
          makeEntity({ id: 'b', position: { x: 80, y: 50 } }),
          makeEntity({
            id: 'df',
            type: 'DataFlow',
            position: { x: 50, y: 50 },
            sourceEntityId: 'a',
            targetEntityId: 'b',
          }),
        ],
      }),
    ]);
    controller.loadScript(script);
    await waitForConnections();

    // DataFlow rendered to connection layer
    expect(connectionLayer.children.length).toBeGreaterThanOrEqual(1);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// patchEntity
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — patchEntity', () => {
  it('should update label text of a rendered entity', () => {
    controller.loadScript(makeScript([
      makeFrame({ entities: [makeEntity({ id: 'srv', label: 'Old Label' })] }),
    ]));

    controller.patchEntity('srv', { label: 'New Label' });

    const outerG = document.getElementById('srv');
    const textEl = outerG?.querySelector('text');
    expect(textEl?.textContent).toBe('New Label');
  });

  it('should apply highlight filter when patching highlight=true', () => {
    controller.loadScript(makeScript([
      makeFrame({ entities: [makeEntity({ id: 'srv' })] }),
    ]));

    controller.patchEntity('srv', { highlight: true });

    const outerG = document.getElementById('srv');
    expect(outerG!.getAttribute('filter')).toContain('entity-glow');
  });

  it('should remove highlight filter when patching highlight=false', () => {
    controller.loadScript(makeScript([
      makeFrame({ entities: [makeEntity({ id: 'srv', highlight: true })] }),
    ]));

    controller.patchEntity('srv', { highlight: false });

    const outerG = document.getElementById('srv');
    expect(outerG!.getAttribute('filter')).toBeFalsy();
  });

  it('should be a no-op for non-existent entity IDs', () => {
    controller.loadScript(makeScript());
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    controller.patchEntity('nonexistent', { label: 'x' });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('nonexistent'),
    );
    consoleSpy.mockRestore();
  });

  it('should update color on colored child elements', () => {
    controller.loadScript(makeScript([
      makeFrame({ entities: [makeEntity({ id: 'srv', color: '#4A90D9' })] }),
    ]));

    controller.patchEntity('srv', { color: '#FF0000' });

    const outerG = document.getElementById('srv');
    // At least one element should have the new fill
    const colored = outerG?.querySelector('[fill="#FF0000"]');
    expect(colored).not.toBeNull();
  });
});


// ═══════════════════════════════════════════════════════════════════════
// clear
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — clear', () => {
  it('should remove all rendered entities from DOM', () => {
    controller.loadScript(makeScript([
      makeFrame({
        entities: [
          makeEntity({ id: 'a' }),
          makeEntity({ id: 'b', position: { x: 75, y: 50 } }),
        ],
      }),
    ]));

    expect(entityLayer.children.length).toBeGreaterThan(0);
    controller.clear();

    expect(entityLayer.innerHTML).toBe('');
    expect(connectionLayer.innerHTML).toBe('');
  });

  it('should reset all internal state', () => {
    controller.loadScript(makeScript());
    controller.clear();

    expect(controller.currentScript).toBeNull();
    expect(controller.currentFrameIdx).toBe(0);
    expect(controller.renderedEntityIds.size).toBe(0);
  });

  it('should be safe to call multiple times', () => {
    controller.clear();
    controller.clear();

    expect(controller.currentScript).toBeNull();
  });

  it('should be safe to call before any script is loaded', () => {
    expect(() => controller.clear()).not.toThrow();
  });
});


// ═══════════════════════════════════════════════════════════════════════
// Entity count limits
// ═══════════════════════════════════════════════════════════════════════

describe('SceneController — entity limits', () => {
  it('should warn when frame exceeds 150 entities', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const entities = Array.from({ length: 151 }, (_, i) =>
      makeEntity({ id: `e${i}`, position: { x: (i % 10) * 10, y: Math.floor(i / 10) * 10 } }),
    );

    controller.loadScript(makeScript([makeFrame({ entities })]));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('151'),
    );
    consoleSpy.mockRestore();
  });

  it('should refuse to render when frame exceeds 400 entities', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const entities = Array.from({ length: 401 }, (_, i) =>
      makeEntity({ id: `e${i}`, position: { x: (i % 10) * 10, y: Math.floor(i / 10) * 10 } }),
    );

    controller.loadScript(makeScript([makeFrame({ entities })]));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('401'),
    );
    // Should not render any entities
    expect(controller.renderedEntityIds.size).toBe(0);
    consoleSpy.mockRestore();
  });
});
