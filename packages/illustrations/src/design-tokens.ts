/**
 * @preplai/illustrations — Design Tokens
 *
 * Shared design system aligned with player theme.
 * Use these tokens for consistent colors, typography, and shapes.
 */

// ── Accent palette (aligned with player: Cyan, Violet, Gold) ──────────

export const COLORS = {
  cyan: '#4ECDC4',
  violet: '#9B59B6',
  gold: '#C9A84C',
  pink: '#ff2d7b',
  green: '#00e676',
  orange: '#ffab00',
  red: '#ff6b6b',
  teal: '#00bcd4',
  blue: '#4488ff',
  emerald: '#34d399',
} as const;

// ── Opacity scales (hex alpha) ────────────────────────────────────────

export const OPACITY = {
  fillLight: '15',
  fillMedium: '25',
  fillHeavy: '40',
  strokeMuted: '40',
  strokeSoft: '60',
  strokeFull: 'ff',
} as const;

/** Append hex alpha to a color. Example: colorWithAlpha('#4ECDC4', '15') → '#4ECDC415' */
export function colorWithAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}

// ── Typography (single source of truth for labels in illustrations) ───

export const TYPOGRAPHY = {
  fontLabel: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontBadge: "'JetBrains Mono', 'Geist Mono', monospace",
  fontCode: "'JetBrains Mono', 'Geist Mono', monospace",
  /** Default font size for entity labels (e.g. Service, main label below illustration) */
  fontSizeDefault: 15,
  /** Index/cell index (e.g. above array cells) */
  fontSizeIndex: 9,
  /** Cell value, inline content */
  fontSizeValue: 11,
  /** Pointer labels, captions, small text */
  fontSizeInline: 10,
  /** Badge, type indicator */
  fontSizeBadge: 11,
  /** Main entity label below illustration */
  fontSizeLabel: 15,
  /** Section/title */
  fontSizeTitle: 16,
  /** Metric, large value */
  fontSizeMetric: 18,
  /** Body text max (e.g. annotation); can shrink to fit */
  fontSizeBodyMax: 14,
  /** Symbol/accent (e.g. ~ in analogy) */
  fontSizeSymbol: 18,
  fontWeightLabel: 500,
  fontWeightTitle: 600,
  /** Emphasized (values, active) */
  fontWeightEmphasis: 600,
  /** Bold (symbols, strong accent) */
  fontWeightBold: 700,
} as const;

export type LabelRole = 'default' | 'index' | 'value' | 'inline' | 'label' | 'title' | 'metric';

/**
 * Default values for entity labels below illustrations.
 * Single source of truth for label positioning, spacing, and styling.
 */
export const LABEL_DEFAULTS = {
  /** Vertical offset (px) below shape center for label */
  offsetBelow: 18,
  /** Line height multiplier for multi-line labels */
  lineHeight: 1.2,
  /** Horizontal alignment: 'middle' | 'start' | 'end' */
  textAnchor: 'middle' as const,
  /** Hub/param text inside shape: vertical offset from center */
  hubOffsetY: 4,
  /** Hub/param text: scale factor (fontSize = min(fontSizeValue, s * hubScaleFactor)) */
  hubScaleFactor: 0.32,
} as const;

/** Get font size for a label role. Single source of truth for typography in illustrations. */
export function getLabelFontSize(role: LabelRole, _scale: number = 1): number {
  switch (role) {
    case 'index': return TYPOGRAPHY.fontSizeIndex;
    case 'value': return TYPOGRAPHY.fontSizeValue;
    case 'inline': return TYPOGRAPHY.fontSizeInline;
    case 'label':
    case 'default': return TYPOGRAPHY.fontSizeLabel;
    case 'title': return TYPOGRAPHY.fontSizeTitle;
    case 'metric': return TYPOGRAPHY.fontSizeMetric;
    default: return TYPOGRAPHY.fontSizeDefault;
  }
}

// ── Shape tokens ──────────────────────────────────────────────────────

/**
 * Single source of truth for stroke thickness across all illustrations.
 * Use these tokens for consistent line weight; avoid hardcoded values.
 */
