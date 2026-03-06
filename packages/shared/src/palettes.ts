/**
 * @preplai/shared — Player color palettes
 *
 * Entity-type default colors for each palette. Used by the player
 * when rendering entities without explicit entity.color.
 */

export const PLAYER_THEMES = ['cinema', 'minimal'] as const;
export type PlayerTheme = (typeof PLAYER_THEMES)[number];

export const PLAYER_PALETTES = ['default', 'ocean', 'sunset', 'forest', 'mono'] as const;
export type PlayerPalette = (typeof PLAYER_PALETTES)[number];

export interface EntityPalette {
  server: string;
  database: string;
  cloud: string;
  user: string;
  concept: string;
  label: string;
  codeblock: string;
  generic: string;
  accent: string;
  /** Colors for ambient particles (cinema theme) */
  particles: string[];
}

export const PALETTES: Record<PlayerPalette, EntityPalette> = {
  default: {
    server: '#4ECDC4',
    database: '#9B59B6',
    cloud: '#90CAF9',
    user: '#4DD0E1',
    concept: '#00e5ff',
    label: '#FFFFFF',
    codeblock: '#4ECDC4',
    generic: '#4FC3F7',
    accent: '#C9A84C',
    particles: ['#4ECDC4', '#9B59B6', '#F1C40F', '#3498DB', '#E67E22'],
  },
  ocean: {
    server: '#3498DB',
    database: '#2ECC71',
    cloud: '#9B59B6',
    user: '#1ABC9C',
    concept: '#00bcd4',
    label: '#e2e8f0',
    codeblock: '#3498DB',
    generic: '#4ECDC4',
    accent: '#4ECDC4',
    particles: ['#3498DB', '#2ECC71', '#1ABC9C', '#00bcd4', '#9B59B6'],
  },
  sunset: {
    server: '#F39C12',
    database: '#E74C3C',
    cloud: '#9B59B6',
    user: '#F1C40F',
    concept: '#ff6b6b',
    label: '#fef3c7',
    codeblock: '#F39C12',
    generic: '#E67E22',
    accent: '#E67E22',
    particles: ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6'],
  },
  forest: {
    server: '#2ECC71',
    database: '#1ABC9C',
    cloud: '#3498DB',
    user: '#16a085',
    concept: '#00e676',
    label: '#d1fae5',
    codeblock: '#2ECC71',
    generic: '#22c55e',
    accent: '#27ae60',
    particles: ['#2ECC71', '#1ABC9C', '#16a085', '#00e676', '#3498DB'],
  },
  mono: {
    server: '#ECEFF1',
    database: '#607D8B',
    cloud: '#78909C',
    user: '#B0BEC5',
    concept: '#455A64',
    label: '#FFFFFF',
    codeblock: '#90A4AE',
    generic: '#CFD8DC',
    accent: '#90A4AE',
    particles: ['#ECEFF1', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F'],
  },
};

export function getEntityColor(
  palette: PlayerPalette,
  entityType: string,
  fallback = '#4FC3F7'
): string {
  const p = PALETTES[palette];
  if (!p) return fallback;
  switch (entityType) {
    case 'Server':
    case 'Service':
    case 'API':
    case 'APIGateway':
    case 'Lambda':
      return p.server;
    case 'Database':
    case 'HashTable':
      return p.database;
    case 'Cloud':
      return p.cloud;
    case 'User':
      return p.user;
    case 'Concept':
      return p.concept;
    case 'Label':
    case 'Annotation':
    case 'Definition':
    case 'Callout':
    case 'Quote':
    case 'Badge':
      return p.label;
    case 'CodeBlock':
      return p.codeblock;
    default:
      return p.generic;
  }
}
