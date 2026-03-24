/**
 * @preplai/shared — Entity Type Classification
 *
 * Canonical sets for classifying entity types. Used by compiler, quality scorer,
 * quality guards, scene controller, and any code that needs to distinguish
 * arrows from content entities, headings, etc.
 *
 * Single source of truth — no package should redefine these sets.
 */

// ── Arrow Types (directional connectors) ─────────────────────────────

export const ARROW_TYPES: ReadonlySet<string> = new Set([
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow',
]);

// ── Connection Types (all link/edge entities) ────────────────────────

export const CONNECTION_TYPES: ReadonlySet<string> = new Set([
  ...ARROW_TYPES,
  'Transition', 'Bus',
]);

// ── Heading Types ────────────────────────────────────────────────────

export const HEADING_TYPES: ReadonlySet<string> = new Set([
  'H1', 'H2', 'H3',
]);

// ── Types that require metadata to render correctly ──────────────────

export const METADATA_REQUIRED_TYPES: ReadonlySet<string> = new Set([
  'Graph2D', 'Equation', 'Matrix', 'Table', 'Circuit',
  'FreeBodyDiagram', 'Comparison', 'Proof', 'Timeline',
  'Stack', 'PieChart', 'Histogram', 'BarChart', 'ScatterPlot',
  'VennDiagram', 'StepList', 'Definition',
]);

// ── Types that skip position clamping (compiler) ─────────────────────

export const SKIP_CLAMP_TYPES: ReadonlySet<string> = new Set([
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow',
]);

// ── "Always visible" types (never blurred by focus system) ───────────

export const ALWAYS_VISIBLE_TYPES: ReadonlySet<string> = new Set([
  'H1', 'H2', 'H3', 'Label', 'StepList', 'Badge', 'Quote',
  'Definition', 'Callout', 'Annotation', 'Table',
]);

// ── Complete set of known entity types ───────────────────────────────
// This is the superset — the compiler uses it to warn on unknown types.
// Keep in sync with VisualEntityType union in types.ts.

export const KNOWN_ENTITY_TYPES: ReadonlySet<string> = new Set([
  // Infrastructure (15)
  'User', 'Server', 'Database', 'Container', 'Pod',
  'Cloud', 'Network', 'Device', 'Arrow', 'DataFlow',
  'Process', 'Queue', 'Cache', 'LoadBalancer', 'Service',
  // Extended Infrastructure (10)
  'Firewall', 'Lambda', 'Subnet', 'Volume',
  'Registry', 'Monitor', 'Pipeline', 'Decision', 'Cluster',
  // Docker & Storage (6)
  'DNSResolver', 'Decorator', 'Tmpfs',
  'DockerImage', 'DockerRegistry',
  // Flow / Connection (2)
  'BidirectArrow', 'DottedArrow',
  // Abstract / Universal (12)
  'Concept', 'Entity', 'Group', 'Label', 'Comparison',
  'H1', 'H2', 'H3',
  'Timeline', 'Metric', 'Cycle', 'Stack',
  'Badge', 'Quote',
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
  // Data Structures (11)
  'Array', 'LinkedList', 'BinaryTree', 'HashTable', 'Heap', 'GraphDS', 'Trie',
  'List', 'Tuple', 'Set', 'Dict',
  // Algorithm Visualization (3)
  'ArrayCell', 'RecursionTree',
  // Automata & Theory (3)
  'FSM', 'StateNode', 'Transition',
  // Computer Architecture (5)
  'CPU', 'Register', 'MemoryBlock', 'LogicGate', 'Bus',
  // Operating Systems (3)
  'ProcessBlock', 'MemoryMap', 'Thread',
  // Networking (1)
  'Packet',
  // Machine Learning (1)
  'NeuralNetwork',
  // Compilers & PL (2)
  'CallStack', 'SymbolTable',
  // Databases (2)
  'BTree', 'QueryPlan',
  // Operating Systems (4)
  'ProcessState', 'GanttChart', 'DeadlockGraph',
  // Architecture (3)
  'CacheHierarchy', 'PipelineStage', 'MemoryLayout',
  // Concurrency (2)
  'Semaphore', 'Mutex',
  // Theory (2)
  'TuringMachine', 'BigO',
  // Algorithms extended (2)
  'SortAnimation', 'GraphTraversal',
  // ML extended (1)
  'ConfusionMatrix',
  // Phase 1: Core Architecture Diagrams (5)
  'SequenceDiagram', 'EREntity', 'ClassNode', 'SystemBoundary', 'CircuitBreaker',
  // Phase 2: Domain-Specific (8)
  'ComponentNode', 'DataLake', 'DataWarehouse', 'MLModel',
  'FeatureStore', 'MindMapNode', 'UserJourneyStep', 'DeploymentStrategy',
  // Phase 3: Microservices & Patterns (6)
  'Sidecar', 'DeadLetterQueue', 'RateLimiter', 'GPU', 'Bundle', 'SagaStep',
  // Software Architecture: API & Web (6)
  'APIEndpoint', 'HTTPRequest', 'HTTPResponse', 'WebSocket', 'GraphQLSchema', 'Webhook',
  // Software Architecture: Auth & Security (4)
  'AuthFlow', 'Token', 'Certificate', 'Secret',
  // Software Architecture: Data & Messaging (4)
  'Schema', 'Migration', 'Event', 'Stream',
  // Software Architecture: CI/CD & DevOps (6)
  'GitBranch', 'GitCommit', 'PullRequest', 'Build', 'Deployment', 'Rollback',
  // Software Architecture: Cloud Infrastructure (4)
  'CDN', 'StorageBucket', 'APIGateway', 'MessageBroker',
  // Software Architecture: Observability (4)
  'LogEntry', 'Alert', 'Trace', 'Dashboard',
  // Software Architecture: Code & Architecture (6)
  'Module', 'Interface', 'ErrorState', 'ConfigFile', 'Dependency', 'CronJob',
  // Software Architecture: Collaboration (3)
  'Notification', 'Task', 'File',
  // Composable (Tier 2)
  'Composable',
  // Text types
  'Text', 'Span',
]);
