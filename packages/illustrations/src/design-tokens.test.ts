/**
 * @preplai/illustrations — design-tokens palette system tests
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  getCategoryColor,
  setActivePalette,
  getActivePaletteName,
  getSemanticCategory,
  getParticleColors,
  PALETTES,
  ENTITY_COLORS,
  COLORS,
} from './design-tokens.js';

afterEach(() => {
  setActivePalette('default'); // reset after each test
});

describe('palette system', () => {
  it('getCategoryColor returns ENTITY_COLORS value when no palette set', () => {
    setActivePalette('default');
    expect(getCategoryColor('Server')).toBe(ENTITY_COLORS['Server']);
    expect(getCategoryColor('Database')).toBe(ENTITY_COLORS['Database']);
    expect(getCategoryColor('User')).toBe(ENTITY_COLORS['User']);
  });

  it('getCategoryColor returns palette value when palette is active', () => {
    setActivePalette('ocean');
    expect(getCategoryColor('Server')).toBe(PALETTES.ocean.compute);
    expect(getCategoryColor('Database')).toBe(PALETTES.ocean.data);
    expect(getCategoryColor('User')).toBe(PALETTES.ocean.human);
    expect(getCategoryColor('Cloud')).toBe(PALETTES.ocean.environment);
    expect(getCategoryColor('Container')).toBe(PALETTES.ocean.structure);
    expect(getCategoryColor('Firewall')).toBe(PALETTES.ocean.state);
    expect(getCategoryColor('Label')).toBe(PALETTES.ocean.annotation);
    expect(getCategoryColor('Array')).toBe(PALETTES.ocean.generic);
  });

  it('sunset palette returns warm colors', () => {
    setActivePalette('sunset');
    expect(getCategoryColor('Server')).toBe(PALETTES.sunset.compute);
    expect(getCategoryColor('Database')).toBe(PALETTES.sunset.data);
  });

  it('connectors stay white regardless of palette', () => {
    setActivePalette('sunset');
    expect(getCategoryColor('Arrow')).toBe('#ffffff');
    expect(getCategoryColor('DataFlow')).toBe('#ffffff');
    expect(getCategoryColor('BidirectArrow')).toBe('#ffffff');
    expect(getCategoryColor('DottedArrow')).toBe('#ffffff');
    expect(getCategoryColor('Transition')).toBe('#ffffff');
  });

  it('unknown type falls back to generic palette category', () => {
    setActivePalette('forest');
    expect(getCategoryColor('UnknownWidget')).toBe(PALETTES.forest.generic);
  });

  it('unknown type falls back to cyan when no palette', () => {
    setActivePalette('default');
    expect(getCategoryColor('UnknownWidget')).toBe(COLORS.cyan);
  });
});

describe('getSemanticCategory', () => {
  it('returns correct categories for each group', () => {
    expect(getSemanticCategory('Server')).toBe('compute');
    expect(getSemanticCategory('Lambda')).toBe('compute');
    expect(getSemanticCategory('Database')).toBe('data');
    expect(getSemanticCategory('Cache')).toBe('data');
    expect(getSemanticCategory('Cloud')).toBe('environment');
    expect(getSemanticCategory('Monitor')).toBe('environment');
    expect(getSemanticCategory('User')).toBe('human');
    expect(getSemanticCategory('Concept')).toBe('human');
    expect(getSemanticCategory('Container')).toBe('structure');
    expect(getSemanticCategory('BinaryTree')).toBe('structure');
    expect(getSemanticCategory('Firewall')).toBe('state');
    expect(getSemanticCategory('Mutex')).toBe('state');
    expect(getSemanticCategory('Label')).toBe('annotation');
    expect(getSemanticCategory('Callout')).toBe('annotation');
    expect(getSemanticCategory('Array')).toBe('generic');
    expect(getSemanticCategory('Queue')).toBe('generic');
  });

  it('returns generic for unmapped types', () => {
    expect(getSemanticCategory('Nonexistent')).toBe('generic');
  });
});

describe('setActivePalette', () => {
  it('rejects unknown names gracefully', () => {
    setActivePalette('neon');
    expect(getActivePaletteName()).toBeNull();
    expect(getCategoryColor('Server')).toBe(ENTITY_COLORS['Server']);
  });

  it('default resets to null', () => {
    setActivePalette('ocean');
    expect(getActivePaletteName()).toBe('ocean');
    setActivePalette('default');
    expect(getActivePaletteName()).toBeNull();
  });

  it('empty string resets to null', () => {
    setActivePalette('ocean');
    setActivePalette('');
    expect(getActivePaletteName()).toBeNull();
  });
});

describe('getParticleColors', () => {
  it('returns palette particles when active', () => {
    setActivePalette('ocean');
    expect(getParticleColors()).toEqual(PALETTES.ocean.particles);
  });

  it('returns default particles when no palette', () => {
    setActivePalette('default');
    expect(getParticleColors()).toEqual(PALETTES.default.particles);
  });

  it('mono palette has more particles', () => {
    setActivePalette('mono');
    expect(getParticleColors().length).toBe(7);
  });
});