export const STROKE = {
  /** Default stroke for main shape outlines */
  default: 1.5,
  /** Secondary elements: connectors, inner lines, grid, accents */
  thin: 1,
  /** Emphasized elements: selected, highlighted, important */
  emphasized: 2,
  /** Active/current state: e.g. current pointer in array, active step */
  selected: 2,
  /** Minimal: fine details, icons, decorative */
  minimal: 0.75,
} as const;

export type StrokeWeight = keyof typeof STROKE;

/** Get stroke width for a given weight. Optionally scale for size-responsive components. */
export function getStrokeWidth(
  weight: StrokeWeight = 'default',
  scale: number = 1,
): number {
  return Math.max(0.5, STROKE[weight] * scale);
}

export const SHAPES = {
  borderRadius: 6,
  borderRadiusLarge: 8,
  /** @deprecated Use STROKE.default */
  strokeWidth: STROKE.default,
  /** @deprecated Use STROKE.thin */
  strokeWidthThin: STROKE.thin,
  /** @deprecated Use STROKE.emphasized */
  strokeWidthHeavy: STROKE.emphasized,
} as const;

// ── Entity type → default color mapping (Semantic Design System P4.1) ──
//
// Colors are organized by semantic spectrum:
//   Blue   = data / information / storage
//   Green  = computation / processing / execution
//   Gold   = human / agent / reasoning
//   Red    = state / control / synchronization
//   Violet = structure / organization / topology
//   Cyan   = general-purpose / math / visualization
//   Orange = annotations / scheduling / peripherals
//   Teal   = environment / flow / monitoring
//   Pink   = specialized (physics, ML confusion)
//   White  = connectors

