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
  'api, rest api, endpoint': ['API'],
  'api gateway, routing': ['APIGateway'],
  'dns, nameserver, domain resolution': ['DNSResolver'],
  'key concept, glossary term': ['Concept'],
  'code snippet, algorithm': ['CodeBlock'],
  'loop, lifecycle, retry': ['Cycle'],
  'electronic circuit': ['Circuit'],
  '2d plane, vectors, coordinates': ['CoordinateSystem'],
  'function plot, roc, scatter': ['Graph2D'],
  'big o, complexity curves': ['BigO'],
  'categorical comparison': ['BarChart'],
  'classification metrics': ['ConfusionMatrix'],
  'array, list, indices': ['Array'],
  'bst, heap, tree': ['BinaryTree', 'BTree'],
  'call stack, recursion': ['CallStack'],
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
  'infrastructure diagram': ['Server', 'Database', 'Cloud', 'Service', 'API', 'APIGateway', 'DNSResolver', 'Arrow', 'DataFlow'],
};

// ── Metadata hints by type (from COMPACT_REFERENCE) ─────────────────────────

const METADATA_HINTS: Record<string, string> = {
  BinaryTree: 'tree or nodes, disabledIndexes?, selectedIndexes?',
  BTree: 'tree, branchingFactor?',
  Array: 'values or cells, disabledIndexes?, selectedIndexes?, pointerLabels?',
  CallStack: 'frames',
  Stack: 'layers',
  StepList: 'steps, currentStep?, checkmarks?',
  ProcessState: 'states, transitions',
  GanttChart: 'tasks, maxTime?',
  BarChart: 'bars, xLabel?, yLabel?, horizontal?',
  ConfusionMatrix: 'matrix, rowLabels?, colLabels?',
  Graph2D: 'domain, range, points, expression?, curveType?',
  CoordinateSystem: 'points, vectors, xRange?, yRange?',
  BigO: 'curves?, domain?',
  CodeBlock: 'code or lines',
  Circuit: 'components, connections',
  HashTable: 'pairs',
  CacheHierarchy: 'levels',
  MemoryLayout: 'stack, heap',
  AST: 'ast',
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
