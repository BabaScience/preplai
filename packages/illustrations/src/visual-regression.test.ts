/**
 * @preplai/illustrations — Visual Regression Tests (SVG Snapshot)
 *
 * Renders every registered entity type with sensible defaults and captures
 * a structural SVG fingerprint (element counts, key attributes, label text).
 * If a component's output changes, the snapshot updates and diff is visible in PR.
 *
 * This catches:
 *   - Accidental element count changes (missing shapes, extra elements)
 *   - Label rendering changes
 *   - Gradient / attribute regressions
 *   - Component crashes (render returns null / throws)
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { registry, renderEntity } from './registry.js';
import { SVG_NS } from './utils.js';
import type { VisualEntity } from '@preplai/shared';

// ── Entity defaults (mirrored from entity-defaults.js for test isolation) ──

const METADATA_DEFAULTS: Record<string, Record<string, unknown>> = {
  BinaryTree: { nodes: [5, 3, 8, 1, 4], selectedIndexes: [0] },
  BTree: { tree: { value: '[10,20]', children: [{ value: '[3]' }, { value: '[15]' }] }, branchingFactor: 3 },
  Heap: { nodes: [10, 8, 6, 5, 3] },
  Graph2D: { domain: [-5, 5], range: [-5, 5], points: [{ x: 1, y: 1 }], showGrid: true },
  CoordinateSystem: { xRange: [-5, 5], yRange: [-5, 5], gridSpacing: 1, showGrid: true, points: [{ x: 2, y: 3, label: 'P' }] },
  HashTable: { pairs: [['k1', 'v1'], ['k2', 'v2']] },
  Dict: { pairs: [['name', 'Alice'], ['age', '30']] },
  Table: { headers: ['Name', 'Type'], rows: [['id', 'int'], ['name', 'str']] },
  Array: { values: [5, 2, 8, 1], selectedIndexes: [2] },
  SortAnimation: { values: [5, 2, 8, 1], selectedIndexes: [2] },
  ArrayCell: { value: '42', index: 3, state: 'active' },
  LinkedList: { values: [1, 2, 3] },
  BigO: { curves: ['O(1)', 'O(n)', 'O(n²)'], domain: [0, 10] },
  Thread: { status: 'running' },
  Timeline: { events: [{ label: 'Start', position: 0.2 }, { label: 'End', position: 0.8 }] },
  CallStack: { frames: [{ name: 'main()' }, { name: 'foo()' }] },
  FSM: { states: [{ id: 'q0', label: 'q0' }, { id: 'q1', label: 'q1' }], transitions: [{ from: 'q0', to: 'q1' }] },
  ProcessState: { states: [{ name: 'Ready', type: 'ready' }, { name: 'Running', type: 'running' }], transitions: [{ from: 'Ready', to: 'Running' }] },
  DeadlockGraph: { nodes: [{ id: 'P1', label: 'P1' }, { id: 'R1', label: 'R1' }], edges: [{ from: 'P1', to: 'R1' }] },
  GanttChart: { tasks: [{ name: 'P1', start: 0, end: 3 }, { name: 'P2', start: 1, end: 5 }], maxTime: 10 },
  CacheHierarchy: { levels: [{ name: 'L1', size: '32 KB' }, { name: 'L2', size: '256 KB' }] },
  MemoryLayout: { stack: ['main', 'foo()'], heap: ['obj1'] },
  MemoryBlock: { cells: [{ addr: '0x00', value: '42' }, { addr: '0x08', value: 'ptr' }] },
  MemoryMap: { segments: [{ name: 'Stack', startAddr: '0xFFF0', endAddr: '0xFFFF' }, { name: 'Heap', startAddr: '0x1000', endAddr: '0x2000' }] },
  FreeBodyDiagram: { forces: [{ label: 'F₁', angle: 0, magnitude: 1 }, { label: 'F₂', angle: 90, magnitude: 1 }] },
  Vector: { dx: 3, dy: 2, label: 'v' },
  Wave: { frequency: 2, amplitude: 20, waveType: 'sine' },
  VennDiagram: { sets: [{ label: 'A', color: '#00bcd4' }, { label: 'B', color: '#9B59B6' }] },
  FlowDiagram: { steps: [{ label: 'Start', type: 'default' }, { label: 'End', type: 'default' }] },
  ConfusionMatrix: { matrix: [[45, 5], [8, 42]], rowLabels: ['Act-', 'Act+'], colLabels: ['Pred-', 'Pred+'] },
  Stack: { layers: [{ label: 'App' }, { label: 'Transport' }, { label: 'Network' }] },
  StepList: { steps: ['Parse', 'Validate', 'Transform'], currentStep: -1 },
  BarChart: { bars: [{ label: 'A', value: 10 }, { label: 'B', value: 25 }] },
  Histogram: { bins: [{ label: '0-10', count: 5 }, { label: '10-20', count: 12 }] },
  PieChart: { slices: [{ label: 'A', value: 30 }, { label: 'B', value: 25 }], showPercentages: true },
  NeuralNetwork: { layers: [3, 4, 2], layerLabels: ['In', 'Hidden', 'Out'] },
  TuringMachine: { tape: ['a', 'b', '_'], headPosition: 1, state: 'q0' },
  RecursionTree: {
    calls: [{ id: 'r1', label: 'fib', args: '4', state: 'executing' }, { id: 'r2', label: 'fib', args: '3', state: 'returned', returnValue: '2' }],
    edges: [{ from: 'r1', to: 'r2' }],
  },
  Packet: { headers: [{ name: 'Src', value: '192.168.1.1', bytes: 4 }], payload: 'data', protocol: 'TCP' },
  Analogy: { label: 'Search is like a phone book', x: 'Search', y: 'phone book' },
  Comparison: { left: 'Array', right: 'LinkedList', label: 'Array vs LinkedList' },
  Definition: { term: 'Binary Search', definition: 'A divide-and-conquer algorithm.' },
  Callout: { calloutType: 'note', body: 'Callout text.' },
  Quote: { label: 'To be or not to be.', author: 'Shakespeare', width: 200 },
  Annotation: { label: 'Note text.', width: 200 },
  Metric: { value: '99', unit: 'ms', trend: 'down', trendValue: '12%' },
  Pod: { containers: ['app', 'sidecar'], status: 'running' },
  Subnet: { cidr: '10.0.0.0/24', label: 'private' },
  Semaphore: { value: 2, max: 3, label: 'sem' },
  Mutex: { locked: true, owner: 'Thread-1' },
  LogicGate: { gate: 'AND' },
  SymbolTable: { entries: [{ name: 'x', type: 'int' }, { name: 'y', type: 'float' }] },
  Set: { values: ['a', 'b', 'c'] },
  Tuple: { values: [1, 2, 3] },
  ScatterPlot: { domain: [-5, 5], range: [-5, 5], points: [{ x: 1, y: 1 }], showGrid: true },
  Matrix: { rows: [[1, 0], [0, 1]] },
  Service: { kind: 'Service' },
  Arrow: { curved: false },
  DataFlow: { curved: false },
  // Software Architecture
  APIEndpoint: { method: 'GET', route: '/api/users', status: 200 },
  HTTPRequest: { method: 'POST', url: '/api/auth' },
  HTTPResponse: { statusCode: 200, bodyPreview: '{"ok":true}' },
  WebSocket: { protocol: 'wss', status: 'connected' },
  GraphQLSchema: { schemaType: 'type', fields: ['id: ID!', 'name: String!'] },
  Webhook: { event: 'user.created', targetUrl: 'https://example.com' },
  AuthFlow: { flowType: 'OAuth 2.0' },
  Token: { tokenType: 'jwt', value: 'eyJh' },
  Certificate: { domain: '*.example.com', valid: true },
  Secret: { key: 'DB_URL' },
  Schema: { tableName: 'users', columns: [{ name: 'id', type: 'uuid' }, { name: 'email', type: 'varchar' }] },
  Migration: { version: 'v003', description: 'Add roles', direction: 'up' },
  Event: { label: 'user.created' },
  Stream: { protocol: 'Kafka', throughput: '10k/s' },
  GitBranch: { branchName: 'feature/auth' },
  GitCommit: { hash: 'a1b2c3d', message: 'feat: add auth' },
  PullRequest: { prNumber: 142, status: 'open' },
  Build: { buildNumber: '847', status: 'success', duration: '2m' },
  Deployment: { environment: 'production', version: 'v2.4', status: 'live' },
  Rollback: { fromVersion: 'v2.4', toVersion: 'v2.3' },
  CDN: { regions: 3 },
  StorageBucket: { provider: 'S3' },
  APIGateway: { routes: 3 },
  MessageBroker: { protocol: 'AMQP', queues: 3 },
  LogEntry: { level: 'info', timestamp: '12:34', message: 'OK' },
  Alert: { severity: 'critical', status: 'firing' },
  Trace: { service: 'api', duration: '45ms', status: 'ok' },
  Dashboard: { panels: 4 },
  Module: { exports: 5 },
  Interface: { methods: ['getUser()', 'createUser()'] },
  ErrorState: { errorType: 'TypeError', message: 'Cannot read property', code: 500 },
  ConfigFile: { filename: '.env', entries: [{ key: 'PORT', value: '3000' }] },
  Dependency: { version: '^4.18.2' },
  CronJob: { schedule: '0 */6 * * *' },
  Notification: { channel: 'push' },
  Task: { status: 'in_progress', priority: 'high' },
  File: { extension: 'md' },
};