export const ENTITY_COLORS: Record<string, string> = {
  // ── Blue: Data / Information / Storage ────────────────────────────
  Database: COLORS.emerald,
  Cache: COLORS.blue,
  Volume: COLORS.emerald,
  MemoryBlock: COLORS.blue,
  MemoryLayout: COLORS.blue,
  MemoryMap: COLORS.blue,
  CacheHierarchy: COLORS.blue,
  Dict: COLORS.blue,
  HashTable: COLORS.blue,
  BTree: COLORS.blue,
  Trie: COLORS.blue,
  Heap: COLORS.blue,
  Set: COLORS.blue,
  Table: COLORS.blue,
  Registry: COLORS.blue,
  DockerImage: COLORS.blue,
  DockerRegistry: COLORS.blue,
  QueryPlan: COLORS.blue,

  // ── Green: Computation / Processing / Execution ──────────────────
  Server: COLORS.green,
  CPU: COLORS.green,
  Service: COLORS.green,
  Lambda: COLORS.green,
  Process: COLORS.green,
  ProcessBlock: COLORS.green,
  Pipeline: COLORS.green,
  Thread: COLORS.green,
  PipelineStage: COLORS.green,
  CodeBlock: COLORS.green,
  CallStack: COLORS.green,
  SymbolTable: COLORS.green,

  // ── Gold: Human / Agent / Reasoning ──────────────────────────────
  User: COLORS.gold,
  Concept: COLORS.gold,
  Decision: COLORS.gold,
  Metric: COLORS.gold,
  BigO: COLORS.gold,
  Analogy: COLORS.gold,
  Quote: COLORS.gold,
  Definition: COLORS.gold,
  Proof: COLORS.gold,

  // ── Red: State / Control / Synchronization ───────────────────────
  Mutex: COLORS.red,
  Semaphore: COLORS.red,
  Firewall: COLORS.red,
  FSM: COLORS.red,
  ProcessState: COLORS.red,
  DeadlockGraph: COLORS.red,
  Badge: COLORS.red,
  StateNode: COLORS.red,

  // ── Violet: Structure / Organization / Topology ──────────────────
  Container: COLORS.violet,
  Pod: COLORS.violet,
  Network: COLORS.violet,
  Subnet: COLORS.violet,
  Cluster: COLORS.violet,
  Group: COLORS.violet,
  Stack: COLORS.violet,
  BinaryTree: COLORS.violet,
  LinkedList: COLORS.violet,
  RecursionTree: COLORS.violet,
  NeuralNetwork: COLORS.violet,
  TuringMachine: COLORS.violet,
  Tuple: COLORS.violet,

  // ── Cyan: General / Math / Visualization ─────────────────────────
  H1: COLORS.cyan,
  H2: COLORS.cyan,
  H3: COLORS.cyan,
  Entity: COLORS.cyan,
  Array: COLORS.cyan,
  ArrayCell: COLORS.cyan,
  List: COLORS.cyan,
  GraphDS: COLORS.cyan,
  Equation: COLORS.cyan,
  Expression: COLORS.cyan,
  Matrix: COLORS.cyan,
  Graph2D: COLORS.cyan,
  CoordinateSystem: COLORS.cyan,
  SortAnimation: COLORS.cyan,
  StepList: COLORS.cyan,
  LoadBalancer: COLORS.cyan,
  DNSResolver: COLORS.cyan,
  Bus: COLORS.cyan,
  Packet: COLORS.cyan,
  Queue: COLORS.cyan,
  BarChart: COLORS.cyan,
  Histogram: COLORS.cyan,
  PieChart: COLORS.cyan,
  ScatterPlot: COLORS.cyan,
  VennDiagram: COLORS.cyan,

  // ── Orange: Annotations / Scheduling / Peripherals ───────────────
  Label: COLORS.orange,
  Callout: COLORS.orange,
  Annotation: COLORS.orange,
  Comparison: COLORS.orange,
  GanttChart: COLORS.orange,
  LogicGate: COLORS.orange,
  Register: COLORS.orange,
  Device: COLORS.orange,
  Decorator: COLORS.orange,
  FreeBodyDiagram: COLORS.orange,

  // ── Teal: Environment / Flow / Monitoring ────────────────────────
  Cloud: COLORS.teal,
  Cycle: COLORS.teal,
  Wave: COLORS.teal,
  FlowDiagram: COLORS.teal,
  Monitor: COLORS.teal,
  Timeline: COLORS.teal,
  GraphTraversal: COLORS.teal,

  // ── Pink: Specialized ────────────────────────────────────────────
  ConfusionMatrix: COLORS.pink,
  Vector: COLORS.pink,
  Tmpfs: COLORS.pink,

  // ── Software Architecture: API & Web ──────────────────────────────
  APIEndpoint: COLORS.green,
  HTTPRequest: COLORS.cyan,
  HTTPResponse: COLORS.cyan,
  WebSocket: COLORS.teal,
  GraphQLSchema: COLORS.pink,
  Webhook: COLORS.orange,

  // ── Software Architecture: Auth & Security ───────────────────────
  AuthFlow: COLORS.gold,
  Token: COLORS.gold,
  Certificate: COLORS.green,
  Secret: COLORS.red,

  // ── Software Architecture: Data & Messaging ─────────────────────
  Schema: COLORS.emerald,
  Migration: COLORS.emerald,
  Event: COLORS.orange,
  Stream: COLORS.teal,

  // ── Software Architecture: CI/CD & DevOps ────────────────────────
  GitBranch: COLORS.violet,
  GitCommit: COLORS.violet,
  PullRequest: COLORS.green,
  Build: COLORS.cyan,
  Deployment: COLORS.blue,
  Rollback: COLORS.red,

  // ── Software Architecture: Cloud Infrastructure ──────────────────
  CDN: COLORS.teal,
  StorageBucket: COLORS.blue,
  APIGateway: COLORS.green,
  MessageBroker: COLORS.orange,

  // ── Software Architecture: Observability ─────────────────────────
  LogEntry: COLORS.cyan,
  Alert: COLORS.red,
  Trace: COLORS.teal,
  Dashboard: COLORS.blue,

  // ── Software Architecture: Code & Architecture ───────────────────
  Module: COLORS.violet,
  Interface: COLORS.cyan,
  ErrorState: COLORS.red,
  ConfigFile: COLORS.orange,
  Dependency: COLORS.blue,
  CronJob: COLORS.orange,

  // ── Software Architecture: Collaboration ─────────────────────────
  Notification: COLORS.orange,
  Task: COLORS.cyan,
  File: COLORS.blue,

  // ── Phase 1: Core Architecture Diagrams ─────────────────────────
  SequenceDiagram: COLORS.cyan,
  EREntity: COLORS.emerald,
  ClassNode: COLORS.violet,
  SystemBoundary: COLORS.teal,
  CircuitBreaker: COLORS.red,

  // ── Phase 2: Domain-Specific ───────────────────────────────────
  ComponentNode: COLORS.cyan,
  DataLake: COLORS.blue,
  DataWarehouse: COLORS.emerald,
  MLModel: COLORS.violet,
  FeatureStore: COLORS.blue,
  MindMapNode: COLORS.gold,
  UserJourneyStep: COLORS.orange,
  DeploymentStrategy: COLORS.green,

  // ── Phase 3: Microservices & Patterns ──────────────────────────
  Sidecar: COLORS.teal,
  DeadLetterQueue: COLORS.red,
  RateLimiter: COLORS.orange,
  GPU: COLORS.green,
  Bundle: COLORS.violet,
  SagaStep: COLORS.cyan,

  // ── White: Connectors ────────────────────────────────────────────
  Arrow: '#ffffff',
  DataFlow: '#ffffff',
  Transition: '#ffffff',
  BidirectArrow: '#ffffff',
  DottedArrow: '#ffffff',
};

