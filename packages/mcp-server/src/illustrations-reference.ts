/**
 * @preplai/mcp-server — Illustrations Reference for Agents
 *
 * Builds the get_illustrations response: entity types, aliases, short keys,
 * topic hints, metadata hints. Single source for agent discovery.
 */
import { registry } from '@preplai/illustrations';
import { ENTITY_TYPE_ALIASES, AGENT_SHORT_KEYS } from '@preplai/compiler';
import { ENTITY_DEFAULTS } from '@preplai/shared';

// ── Topic → preferred types (from ILLUSTRATIONS_AGENT_GUIDE) ───────────────

const TOPIC_HINTS: Record<string, string[]> = {
  'cloud, saas, aws, gcp': ['Cloud'],
  'service, microservice, backend': ['Service'],
  'api, rest api, endpoint': ['Service'],
  'api gateway, routing': ['Service'],
  'dns, nameserver, domain resolution': ['DNSResolver'],
  'key concept, glossary term': ['Concept'],
  'code snippet, algorithm': ['CodeBlock'],
  'loop, lifecycle, retry': ['Cycle'],
  'electronic circuit': ['Circuit'],
  '2d plane, vectors, coordinates': ['CoordinateSystem'],
  'single vector, force, velocity': ['Vector'],
  'function plot, roc, scatter': ['Graph2D'],
  'big o, complexity curves': ['BigO'],
  'categorical comparison': ['BarChart'],
  'classification metrics': ['ConfusionMatrix'],
  'array, list, indices': ['Array'],
  'sorting algorithm, bubble sort, quicksort': ['SortAnimation'],
  'bst, heap, tree': ['BinaryTree', 'BTree'],
  'call stack, recursion': ['CallStack'],
  'recursion tree, call tree': ['RecursionTree'],
  'layered model, tech stack, osi': ['Stack'],
  'numbered steps, algorithm walkthrough': ['StepList'],
  'process states': ['ProcessState'],
  'main heading, title': ['H1'],
  'section heading': ['H2'],
  'subsection heading': ['H3'],
  'physical server, rack, host': ['Server'],
  'database, db': ['Database'],
  'key-value, map, dict': ['HashTable'],
  'analogy, x is like y': ['Analogy'],
  'long explanation': ['Definition', 'Callout', 'Analogy'],
  'frequency bins': ['Histogram'],
  'binary search on sorted array': ['Array'],
  'l1 l2 l3 cache hierarchy': ['CacheHierarchy'],
  'memory layout, stack heap': ['MemoryLayout'],
  'deadlock, resource allocation': ['DeadlockGraph'],
  'gantt, scheduling, timeline': ['GanttChart'],
  'fsm, state machine, automata': ['FSM'],
  'turing machine, computation': ['TuringMachine'],
  'wave, sine, oscillation': ['Wave'],
  'free body diagram, forces': ['FreeBodyDiagram'],
  'venn diagram, set overlap': ['VennDiagram'],
  'flowchart, process flow': ['FlowDiagram'],
  'table, rows, columns': ['Table'],
  'thread, concurrency': ['Thread'],
  'timeline, events': ['Timeline'],
  'infrastructure diagram': ['Server', 'Database', 'Cloud', 'Service', 'DNSResolver', 'Arrow', 'DataFlow'],
};

// ── Metadata hints by type (from COMPACT_REFERENCE, METADATA_SCHEMAS) ───────

