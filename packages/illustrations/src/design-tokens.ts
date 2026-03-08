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

/** Get font size for a label role. Fixed at 15px for consistent label sizing across illustrations. */
export function getLabelFontSize(role: LabelRole, _scale: number = 1): number {
  return TYPOGRAPHY.fontSizeDefault;
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

// ── Entity type → default color mapping ────────────────────────────────

export const ENTITY_COLORS: Record<string, string> = {
  // Infrastructure
  User: COLORS.pink,
  Server: COLORS.cyan,
  Database: COLORS.violet,
  Cloud: COLORS.teal,
  Container: COLORS.green,
  Pod: COLORS.green,
  Network: COLORS.cyan,
  Device: COLORS.orange,
  Arrow: '#ffffff',
  DataFlow: COLORS.violet,
  Process: COLORS.teal,
  Queue: COLORS.orange,
  Cache: COLORS.green,
  LoadBalancer: COLORS.cyan,
  Service: COLORS.cyan,
  Firewall: COLORS.red,
  Lambda: COLORS.orange,
  Subnet: COLORS.blue,
  Volume: COLORS.violet,
  Registry: COLORS.green,
  DNSResolver: COLORS.teal,
  Decorator: COLORS.violet,
  Tmpfs: COLORS.pink,
  DockerImage: COLORS.blue,
  DockerRegistry: COLORS.green,
  Monitor: COLORS.green,
  Pipeline: COLORS.teal,
  Decision: COLORS.orange,
  Cluster: COLORS.blue,
  // Universal
  Concept: COLORS.cyan,
  Entity: COLORS.cyan,
  Group: COLORS.teal,
  Label: COLORS.orange,
  H1: COLORS.cyan,
  H2: COLORS.violet,
  H3: COLORS.gold,
  Comparison: COLORS.orange,
  Timeline: COLORS.green,
  Metric: COLORS.pink,
  Cycle: COLORS.teal,
  Stack: COLORS.violet,
  Tree: COLORS.green,
  Badge: COLORS.red,
  Quote: COLORS.violet,
  // Math & Science
  Equation: COLORS.cyan,
  Expression: COLORS.cyan,
  Matrix: COLORS.violet,
  Graph2D: COLORS.cyan,
  NumberLine: COLORS.cyan,
  CoordinateSystem: COLORS.cyan,
  // Physics
  FreeBodyDiagram: COLORS.orange,
  Circuit: COLORS.orange,
  Wave: COLORS.teal,
  Vector: COLORS.pink,
  Field: COLORS.violet,
  Particle: COLORS.pink,
  // General
  Table: COLORS.cyan,
  Histogram: COLORS.green,
  PieChart: COLORS.cyan,
  FlowDiagram: COLORS.teal,
  VennDiagram: COLORS.cyan,
  Annotation: COLORS.orange,
  BarChart: COLORS.cyan,
  ScatterPlot: COLORS.cyan,
  // Pedagogical
  StepList: COLORS.cyan,
  CodeBlock: COLORS.violet,
  Definition: COLORS.green,
  Callout: COLORS.orange,
  Goal: COLORS.gold,
  Proof: COLORS.violet,
  Analogy: COLORS.cyan,
  // Data Structures
  Array: COLORS.cyan,
  LinkedList: COLORS.green,
  BinaryTree: COLORS.violet,
  HashTable: COLORS.orange,
  Heap: COLORS.teal,
  GraphDS: COLORS.cyan,
  Trie: COLORS.green,
  List: COLORS.cyan,
  Tuple: COLORS.violet,
  Set: COLORS.gold,
  Dict: COLORS.orange,
  // Algorithm
  ArrayCell: COLORS.cyan,
  Pointer: COLORS.red,
  RecursionTree: COLORS.violet,
  // Automata
  FSM: COLORS.cyan,
  StateNode: COLORS.green,
  Transition: '#ffffff',
  // Computer Architecture
  CPU: COLORS.cyan,
  Register: COLORS.orange,
  MemoryBlock: COLORS.violet,
  LogicGate: COLORS.green,
  Bus: COLORS.cyan,
  // OS
  ProcessBlock: COLORS.teal,
  MemoryMap: COLORS.violet,
  Thread: COLORS.green,
  // Networking
  Packet: COLORS.cyan,
  ProtocolStack: COLORS.orange,
  // ML
  NeuralNetwork: COLORS.violet,
  DecisionBoundary: COLORS.cyan,
  // Compilers & PL
  CallStack: COLORS.orange,
  ParseTree: COLORS.violet,
  SymbolTable: COLORS.teal,
  // Databases
  BTree: COLORS.green,
  QueryPlan: COLORS.cyan,
  // OS
  ProcessState: COLORS.teal,
  GanttChart: COLORS.green,
  PageTable: COLORS.violet,
  DeadlockGraph: COLORS.red,
  // Architecture
  CacheHierarchy: COLORS.cyan,
  PipelineStage: COLORS.orange,
  MemoryLayout: COLORS.violet,
  // Concurrency
  Semaphore: COLORS.orange,
  Mutex: COLORS.red,
  // Networking extended
  OSILayer: COLORS.cyan,
  ProtocolLayer: COLORS.teal,
  // Theory
  TuringMachine: COLORS.violet,
  BigO: COLORS.gold,
  // Algorithms extended
  SortAnimation: COLORS.cyan,
  GraphTraversal: COLORS.green,
  // ML extended
  ConfusionMatrix: COLORS.pink,
};

/** Get default color for an entity type. Falls back to cyan. */
export function getCategoryColor(type: string): string {
  return ENTITY_COLORS[type] ?? COLORS.cyan;
}