// ── Palette system ────────────────────────────────────────────────────

export type SemanticCategory = 'compute' | 'data' | 'environment' | 'human' | 'structure' | 'state' | 'annotation' | 'generic';

export interface Palette {
  compute: string;
  data: string;
  environment: string;
  human: string;
  structure: string;
  state: string;
  annotation: string;
  generic: string;
  accent: string;
  particles: string[];
}

export type PaletteName = 'default' | 'ocean' | 'sunset' | 'forest' | 'mono';

export const PALETTES: Record<PaletteName, Palette> = {
  default: {
    compute: '#00e676', data: '#4488ff', environment: '#00bcd4', human: '#C9A84C',
    structure: '#9B59B6', state: '#ff6b6b', annotation: '#ffab00', generic: '#4ECDC4',
    accent: '#C9A84C',
    particles: ['#00e676', '#4488ff', '#C9A84C', '#9B59B6', '#4ECDC4'],
  },
  ocean: {
    compute: '#2ECC71', data: '#3498DB', environment: '#9B59B6', human: '#1ABC9C',
    structure: '#00bcd4', state: '#E74C3C', annotation: '#e2e8f0', generic: '#4ECDC4',
    accent: '#4ECDC4',
    particles: ['#3498DB', '#2ECC71', '#1ABC9C', '#00bcd4', '#9B59B6'],
  },
  sunset: {
    compute: '#F39C12', data: '#E74C3C', environment: '#9B59B6', human: '#F1C40F',
    structure: '#ff6b6b', state: '#E74C3C', annotation: '#fef3c7', generic: '#E67E22',
    accent: '#E67E22',
    particles: ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6'],
  },
  forest: {
    compute: '#2ECC71', data: '#1ABC9C', environment: '#3498DB', human: '#16a085',
    structure: '#00e676', state: '#E74C3C', annotation: '#d1fae5', generic: '#22c55e',
    accent: '#27ae60',
    particles: ['#2ECC71', '#1ABC9C', '#16a085', '#00e676', '#3498DB'],
  },
  mono: {
    compute: '#ECEFF1', data: '#607D8B', environment: '#78909C', human: '#B0BEC5',
    structure: '#455A64', state: '#90A4AE', annotation: '#FFFFFF', generic: '#CFD8DC',
    accent: '#90A4AE',
    particles: ['#ECEFF1', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F'],
  },
};

// ── Semantic category mapping (type → palette slot) ──────────────────

const TYPE_TO_CATEGORY: Record<string, SemanticCategory> = {};

// compute: Computation / Processing / Execution
for (const t of [
  'Server', 'Service', 'API', 'APIGateway', 'Lambda', 'CPU', 'Process',
  'Pipeline', 'Thread', 'PipelineStage', 'CodeBlock', 'CallStack', 'SymbolTable',
  'APIEndpoint', 'Certificate', 'PullRequest', 'Build',
]) TYPE_TO_CATEGORY[t] = 'compute';

// data: Data / Information / Storage
for (const t of [
  'Database', 'Cache', 'Volume', 'MemoryBlock', 'MemoryLayout', 'MemoryMap',
  'CacheHierarchy', 'Dict', 'HashTable', 'BTree', 'Trie', 'Heap', 'Set',
  'Registry', 'Table', 'DockerImage', 'DockerRegistry', 'QueryPlan',
  'Schema', 'Migration', 'StorageBucket', 'Deployment', 'Dashboard',
  'Dependency', 'File',
]) TYPE_TO_CATEGORY[t] = 'data';

// environment: Environment / Flow / Monitoring
for (const t of [
  'Cloud', 'Cycle', 'Monitor', 'Timeline', 'FlowDiagram', 'GraphTraversal',
  'Wave', 'WebSocket', 'Stream', 'CDN', 'Trace',
]) TYPE_TO_CATEGORY[t] = 'environment';

// human: Human / Agent / Reasoning
for (const t of [
  'User', 'Concept', 'Decision', 'Metric', 'BigO', 'Analogy', 'Quote',
  'Definition', 'Proof', 'AuthFlow', 'Token',
]) TYPE_TO_CATEGORY[t] = 'human';

// structure: Structure / Organization / Topology
for (const t of [
  'Container', 'Pod', 'Network', 'Subnet', 'Cluster', 'Group', 'Stack',
  'BinaryTree', 'LinkedList', 'NeuralNetwork', 'RecursionTree', 'TuringMachine',
  'Tuple', 'GitBranch', 'GitCommit', 'Module',
]) TYPE_TO_CATEGORY[t] = 'structure';

// state: State / Control / Synchronization
for (const t of [
  'Mutex', 'Semaphore', 'Firewall', 'FSM', 'ProcessState', 'DeadlockGraph',
  'Badge', 'StateNode', 'Secret', 'Rollback', 'Alert', 'ErrorState',
]) TYPE_TO_CATEGORY[t] = 'state';

// annotation: Annotations / Scheduling / Peripherals
for (const t of [
  'Label', 'Callout', 'Annotation', 'Comparison', 'GanttChart',
  'LogicGate', 'Register', 'Device', 'Decorator', 'FreeBodyDiagram',
  'Webhook', 'Event', 'MessageBroker', 'ConfigFile', 'CronJob',
  'Notification', 'Task',
]) TYPE_TO_CATEGORY[t] = 'annotation';

// generic: General-purpose / Math / Visualization
for (const t of [
  'H1', 'H2', 'H3', 'Entity', 'Array', 'ArrayCell', 'List', 'GraphDS',
  'Equation', 'Expression', 'Matrix', 'Graph2D', 'CoordinateSystem',
  'SortAnimation', 'StepList', 'LoadBalancer', 'DNSResolver', 'Bus',
  'Packet', 'Queue', 'BarChart', 'Histogram', 'PieChart', 'ScatterPlot',
  'VennDiagram', 'HTTPRequest', 'HTTPResponse', 'GraphQLSchema',
  'LogEntry', 'Interface',
]) TYPE_TO_CATEGORY[t] = 'generic';

// ── Active palette state ─────────────────────────────────────────────

let _activePalette: Palette | null = null;
let _activePaletteName: PaletteName | null = null;

/** Set the active palette by name. Call once at player init. */
export function setActivePalette(name: string): void {
  if (name === 'default' || !name) {
    _activePalette = null;
    _activePaletteName = null;
    return;
  }
  const palette = PALETTES[name as PaletteName];
  if (palette) {
    _activePalette = palette;
    _activePaletteName = name as PaletteName;
  } else {
    _activePalette = null;
    _activePaletteName = null;
  }
}

/** Get the active palette name, or null if using default. */
export function getActivePaletteName(): PaletteName | null {
  return _activePaletteName;
}

/** Get semantic category for an entity type. */
export function getSemanticCategory(type: string): SemanticCategory {
  return TYPE_TO_CATEGORY[type] ?? 'generic';
}

/** Get particle colors for the active palette (for ambient particles). */
export function getParticleColors(): string[] {
  if (_activePalette) return _activePalette.particles;
  return PALETTES.default.particles;
}

/** Get default color for an entity type. Falls back to cyan. */
export function getCategoryColor(type: string): string {
  // Connectors always use white regardless of palette
  if (ENTITY_COLORS[type] === '#ffffff') return '#ffffff';
  // If a non-default palette is active, use semantic category mapping
  if (_activePalette) {
    const category = getSemanticCategory(type);
    return _activePalette[category];
  }
  // Default: use the detailed per-type ENTITY_COLORS map
  return ENTITY_COLORS[type] ?? COLORS.cyan;
}
