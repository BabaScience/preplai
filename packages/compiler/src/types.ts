/**
 * @preplai/compiler — Compiler-specific Types
 *
 * CompileResult, error/warning types, and compiler constants.
 * These types are private to the compiler package; they are not re-exported
 * from @preplai/shared because they are build-time concerns, not runtime data model.
 */

import type { VisualScript } from '@preplai/shared';

// ── Error & Warning Codes ─────────────────────────────────────────────

export type CompilerErrorCode =
  | 'SCHEMA_VALIDATION_FAILED'
  | 'DUPLICATE_ENTITY_ID'
  | 'DUPLICATE_FRAME_ID'
  | 'FRAME_ORDER_INVALID'
  | 'INVALID_PARENT_REF';

export type CompilerWarningCode =
  | 'UNKNOWN_ENTITY_TYPE'
  | 'POSITION_CLAMPED'
  | 'NAN_POSITION_RESET'
  | 'UNRESOLVED_SOURCE_REF'
  | 'UNRESOLVED_TARGET_REF'
  | 'UNRESOLVED_PARENT_REF'
  | 'FRAME_DURATION_EXTENDED'
  | 'ENTITY_BARELY_VISIBLE'
  | 'ENTITY_COUNT_HIGH';

// ── Compiler Error & Warning ──────────────────────────────────────────

export interface CompilerError {
  code: CompilerErrorCode;
  message: string;
  suggestion: string;
  path?: string;
}

export interface CompilerWarning {
  code: CompilerWarningCode;
  message: string;
  entityId?: string;
  frameId?: string;
}

// ── CompileResult ─────────────────────────────────────────────────────

export type CompileResult =
  | { success: true; script: VisualScript; warnings: CompilerWarning[] }
  | { success: false; errors: CompilerError[] };

// ── Known Entity Types ────────────────────────────────────────────────

export const KNOWN_ENTITY_TYPES: ReadonlySet<string> = new Set([
  // Infrastructure (15)
  'User', 'Server', 'Database', 'Container', 'Pod',
  'Cloud', 'Network', 'Device', 'Arrow', 'DataFlow',
  'Process', 'Queue', 'Cache', 'LoadBalancer', 'Service',
  // Extended Infrastructure (10)
  'Firewall', 'API', 'APIGateway', 'Lambda', 'Subnet', 'Volume',
  'Registry', 'Monitor', 'Pipeline', 'Decision', 'Cluster',
  // Flow / Connection (2)
  'BidirectArrow', 'DottedArrow',
  // Abstract / Universal (12)
  'Concept', 'Entity', 'Group', 'Label', 'Comparison',
  'Timeline', 'Metric', 'Cycle', 'Stack', 'Tree',
  'Badge', 'Quote',
  // Headings (3)
  'H1', 'H2', 'H3',
  // Math & Science (6)
  'Equation', 'Expression', 'Matrix', 'Graph2D',
  'CoordinateSystem',
  // Physics (6)
  'FreeBodyDiagram', 'Circuit', 'Wave', 'Vector', 'Field',
  // General Purpose (8)
  'Table', 'Histogram', 'PieChart', 'FlowDiagram', 'VennDiagram',
  'Annotation', 'BarChart', 'ScatterPlot',
  // Pedagogical (6)
  'StepList', 'CodeBlock', 'Definition', 'Callout', 'Proof', 'Analogy',
  // Data Structures (7)
  'Array', 'LinkedList', 'BinaryTree', 'HashTable', 'Heap', 'GraphDS', 'Trie',
  // Algorithm Visualization (3)
  'ArrayCell', 'RecursionTree',
  // Automata & Theory (3)
  'FSM', 'StateNode', 'Transition',
  // Computer Architecture (5)
  'CPU', 'Register', 'MemoryBlock', 'LogicGate', 'Bus',
  // Operating Systems (3)
  'ProcessBlock', 'MemoryMap', 'Thread',
  // Networking (2)
  'Packet', 'ProtocolStack',
  // Machine Learning (1)
  'NeuralNetwork',
]);

// ── Type-specific Size Defaults (base pixel dimensions at size=1.0) ────
// Used for clamping: half-width/height converted to % determines min margin.

export const BASE_ENTITY_SIZES: ReadonlyMap<string, { w: number; h: number }> = new Map([
  // Default fallback for unknown / unspecified types
  ['_default', { w: 80, h: 60 }],
  // Infrastructure
  ['User',         { w: 60,  h: 80  }],
  ['Server',       { w: 80,  h: 100 }],
  ['Database',     { w: 80,  h: 100 }],
  ['Container',    { w: 120, h: 80  }],
  ['Pod',          { w: 80,  h: 60  }],
  ['Cloud',        { w: 140, h: 80  }],
  ['Network',      { w: 120, h: 80  }],
  ['Device',       { w: 80,  h: 80  }],
  ['Arrow',        { w: 100, h: 20  }],
  ['DataFlow',     { w: 100, h: 20  }],
  ['BidirectArrow',{ w: 100, h: 20  }],
  ['DottedArrow',  { w: 100, h: 20  }],
  ['Process',      { w: 80,  h: 60  }],
  ['Queue',        { w: 120, h: 60  }],
  ['Cache',        { w: 80,  h: 80  }],
  ['LoadBalancer', { w: 80,  h: 60  }],
  ['Service',      { w: 80,  h: 60  }],
  // Abstract
  ['Concept',  { w: 100, h: 60 }],
  ['Entity',   { w: 80,  h: 60 }],
  ['Group',    { w: 200, h: 150 }],
  ['Label',    { w: 100, h: 40 }],
  ['H1',       { w: 200, h: 60 }],
  ['H2',       { w: 180, h: 50 }],
  ['H3',       { w: 160, h: 45 }],
  ['CodeBlock',{ w: 200, h: 120 }],
  ['Table',    { w: 200, h: 120 }],
]);

// ── Arrow-like types (skip position clamping) ─────────────────────────

export const SKIP_CLAMP_TYPES: ReadonlySet<string> = new Set([
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow',
]);
