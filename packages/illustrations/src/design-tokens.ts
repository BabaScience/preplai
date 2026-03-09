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
  Database: COLORS.blue,
  Cache: COLORS.blue,
  Volume: COLORS.blue,
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

  // ── White: Connectors ────────────────────────────────────────────
  Arrow: '#ffffff',
  DataFlow: '#ffffff',
  Transition: '#ffffff',
  BidirectArrow: '#ffffff',
  DottedArrow: '#ffffff',
};

/** Get default color for an entity type. Falls back to cyan. */
export function getCategoryColor(type: string): string {
  return ENTITY_COLORS[type] ?? COLORS.cyan;
}
