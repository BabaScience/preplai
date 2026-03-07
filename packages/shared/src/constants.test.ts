/**
 * @preplai/shared — Constants Tests
 * TDD: Tests written FIRST, implementation follows.
 */
import { describe, it, expect } from 'vitest';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_VIEW_BOX,
  CANVAS_BG_COLOR,
  CANVAS_ASPECT_RATIO,
  FRAME_DURATION_MIN_MS,
  INTER_ENTITY_STAGGER_MS,
  ANIMATION_DELAY_MIN_MS,
  ENTITY_MIN_VISIBLE_MS,
  DEFAULT_ENTRANCE_DURATION_MS,
  MAX_ANIMATED_ELEMENTS,
  ENTITY_COUNT_WARN_THRESHOLD,
  ENTITY_COUNT_ERROR_THRESHOLD,
  MAX_FRAMES_PER_SCRIPT,
  MAX_ENTITIES_PER_FRAME,
  SESSION_TTL_DEFAULT_SECONDS,
  SESSION_TTL_MAX_SECONDS,
  ENTITY_DEFAULTS,
  TIER_RATE_LIMITS,
  PERFORMANCE_CONTRACTS,
  ENTRANCE_ANIMATION_CLASSES,
} from './constants.js';

describe('Canvas constants', () => {
  it('should define 16:9 HD canvas dimensions', () => {
    expect(CANVAS_WIDTH).toBe(1920);
    expect(CANVAS_HEIGHT).toBe(1080);
    expect(CANVAS_VIEW_BOX).toBe('0 0 1920 1080');
    expect(CANVAS_ASPECT_RATIO).toBeCloseTo(16 / 9, 2);
  });

  it('should define cinematic dark background', () => {
    expect(CANVAS_BG_COLOR).toBe('#0f0f1a');
  });
});

describe('Timing constants', () => {
  it('should define minimum frame duration as 2500ms', () => {
    expect(FRAME_DURATION_MIN_MS).toBe(2500);
  });

  it('should define 80ms inter-entity stagger', () => {
    expect(INTER_ENTITY_STAGGER_MS).toBe(80);
  });

  it('should define minimum animation delay', () => {
    expect(ANIMATION_DELAY_MIN_MS).toBe(150);
  });

  it('should define entity minimum visible time', () => {
    expect(ENTITY_MIN_VISIBLE_MS).toBe(1200);
  });

  it('should define 450ms default entrance duration', () => {
    expect(DEFAULT_ENTRANCE_DURATION_MS).toBe(450);
  });
});

describe('Limit constants', () => {
  it('should define max 500 animated elements', () => {
    expect(MAX_ANIMATED_ELEMENTS).toBe(500);
  });

  it('should warn at 150 entities, error at 400', () => {
    expect(ENTITY_COUNT_WARN_THRESHOLD).toBe(150);
    expect(ENTITY_COUNT_ERROR_THRESHOLD).toBe(400);
    expect(ENTITY_COUNT_WARN_THRESHOLD).toBeLessThan(ENTITY_COUNT_ERROR_THRESHOLD);
  });

  it('should allow max 100 frames and 150 entities per frame', () => {
    expect(MAX_FRAMES_PER_SCRIPT).toBe(100);
    expect(MAX_ENTITIES_PER_FRAME).toBe(150);
  });

  it('should define session TTL defaults', () => {
    expect(SESSION_TTL_DEFAULT_SECONDS).toBe(14_400); // 4 hours
    expect(SESSION_TTL_MAX_SECONDS).toBe(86_400); // 24 hours
    expect(SESSION_TTL_DEFAULT_SECONDS).toBeLessThan(SESSION_TTL_MAX_SECONDS);
  });
});

describe('ENTITY_DEFAULTS', () => {
  it('should define correct default values', () => {
    expect(ENTITY_DEFAULTS.size).toBe(2.0);
    expect(ENTITY_DEFAULTS.color).toBe('#4A90D9');
    expect(ENTITY_DEFAULTS.highlight).toBe(false);
  });

  it('should define default animation properties', () => {
    expect(ENTITY_DEFAULTS.animation.delay).toBe(0);
    expect(ENTITY_DEFAULTS.animation.duration).toBe(450);
    expect(ENTITY_DEFAULTS.animation.entrance).toBe('entrance-fadeInUp');
    expect(ENTITY_DEFAULTS.animation.easing).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  });
});

describe('TIER_RATE_LIMITS', () => {
  it('should define increasing rate limits per tier', () => {
    expect(TIER_RATE_LIMITS.developer).toBe(100);
    expect(TIER_RATE_LIMITS.startup).toBe(500);
    expect(TIER_RATE_LIMITS.scale).toBe(2_000);
    expect(TIER_RATE_LIMITS.developer).toBeLessThan(TIER_RATE_LIMITS.startup);
    expect(TIER_RATE_LIMITS.startup).toBeLessThan(TIER_RATE_LIMITS.scale);
  });
});

describe('PERFORMANCE_CONTRACTS', () => {
  it('should define MCP tool P95 latency', () => {
    expect(PERFORMANCE_CONTRACTS.MCP_TOOL_P95_MS).toBe(200);
  });

  it('should define SSE delivery P95 latency', () => {
    expect(PERFORMANCE_CONTRACTS.SSE_DELIVERY_P95_MS).toBe(50);
  });

  it('should define max script size and duration', () => {
    expect(PERFORMANCE_CONTRACTS.MAX_VISUAL_SCRIPT_BYTES).toBe(512 * 1024);
    expect(PERFORMANCE_CONTRACTS.MAX_SCRIPT_DURATION_MS).toBe(3_600_000);
  });
});

describe('ENTRANCE_ANIMATION_CLASSES', () => {
  it('should include all 4 entrance animation classes', () => {
    expect(ENTRANCE_ANIMATION_CLASSES).toHaveLength(4);
    expect(ENTRANCE_ANIMATION_CLASSES).toContain('entrance-fadeInUp');
    expect(ENTRANCE_ANIMATION_CLASSES).toContain('entrance-fadeIn');
    expect(ENTRANCE_ANIMATION_CLASSES).toContain('entrance-drawIn');
    expect(ENTRANCE_ANIMATION_CLASSES).toContain('entrance-scaleIn');
  });
});