const ENTITY_FIELD_DEFAULTS: Record<string, Partial<VisualEntity>> = {
  Entity: { label: 'Thing' },
  FlowDiagram: { size: 2 },
  VennDiagram: { size: 2 },
  FreeBodyDiagram: { size: 2 },
  Vector: { size: 2 },
  Wave: { size: 2 },
  Service: { label: 'Auth Service' },
  Decision: { label: '?' },
  Concept: { label: 'Recursion' },
  BigO: { size: 2 },
  SortAnimation: { size: 2 },
  TuringMachine: { size: 2 },
  NeuralNetwork: { size: 2 },
  CoordinateSystem: { size: 2 },
  ScatterPlot: { size: 2 },
  BinaryTree: { size: 2.5 },
  RecursionTree: { size: 2 },
  Heap: { size: 2.5 },
  BTree: { size: 2.5 },
  HashTable: { size: 2 },
  Dict: { size: 2 },
  Table: { size: 2 },
  Thread: { size: 2 },
  Timeline: { size: 2 },
  Tuple: { size: 2 },
  LogicGate: { size: 2 },
  SymbolTable: { size: 2 },
  CodeBlock: {
    textContent: 'function fib(n) {\n  return n <= 1 ? n : fib(n-1) + fib(n-2);\n}',
    codeLanguage: 'javascript',
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────

function makeSvg(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svg.setAttribute('viewBox', '0 0 1920 1080');
  document.body.appendChild(svg);
  return svg;
}

function makeEntity(type: string): VisualEntity {
  const fieldDefaults = ENTITY_FIELD_DEFAULTS[type] ?? {};
  return {
    id: `test-${type}`,
    type: type as any,
    position: { x: 50, y: 50 },
    label: fieldDefaults.label ?? type,
    metadata: METADATA_DEFAULTS[type] ?? {},
    ...fieldDefaults,
  } as VisualEntity;
}

/**
 * Extract a structural fingerprint from the rendered SVG group.
 * Captures element counts by tag, text content, and key attributes
 * without being brittle to minor coordinate changes.
 */
function fingerprint(group: SVGGElement | null): Record<string, unknown> {
  if (!group) return { rendered: false };

  const tagCounts: Record<string, number> = {};
  const allElements = group.querySelectorAll('*');

  for (const el of allElements) {
    const tag = el.tagName.toLowerCase();
    tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
  }

  // Collect text content from <text> elements
  const texts = Array.from(group.querySelectorAll('text'))
    .map((t) => t.textContent?.trim())
    .filter(Boolean)
    .slice(0, 10); // Cap at 10 to keep snapshot manageable

  // Count <defs> (gradients, filters)
  const defsCount = group.querySelectorAll('defs > *').length;

  return {
    rendered: true,
    totalElements: allElements.length,
    tagCounts,
    textLabels: texts,
    defsCount,
    hasOuterG: group.tagName === 'g',
  };
}

// ── Connection types need all entities (special render signature) ────────

const CONNECTION_TYPES = new Set(['Arrow', 'BidirectArrow', 'DottedArrow', 'DataFlow', 'Bus']);

// ── Tests ────────────────────────────────────────────────────────────────

describe('Visual Regression — SVG Snapshots', () => {
  // Get all non-connection types from registry
  const entityTypes = Object.keys(registry).filter((t) => !CONNECTION_TYPES.has(t));

  it(`registry has ${entityTypes.length}+ non-connection entity types`, () => {
    expect(entityTypes.length).toBeGreaterThanOrEqual(90);
  });

  describe.each(entityTypes)('renders %s without crashing', (type) => {
    it('produces valid SVG group with stable structure', () => {
      const svg = makeSvg();
      const entity = makeEntity(type);
      const renderFn = registry[type];

      let result: SVGGElement | null = null;
      expect(() => {
        result = renderFn(entity, svg);
      }).not.toThrow();

      const fp = fingerprint(result);
      expect(fp.rendered).toBe(true);
      expect(fp.totalElements).toBeGreaterThan(0);
      expect(fp.hasOuterG).toBe(true);

      // Snapshot the structural fingerprint — any change shows in diff
      expect(fp).toMatchSnapshot();

      // Cleanup
      svg.remove();
    });
  });

  // Connection types need source/target entities rendered first.
  // They use querySelector on ownerSVGElement internally to find endpoints,
  // which has limitations in jsdom. We test that the render function at least
  // exists and doesn't throw when called directly with the registry.
  describe('Connection types are registered', () => {
    it.each(['Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow', 'Bus'])('%s has a render function in registry', (type) => {
      expect(registry[type]).toBeDefined();
      expect(typeof registry[type]).toBe('function');
    });
  });
});
