/**
 * @preplai/illustrations — buildEntityGroup Tests
 * TDD: Tests written FIRST, implementation follows.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { buildEntityGroup, applyEntranceAnimation, getSizeParam, SVG_NS } from './utils.js';
import type { VisualEntity } from '@preplai/shared';

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: 'test-entity',
    type: 'Server',
    position: { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

describe('SVG_NS constant', () => {
  it('should be the SVG namespace URI', () => {
    expect(SVG_NS).toBe('http://www.w3.org/2000/svg');
  });
});

describe('buildEntityGroup', () => {
  it('should return outerG and innerG', () => {
    const { outerG, innerG } = buildEntityGroup(makeEntity());
    expect(outerG).toBeDefined();
    expect(innerG).toBeDefined();
    expect(outerG.tagName).toBe('g');
    expect(innerG.tagName).toBe('g');
  });

  it('should set entity id on outerG', () => {
    const { outerG } = buildEntityGroup(makeEntity({ id: 'my-server' }));
    expect(outerG.getAttribute('id')).toBe('my-server');
  });

  it('should set data-type on outerG', () => {
    const { outerG } = buildEntityGroup(makeEntity({ type: 'Database' }));
    expect(outerG.getAttribute('data-type')).toBe('Database');
  });

  it('should convert percentage position to 1920x1080 canvas pixels', () => {
    const { outerG } = buildEntityGroup(makeEntity({ position: { x: 50, y: 50 } }));
    const transform = outerG.getAttribute('transform');
    // 50% of 1920 = 960, 50% of 1080 = 540
    expect(transform).toBe('translate(960, 540)');
  });

  it('should handle edge positions (0, 0)', () => {
    const { outerG } = buildEntityGroup(makeEntity({ position: { x: 0, y: 0 } }));
    expect(outerG.getAttribute('transform')).toBe('translate(0, 0)');
  });

  it('should handle edge positions (100, 100)', () => {
    const { outerG } = buildEntityGroup(makeEntity({ position: { x: 100, y: 100 } }));
    expect(outerG.getAttribute('transform')).toBe('translate(1920, 1080)');
  });

  it('should nest innerG inside outerG', () => {
    const { outerG, innerG } = buildEntityGroup(makeEntity());
    expect(outerG.firstChild).toBe(innerG);
    expect(innerG.parentNode).toBe(outerG);
  });

  it('should set animate-element class on innerG', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    expect(innerG.getAttribute('class')).toBe('animate-element');
  });

  it('should set transformBox fill-box on innerG', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    expect(innerG.style.transformBox).toBe('fill-box');
  });

  it('should set transformOrigin center center on innerG', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    expect(innerG.style.transformOrigin).toBe('center center');
  });

  it('should set willChange on innerG', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    expect(innerG.style.willChange).toBe('transform, opacity');
  });

  it('should NOT set animationDelay when no delay provided', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    // animationDelay should be empty string (not set)
    expect(innerG.style.animationDelay).toBe('');
  });

  it('should set animationDelay when entity has delay', () => {
    const { innerG } = buildEntityGroup(makeEntity({ animation: { delay: 300 } }));
    expect(innerG.style.animationDelay).toBe('300ms');
  });

  it('should create SVG namespace elements', () => {
    const { outerG, innerG } = buildEntityGroup(makeEntity());
    expect(outerG.namespaceURI).toBe(SVG_NS);
    expect(innerG.namespaceURI).toBe(SVG_NS);
  });
});

// ── applyEntranceAnimation ────────────────────────────────────────────

describe('applyEntranceAnimation', () => {
  it('should add default entrance-fadeInUp class when no animation specified', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    applyEntranceAnimation(innerG, makeEntity());
    expect(innerG.classList.contains('entrance-fadeInUp')).toBe(true);
  });

  it('should add custom entrance class from entity.animation.entrance', () => {
    const entity = makeEntity({ animation: { entrance: 'entrance-drawIn' } });
    const { innerG } = buildEntityGroup(entity);
    applyEntranceAnimation(innerG, entity);
    expect(innerG.classList.contains('entrance-drawIn')).toBe(true);
  });

  it('should NOT add any class when animation.entrance is none', () => {
    const entity = makeEntity({ animation: { entrance: 'none' } });
    const { innerG } = buildEntityGroup(entity);
    applyEntranceAnimation(innerG, entity);
    // Only the base 'animate-element' class should be present
    expect(innerG.classList.contains('entrance-fadeInUp')).toBe(false);
    expect(innerG.classList.contains('entrance-drawIn')).toBe(false);
  });

  it('should preserve existing animate-element class on innerG', () => {
    const { innerG } = buildEntityGroup(makeEntity());
    applyEntranceAnimation(innerG, makeEntity());
    expect(innerG.getAttribute('class')).toContain('animate-element');
    expect(innerG.getAttribute('class')).toContain('entrance-fadeInUp');
  });
});

// ── getSizeParam ──────────────────────────────────────────────────────

describe('getSizeParam', () => {
  it('should return default-based value when entity.size is undefined', () => {
    const px = getSizeParam(makeEntity());
    // default 2.5 * 50 = 125, clamped to [15, 150]
    expect(px).toBe(125);
  });

  it('should scale with entity.size value', () => {
    const px = getSizeParam(makeEntity({ size: 2.0 }));
    // 2.0 * 50 = 100, clamped to [15, 120]
    expect(px).toBe(100);
  });

  it('should clamp to minimum 15', () => {
    const px = getSizeParam(makeEntity({ size: 0.1 }));
    // 0.1 * 50 = 5, clamped to 15
    expect(px).toBe(15);
  });

  it('should clamp to maximum 150', () => {
    const px = getSizeParam(makeEntity({ size: 5.0 }));
    // 5.0 * 50 = 250, clamped to 150
    expect(px).toBe(150);
  });
});
