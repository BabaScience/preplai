/**
 * @preplai/shared — Player color palettes
 *
 * Entity-type default colors for each palette. Used by the player
 * when rendering entities without explicit entity.color.
 */

export const PLAYER_THEMES = ['cinema', 'light'] as const;
export type PlayerTheme = (typeof PLAYER_THEMES)[number];

export const PLAYER_PALETTES = ['default', 'ocean', 'sunset', 'forest', 'mono'] as const;
export type PlayerPalette = (typeof PLAYER_PALETTES)[number];

export interface EntityPalette {
  /** Computation / processing (Server, CPU, Service, Lambda, CodeBlock) */
  compute: string;
  /** Data / information / storage (Database, Cache, Volume, HashTable) */
  data: string;
  /** Environment / flow (Cloud, Cycle, Monitor) */
  environment: string;
  /** Human / agent / reasoning (User, Concept, Decision, BigO) */
  human: string;
  /** Structure / organization (Container, Network, BinaryTree, Stack) */
  structure: string;
  /** State / control / sync (Mutex, FSM, ProcessState) */
  state: string;
  /** Annotations / peripherals (Label, Callout, GanttChart) */
  annotation: string;
  /** General-purpose fallback */
  generic: string;
  /** Accent color (progress bar, narrator highlights) */
  accent: string;
  /** Colors for ambient particles (cinema theme) */
  particles: string[];
}

export const PALETTES: Record<PlayerPalette, EntityPalette> = {
  default: {
    compute: '#00e676',   // green
    data: '#4488ff',      // blue
    environment: '#00bcd4', // teal
    human: '#C9A84C',     // gold
    structure: '#9B59B6', // violet
    state: '#ff6b6b',     // red
    annotation: '#ffab00', // orange
    generic: '#4ECDC4',   // cyan
    accent: '#C9A84C',
    particles: ['#00e676', '#4488ff', '#C9A84C', '#9B59B6', '#4ECDC4'],
  },
  ocean: {
    compute: '#2ECC71',
    data: '#3498DB',
    environment: '#9B59B6',
    human: '#1ABC9C',
    structure: '#00bcd4',
    state: '#E74C3C',
    annotation: '#e2e8f0',
    generic: '#4ECDC4',
    accent: '#4ECDC4',
    particles: ['#3498DB', '#2ECC71', '#1ABC9C', '#00bcd4', '#9B59B6'],
  },
  sunset: {
    compute: '#F39C12',
    data: '#E74C3C',
    environment: '#9B59B6',
    human: '#F1C40F',
    structure: '#ff6b6b',
    state: '#E74C3C',
    annotation: '#fef3c7',
    generic: '#E67E22',
    accent: '#E67E22',
    particles: ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6'],
  },
  forest: {
    compute: '#2ECC71',
    data: '#1ABC9C',
    environment: '#3498DB',
    human: '#16a085',
    structure: '#00e676',
    state: '#E74C3C',
    annotation: '#d1fae5',
    generic: '#22c55e',
    accent: '#27ae60',
    particles: ['#2ECC71', '#1ABC9C', '#16a085', '#00e676', '#3498DB'],
  },
  mono: {
    compute: '#ECEFF1',
    data: '#607D8B',
    environment: '#78909C',
    human: '#B0BEC5',
    structure: '#455A64',
    state: '#90A4AE',
    annotation: '#FFFFFF',
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
    // Green: Computation / Processing
    case 'Server':
    case 'Service':
    case 'API':
    case 'APIGateway':
    case 'Lambda':
    case 'CPU':
    case 'Process':
    case 'Pipeline':
    case 'Thread':
    case 'PipelineStage':
    case 'CodeBlock':
    case 'CallStack':
    case 'SymbolTable':
      return p.compute;
    // Blue: Data / Information / Storage
    case 'Database':
    case 'Cache':
    case 'Volume':
    case 'MemoryBlock':
    case 'MemoryLayout':
    case 'MemoryMap':
    case 'CacheHierarchy':
    case 'Dict':
    case 'HashTable':
    case 'BTree':
    case 'Trie':
    case 'Heap':
    case 'Set':
    case 'Registry':
      return p.data;
    // Teal: Environment / Flow
    case 'Cloud':
    case 'Cycle':
    case 'Monitor':
    case 'Timeline':
    case 'FlowDiagram':
    case 'GraphTraversal':
      return p.environment;
    // Gold: Human / Agent / Reasoning
    case 'User':
    case 'Concept':
    case 'Decision':
    case 'Metric':
    case 'BigO':
    case 'Analogy':
    case 'Quote':
    case 'Definition':
    case 'Proof':
      return p.human;
    // Violet: Structure / Organization
    case 'Container':
    case 'Pod':
    case 'Network':
    case 'Subnet':
    case 'Cluster':
    case 'Group':
    case 'Stack':
    case 'BinaryTree':
    case 'LinkedList':
    case 'NeuralNetwork':
      return p.structure;
    // Red: State / Control
    case 'Mutex':
    case 'Semaphore':
    case 'Firewall':
    case 'FSM':
    case 'ProcessState':
    case 'DeadlockGraph':
    case 'Badge':
      return p.state;
    // Orange: Annotations / Peripherals
    case 'Label':
    case 'Callout':
    case 'Annotation':
    case 'Comparison':
    case 'GanttChart':
      return p.annotation;
    default:
      return p.generic;
  }
}