const METADATA_HINTS: Record<string, string> = {
  // Infrastructure
  User: 'label?',
  Server: 'label?',
  Database: 'label?',
  Cloud: 'label?',
  Container: 'label?',
  Pod: 'label?',
  Network: 'label?',
  Device: 'label?',
  Process: 'label?',
  Queue: 'label?',
  Cache: 'label?',
  LoadBalancer: 'label?',
  Service: 'kind: "Service"|"API"|"APIGateway", hubLabel?',
  Firewall: 'label?',
  Lambda: 'label?',
  Subnet: 'label?',
  Volume: 'label?',
  DNSResolver: 'label?',
  Decorator: 'label?',
  DockerImage: 'label?',
  DockerRegistry: 'label?',
  Monitor: 'label?',
  Pipeline: 'label?',
  PipelineStage: 'label, status?',
  // Flow
  Arrow: 'sourceEntityId, targetEntityId; label?',
  BidirectArrow: 'sourceEntityId, targetEntityId; label?',
  DottedArrow: 'sourceEntityId, targetEntityId; label?',
  DataFlow: 'sourceEntityId, targetEntityId; label?',
  Bus: 'sourceEntityId, targetEntityId; label?',
  // Universal
  Concept: 'label? (≤12 chars inside, else below)',
  Entity: 'label?, width?',
  Group: 'label?',
  H1: 'label?',
  H2: 'label?',
  H3: 'label?',
  Comparison: 'left, right (or label parsed for "X vs Y")',
  Timeline: 'events: [{label, position}]',
  Metric: 'label?, value?',
  Cycle: 'label?',
  Stack: 'layers: [{label, sublabel?, color?}]',
  Badge: 'label?',
  Quote: 'label, author?, width?, maxLines?',
  // Math & Science
  Equation: 'expression?, width?',
  Expression: 'expression?, width?',
  Matrix: 'rows (2D array), rowLabels?, colLabels?',
  Graph2D: 'domain, range, points, expression?, curveType?, parametric?',
  CoordinateSystem: 'points, vectors, xRange?, yRange?, gridSpacing?, showGrid?',
  // Physics
  FreeBodyDiagram: 'forces: [{label, angle, magnitude?, color?}]',
  Vector: 'dx, dy, label?, showMagnitude?',
  Wave: 'frequency?, amplitude?, phase?',
  // General
  Table: 'headers, rows',
  Histogram: 'bins: [{label, count}]',
  PieChart: 'slices: [{label, value}], donut?, showPercentages?',
  FlowDiagram: 'steps: [{label, type?: default|decision}]',
  VennDiagram: 'sets: [{label, color?}]',
  Annotation: 'label, width?, maxLines?',
  BarChart: 'bars: [{label, value, color?}], xLabel?, yLabel?, horizontal?',
  ScatterPlot: 'points, domain?, range?, xLabel?, yLabel?',
  // Pedagogical
  StepList: 'steps, currentStep?, checkmarks?',
  CodeBlock: 'code or lines, codeLanguage?',
  Definition: 'term, definition',
  Callout: 'calloutType, body',
  Analogy: 'x, y or label (parsed for "X is like Y")',
  // Data Structures
  Array: 'values or cells, selectedIndexes?, compareIndexes?, swapIndexes?, doneIndexes?, pointerLabels?',
  LinkedList: 'values',
  BinaryTree: 'tree or nodes, disabledIndexes?, selectedIndexes?',
  BTree: 'tree, branchingFactor?',
  HashTable: 'pairs',
  Dict: 'pairs',
  Heap: 'nodes',
  List: 'values',
  Tuple: 'values',
  Set: 'values',
  // Algorithm
  ArrayCell: 'value, index, state: default|active|compare|swap|done',
  RecursionTree: 'calls, edges',
  SortAnimation: 'values, compareIndexes?, swapIndexes?, doneIndexes?, pointerLabels? (same as Array)',
  // Automata & Theory
  FSM: 'states, transitions',
  TuringMachine: 'tape, headPosition, state',
  BigO: 'curves?, domain?',
  // Architecture
  CacheHierarchy: 'levels: [{name, size?}]',
  MemoryLayout: 'stack, heap',
  CPU: 'label?',
  MemoryBlock: 'label?',
  LogicGate: 'label?',
  // OS
  ProcessState: 'states, transitions',
  GanttChart: 'tasks, maxTime?',
  DeadlockGraph: 'nodes, edges',
  MemoryMap: 'label?',
  Thread: 'status?',
  // Concurrency
  Semaphore: 'value?, max?, label?',
  Mutex: 'label?',
  // Networking
  Packet: 'headers, payload?, protocol?, highlightSection?',
  // ML
  NeuralNetwork: 'label?',
  ConfusionMatrix: 'matrix, rowLabels?, colLabels?',
  // Compilers
  CallStack: 'frames: [{name, locals?}]',
  SymbolTable: 'label?',
  // Misc
  Decision: 'label?',
  Cluster: 'label?',
};

// ── Public API ─────────────────────────────────────────────────────────────

export interface IllustrationsReference {
  entityTypes: string[];
  aliases: Record<string, string>;
  shortKeys: Record<string, string>;
  topicHints: Record<string, string[]>;
  metadataHints: Record<string, string>;
  positionFormat: string;
  defaultSize: number;
}

export function getIllustrationsReference(): IllustrationsReference {
  return {
    entityTypes: Object.keys(registry).sort(),
    aliases: { ...ENTITY_TYPE_ALIASES },
    shortKeys: { ...AGENT_SHORT_KEYS },
    topicHints: { ...TOPIC_HINTS },
    metadataHints: { ...METADATA_HINTS },
    positionFormat: '[x,y]',
    defaultSize: ENTITY_DEFAULTS.size,
  };
}
