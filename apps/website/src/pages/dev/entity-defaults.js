/**
 * Default metadata for entity types that require structured data.
 * Used by the illustration debug page so types render without user input.
 * Based on packages/illustrations/METADATA_SCHEMAS.md
 */

export const METADATA_DEFAULTS = {
  BinaryTree: {
    nodes: [5, 3, 8, 1, 4, 6, 9],
    disabledIndexes: [1, 3],
    selectedIndexes: [0, 2],
  },
  Heap: {
    nodes: [10, 8, 6, 5, 3, 2],
  },
  BTree: {
    tree: {
      value: '[10,20]',
      children: [
        { value: '[3,6]', children: [{ value: '1' }, { value: '4' }] },
        { value: '[15]', children: [{ value: '12' }] },
      ],
    },
    branchingFactor: 3,
  },
  Graph2D: {
    domain: [-5, 5],
    range: [-5, 5],
    xLabel: 'x',
    yLabel: 'y',
    showGrid: true,
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 4 },
    ],
  },
  CoordinateSystem: {
    xRange: [-5, 5],
    yRange: [-5, 5],
    gridSpacing: 1,
    showGrid: true,
    xLabel: 'x',
    yLabel: 'y',
    points: [
      { x: 2, y: 3, label: 'P' },
      { x: -3, y: 1, label: 'Q' },
    ],
    vectors: [
      { dx: 3, dy: 2, label: 'v⃗' },
      { dx: -2, dy: 4, label: 'w⃗', color: '#e040fb' },
    ],
  },
  HashTable: {
    pairs: [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ],
  },
  Table: {
    headers: ['Name', 'Type', 'Value'],
    rows: [
      ['id', 'int', '42'],
      ['name', 'str', 'Alice'],
      ['active', 'bool', 'true'],
    ],
  },
  Thread: {
    status: 'running',
  },
  Timeline: {
    events: [
      { label: 'Start', position: 0.2 },
      { label: 'Process', position: 0.5 },
      { label: 'End', position: 0.8 },
    ],
  },
  Dict: {
    pairs: [
      ['name', 'Alice'],
      ['age', '30'],
      ['city', 'NYC'],
      ['role', 'developer'],
    ],
  },
  CallStack: {
    frames: [
      { name: 'main()' },
      { name: 'processRequest()', locals: 'req, res' },
      { name: 'handleQuery()', locals: 'sql' },
    ],
  },
  DeadlockGraph: {
    nodes: [
      { id: 'P1', label: 'P1' },
      { id: 'R1', label: 'R1' },
      { id: 'P2', label: 'P2' },
      { id: 'R2', label: 'R2' },
    ],
    edges: [
      { from: 'P1', to: 'R1' },
      { from: 'R1', to: 'P2' },
      { from: 'P2', to: 'R2' },
      { from: 'R2', to: 'P1' },
    ],
  },
  ProcessState: {
    states: [
      { name: 'Ready', type: 'ready' },
      { name: 'Running', type: 'running' },
      { name: 'Blocked', type: 'blocked' },
    ],
    transitions: [
      { from: 'Ready', to: 'Running' },
      { from: 'Running', to: 'Blocked' },
    ],
  },
  FSM: {
    states: [
      { id: 'q0', label: 'q0' },
      { id: 'q1', label: 'q1' },
      { id: 'q2', label: 'q2' },
    ],
    transitions: [
      { from: 'q0', to: 'q1' },
      { from: 'q1', to: 'q2' },
      { from: 'q2', to: 'q0' },
    ],
  },
  GanttChart: {
    tasks: [
      { name: 'P1', start: 0, end: 3 },
      { name: 'P2', start: 1, end: 5 },
      { name: 'P3', start: 4, end: 7 },
    ],
    maxTime: 10,
  },
  CacheHierarchy: {
    levels: [
      { name: 'L1', size: '32 KB' },
      { name: 'L2', size: '256 KB' },
      { name: 'L3', size: '8 MB' },
      { name: 'RAM', size: '16 GB' },
    ],
  },
  MemoryLayout: {
    stack: ['main', 'foo()', 'bar()'],
    heap: ['obj1', 'arr', 'node'],
  },
  MemoryBlock: {
    cells: [
      { addr: '0x0000', value: 'main' },
      { addr: '0x0008', value: '42' },
      { addr: '0x0010', value: 'ptr' },
      { addr: '0x0018', value: '0x0020' },
    ],
  },
  MemoryMap: {
    segments: [
      { name: 'Stack', startAddr: '0xFFF0', endAddr: '0xFFFF', growDirection: 'down' },
      { name: 'Heap', startAddr: '0x1000', endAddr: '0x2000', growDirection: 'up' },
      { name: 'BSS', startAddr: '0x0800', endAddr: '0x1000' },
      { name: 'Data', startAddr: '0x0600', endAddr: '0x0800' },
      { name: 'Text', startAddr: '0x0000', endAddr: '0x0600' },
    ],
  },
  FreeBodyDiagram: {
    forces: [
      { label: 'F₁', angle: 0, magnitude: 1 },
      { label: 'F₂', angle: 90, magnitude: 1 },
      { label: 'F₃', angle: 180, magnitude: 1 },
      { label: 'N', angle: 270, magnitude: 1 },
    ],
  },
  Vector: {
    dx: 3,
    dy: 2,
    label: 'v⃗',
    showMagnitude: false,
  },
  Wave: {
    frequency: 2,
    amplitude: 20,
    phase: 0,
    waveType: 'sine',
  },
  VennDiagram: {
    sets: [
      { label: 'A', color: '#00bcd4' },
      { label: 'B', color: '#9B59B6' },
    ],
  },
  FlowDiagram: {
    steps: [
      { label: 'Start', type: 'default' },
      { label: 'Condition?', type: 'decision' },
      { label: 'Process', type: 'default' },
      { label: 'End', type: 'default' },
    ],
  },
  ConfusionMatrix: {
    matrix: [
      [45, 5],
      [8, 42],
    ],
    rowLabels: ['Actual -', 'Actual +'],
    colLabels: ['Pred -', 'Pred +'],
  },
  // Card types (inherit from text-card)
  Arrow: {
    curved: false,
  },
  DataFlow: {
    curved: false,
  },
  Analogy: {
    label: 'Binary search is like a phone book',
    x: 'Binary search',
    y: 'phone book',
  },
  Annotation: { label: 'Add your annotation here.', width: 200, maxLines: 6 },
  H1: { label: 'Main Heading' },
  H2: { label: 'Section Heading' },
  H3: { label: 'Subsection Heading' },
  Comparison: { left: 'Array', right: 'LinkedList', label: 'Array vs LinkedList' },
  Proof: { label: 'Proof step or statement.', width: 200, maxLines: 6 },
  Definition: { term: 'Binary Search', definition: 'A divide-and-conquer algorithm that finds a target in a sorted array by repeatedly halving the search space.' },
  Callout: { calloutType: 'note', body: 'Callout body text goes here.' },
  Stack: {
    layers: [
      { label: 'Application', sublabel: 'HTTP, DNS' },
      { label: 'Transport', sublabel: 'TCP, UDP' },
      { label: 'Network', sublabel: 'IP' },
      { label: 'Link', sublabel: 'Ethernet' },
      { label: 'Physical', sublabel: 'Cables, signals' },
    ],
  },
  Array: {
    values: [5, 2, 8, 1, 9, 3],
    selectedIndexes: [2],
    compareIndexes: [1, 2],
    swapIndexes: [],
    doneIndexes: [0],
  },
  SortAnimation: {
    values: [5, 2, 8, 1, 9, 3],
    selectedIndexes: [2],
    compareIndexes: [1, 2],
    swapIndexes: [],
    doneIndexes: [0],
  },
  ArrayCell: {
    value: '42',
    index: 3,
    state: 'active',
  },
  LinkedList: {
    values: [1, 2, 3, 4],
  },
  BigO: {
    curves: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'],
    domain: [0, 10],
  },
  TuringMachine: {
    tape: ['a', 'b', '_', 'a', 'b', '_'],
    headPosition: 2,
    state: 'q0',
  },
  StepList: {
    steps: ['Parse', 'Validate', 'Transform', 'Output'],
    currentStep: -1,
    checkmarks: false,
  },
  BarChart: {
    bars: [
      { label: 'Jan', value: 10 },
      { label: 'Feb', value: 25 },
      { label: 'Mar', value: 15 },
      { label: 'Apr', value: 30 },
      { label: 'May', value: 22 },
    ],
    xLabel: 'Month',
    yLabel: 'Value',
    horizontal: false,
  },
  Histogram: {
    bins: [
      { label: '0-10', count: 5 },
      { label: '10-20', count: 12 },
      { label: '20-30', count: 8 },
      { label: '30-40', count: 15 },
      { label: '40-50', count: 6 },
    ],
  },
  PieChart: {
    slices: [
      { label: 'A', value: 30 },
      { label: 'B', value: 25 },
      { label: 'C', value: 20 },
      { label: 'D', value: 15 },
      { label: 'E', value: 10 },
    ],
    donut: false,
    showPercentages: true,
  },
  Service: { kind: 'Service', hubLabel: undefined },
  Entity: { label: 'Thing', width: 72 },
  Concept: { label: 'Recursion', width: 80, maxLines: 4 },
  Equation: { expression: 'E = mc²' },
  Expression: { expression: 'f(x) = x^2' },
  Matrix: {
    rows: [
      [1, 0],
      [0, 1],
    ],
  },
  Metric: {
    value: '99',
    unit: 'ms',
    trend: 'down',
    trendValue: '12%',
  },
  Monitor: {
    label: 'CPU',
  },
  NeuralNetwork: {
    layers: [3, 4, 3, 2],
    layerLabels: ['Input', 'Hidden 1', 'Hidden 2', 'Output'],
    showWeights: false,
  },
  Pod: {
    containers: ['app', 'sidecar'],
    status: 'running',
  },
  PipelineStage: {
    label: 'Build',
    status: 'pending',
  },
  Quote: {
    label: 'The only way to do great work is to love what you do.',
    author: '— Steve Jobs',
    width: 200,
    maxLines: 6,
  },
  Subnet: {
    cidr: '192.168.1.0/24',
    label: 'private',
  },
  Semaphore: {
    value: 2,
    max: 3,
    label: 'sem',
  },
  Mutex: {
    locked: true,
    owner: 'Thread-1',
  },
  LogicGate: {
    gate: 'AND',
  },
  SymbolTable: {
    entries: [
      { name: 'x', type: 'int' },
      { name: 'name', type: 'string' },
      { name: 'sum', type: 'float' },
    ],
  },
  Set: {
    values: ['a', 'b', 'c', 'd'],
  },
  Tuple: {
    values: [1, 2, 3, 4, 5],
  },
  ScatterPlot: {
    domain: [-5, 5],
    range: [-5, 5],
    xLabel: 'x',
    yLabel: 'y',
    showGrid: true,
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1, label: 'P' },
      { x: 2, y: 4, label: 'Q' },
      { x: -1, y: 1 },
      { x: -2, y: 4 },
    ],
  },
  RecursionTree: {
    calls: [
      { id: 'r1', label: 'fib', args: '4', state: 'executing' },
      { id: 'r2', label: 'fib', args: '3', state: 'executing' },
      { id: 'r3', label: 'fib', args: '2', returnValue: '1', state: 'returned' },
      { id: 'r4', label: 'fib', args: '1', returnValue: '1', state: 'returned' },
      { id: 'r5', label: 'fib', args: '2', state: 'pending' },
    ],
    edges: [
      { from: 'r1', to: 'r2' },
      { from: 'r2', to: 'r3' },
      { from: 'r2', to: 'r4' },
      { from: 'r1', to: 'r5' },
    ],
  },
  Packet: {
    headers: [
      { name: 'Src IP', value: '192.168.1.1', bytes: 4 },
      { name: 'Dst IP', value: '10.0.0.5', bytes: 4 },
      { name: 'Src Port', value: '443', bytes: 2 },
      { name: 'Dst Port', value: '8080', bytes: 2 },
      { name: 'Flags', value: 'ACK', bytes: 1 },
    ],
    payload: 'HTTP/1.1 200 OK...',
    protocol: 'TCP',
  },
  // ── Software Architecture: API & Web
  APIEndpoint: {
    method: 'GET',
    route: '/api/users/:id',
    status: 200,
  },
  HTTPRequest: {
    method: 'POST',
    url: '/api/auth/login',
    headers: 'Content-Type: application/json\nAuthorization: Bearer ...',
    bodyPreview: '{ "email": "user@example.com" }',
  },
  HTTPResponse: {
    method: 'POST',
    url: '/api/auth/login',
    statusCode: 200,
    bodyPreview: '{ "token": "eyJhbG..." }',
  },
  WebSocket: {
    protocol: 'wss',
    status: 'connected',
  },
  GraphQLSchema: {
    schemaType: 'type',
    fields: ['id: ID!', 'name: String!', 'email: String', 'posts: [Post!]!'],
  },
  Webhook: {
    event: 'user.created',
    targetUrl: 'https://api.example.com/webhooks',
  },
  // ── Software Architecture: Auth & Security
  AuthFlow: {
    flowType: 'OAuth 2.0',
  },
  Token: {
    tokenType: 'jwt',
    value: 'eyJh',
  },
  Certificate: {
    domain: '*.example.com',
    valid: true,
  },
  Secret: {
    key: 'DATABASE_URL',
  },
  // ── Software Architecture: Data & Messaging
  Schema: {
    tableName: 'users',
    columns: [
      { name: 'id', type: 'uuid' },
      { name: 'email', type: 'varchar' },
      { name: 'name', type: 'varchar' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  Migration: {
    version: 'v003',
    description: 'Add user roles',
    direction: 'up',
  },
  Event: {
    label: 'user.created',
  },
  Stream: {
    protocol: 'Kafka',
    throughput: '10k/s',
  },
  // ── Software Architecture: CI/CD & DevOps
  GitBranch: {
    branchName: 'feature/auth',
  },
  GitCommit: {
    hash: 'a1b2c3d',
    message: 'feat: add OAuth flow',
  },
  PullRequest: {
    prNumber: 142,
    status: 'open',
  },
  Build: {
    buildNumber: '847',
    status: 'success',
    duration: '2m 34s',
  },
  Deployment: {
    environment: 'production',
    version: 'v2.4.1',
    status: 'live',
  },
  Rollback: {
    fromVersion: 'v2.4.1',
    toVersion: 'v2.3.8',
  },
  // ── Software Architecture: Cloud Infrastructure
  CDN: {
    regions: 3,
  },
  StorageBucket: {
    provider: 'S3',
  },
  APIGateway: {
    routes: 3,
  },
  MessageBroker: {
    protocol: 'AMQP',
    queues: 3,
  },
  // ── Software Architecture: Observability
  LogEntry: {
    level: 'info',
    timestamp: '12:34:56',
    message: 'Request completed in 45ms',
  },
  Alert: {
    severity: 'critical',
    status: 'firing',
  },
  Trace: {
    service: 'api-gateway',
    duration: '45ms',
    status: 'ok',
  },
  Dashboard: {
    panels: 4,
  },
  // ── Software Architecture: Code & Architecture
  Module: {
    exports: 5,
  },
  Interface: {
    methods: ['getUser()', 'createUser()', 'deleteUser()'],
  },
  ErrorState: {
    errorType: 'TypeError',
    message: 'Cannot read property of undefined',
    code: 500,
  },
  ConfigFile: {
    filename: '.env',
    entries: [
      { key: 'PORT', value: '3000' },
      { key: 'DB_HOST', value: 'localhost' },
      { key: 'NODE_ENV', value: 'production' },
    ],
  },
  Dependency: {
    version: '^4.18.2',
  },
  CronJob: {
    schedule: '0 */6 * * *',
  },
  // ── Software Architecture: Collaboration
  Notification: {
    channel: 'push',
  },
  Task: {
    status: 'in_progress',
    priority: 'high',
  },
  File: {
    extension: 'md',
  },
  // ── Phase 1: Core Architecture Diagrams
  SequenceDiagram: {
    participants: [
      { name: 'Client' },
      { name: 'API Gateway' },
      { name: 'Auth Service' },
      { name: 'Database' },
    ],
    messages: [
      { from: 'Client', to: 'API Gateway', label: 'POST /login', type: 'sync' },
      { from: 'API Gateway', to: 'Auth Service', label: 'Validate JWT', type: 'sync' },
      { from: 'Auth Service', to: 'Database', label: 'SELECT user', type: 'sync' },
      { from: 'Database', to: 'Auth Service', label: 'User record', type: 'reply' },
      { from: 'Auth Service', to: 'API Gateway', label: '200 OK', type: 'reply' },
      { from: 'API Gateway', to: 'Client', label: 'Token', type: 'reply' },
    ],
  },
  EREntity: {
    tableName: 'users',
    columns: [
      { name: 'id', type: 'uuid', key: 'PK' },
      { name: 'email', type: 'varchar(255)', key: 'UK' },
      { name: 'name', type: 'varchar(100)' },
      { name: 'org_id', type: 'uuid', key: 'FK' },
      { name: 'created_at', type: 'timestamp' },
    ],
  },
  ClassNode: {
    className: 'UserService',
    stereotype: '<<service>>',
    attributes: [
      { visibility: '-', name: 'db', type: 'Database' },
      { visibility: '-', name: 'cache', type: 'Redis' },
    ],
    methods: [
      { visibility: '+', name: 'getUser', params: 'id: string', returnType: 'User' },
      { visibility: '+', name: 'createUser', params: 'data: CreateUserDTO', returnType: 'User' },
      { visibility: '#', name: 'hashPassword', params: 'pwd: string', returnType: 'string' },
    ],
  },
  SystemBoundary: {
    label: 'Payment System',
    style: 'dashed',
    description: 'Internal microservices',
  },
  CircuitBreaker: {
    state: 'closed',
    failureRate: '2%',
    threshold: '50%',
  },
  // ── Phase 2: Domain-Specific
  ComponentNode: {
    framework: 'react',
    props: ['data', 'onSubmit', 'className'],
  },
  DataLake: {
    provider: 'S3',
    format: 'parquet',
  },
  DataWarehouse: {
    provider: 'BigQuery',
  },
  MLModel: {
    framework: 'PyTorch',
    status: 'deployed',
    accuracy: '94.2%',
    version: 'v3.1',
  },
  FeatureStore: {
    provider: 'Feast',
  },
  MindMapNode: {
    topic: 'Architecture',
    branches: [
      { label: 'Frontend' },
      { label: 'Backend' },
      { label: 'Database' },
      { label: 'DevOps' },
    ],
  },
  UserJourneyStep: {
    steps: [
      { step: 'Discover', sentiment: 4 },
      { step: 'Sign Up', sentiment: 3 },
      { step: 'Onboard', sentiment: 2 },
      { step: 'Use', sentiment: 5 },
      { step: 'Pay', sentiment: 3 },
    ],
  },
  DeploymentStrategy: {
    strategy: 'blue-green',
    trafficSplit: 50,
  },
  // ── Phase 3: Microservices & Patterns
  Sidecar: {
    proxy: 'Envoy',
  },
  DeadLetterQueue: {
    messageCount: 42,
    retryPolicy: '3 retries',
  },
  RateLimiter: {
    limit: '1000 req/s',
    algorithm: 'token-bucket',
  },
  GPU: {
    model: 'A100',
    memory: '80GB',
  },
  Bundle: {
    name: 'main.js',
    size: '245 KB',
    chunks: 3,
  },
  SagaStep: {
    step: 'Reserve Inventory',
    action: 'reserveItems()',
    compensation: 'releaseItems()',
  },
  Composable: {
    shape: 'shield',
    icon: 'landmark',
    style: 'default',
  },
};

/**
 * Composable showcase variants — demonstrate diverse shape+icon combos
 * across domains. Each entry maps a virtual display name to its metadata
 * and label. All render via the "Composable" registry entry.
 */
export const COMPOSABLE_SHOWCASE = {
  'Composable: Fund Vehicle': {
    label: 'Fund Vehicle',
    metadata: { shape: 'shield', icon: 'landmark', style: 'default' },
  },
  'Composable: Portfolio': {
    label: 'Portfolio',
    metadata: { shape: 'hexagon', icon: 'briefcase', style: 'default' },
  },
  'Composable: Asset': {
    label: 'Asset',
    metadata: { shape: 'circle', icon: 'coins', style: 'default' },
  },
  'Composable: Contract': {
    label: 'Contract',
    metadata: { shape: 'document', icon: 'scroll', style: 'default' },
  },
  'Composable: Compliance': {
    label: 'Compliance',
    metadata: { shape: 'octagon', icon: 'shield-check', style: 'emphasized' },
  },
  'Composable: Strategy': {
    label: 'Strategy',
    metadata: { shape: 'diamond', icon: 'target', style: 'default' },
  },
  'Composable: Market': {
    label: 'Market',
    metadata: { shape: 'hexagon', icon: 'globe', style: 'default' },
  },
  'Composable: Hospital': {
    label: 'Hospital',
    metadata: { shape: 'shield', icon: 'heart-pulse', style: 'emphasized' },
  },
  'Composable: University': {
    label: 'University',
    metadata: { shape: 'pentagon', icon: 'graduation-cap', style: 'default' },
  },
  'Composable: Warehouse': {
    label: 'Warehouse',
    metadata: { shape: 'rect', icon: 'warehouse', style: 'default' },
  },
  'Composable: Campaign': {
    label: 'Campaign',
    metadata: { shape: 'diamond', icon: 'megaphone', style: 'default' },
  },
  'Composable: Team Lead': {
    label: 'Team Lead',
    metadata: { shape: 'stadium', icon: 'user-check', style: 'default' },
  },
  'Composable: Carbon Target': {
    label: 'Carbon Target',
    metadata: { shape: 'circle', icon: 'leaf', style: 'default' },
  },
  'Composable: Data Pipeline': {
    label: 'Data Pipeline',
    metadata: { shape: 'cylinder', icon: 'filter', style: 'default' },
  },
  'Composable: Regulation': {
    label: 'Regulation',
    metadata: { shape: 'octagon', icon: 'gavel', style: 'emphasized' },
  },
};

/** Entity-level defaults (not metadata) for types that need textContent etc. */
export const ENTITY_FIELD_DEFAULTS = {
  Entity: { label: 'Thing' },
  FlowDiagram: { size: 2 },
  VennDiagram: { size: 2 },
  FreeBodyDiagram: { size: 2 },
  Vector: { size: 2 },
  Wave: { size: 2 },
  Service: { label: 'Auth Service' },
  Decision: { label: '?' },
  Equation: { expression: 'E = mc²' },
  Expression: { expression: 'f(x) = x^2' },
  Comparison: { label: 'Array vs LinkedList' },
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
    textContent: 'function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}',
    codeLanguage: 'javascript',
  },
  // ── Software Architecture
  APIEndpoint: { label: 'GET /api/users' },
  HTTPRequest: { label: 'POST /api/auth' },
  HTTPResponse: { label: '200 OK' },
  WebSocket: { label: 'ws://realtime' },
  GraphQLSchema: { label: 'User' },
  Webhook: { label: 'user.created' },
  AuthFlow: { label: 'OAuth 2.0' },
  Token: { label: 'JWT' },
  Certificate: { label: '*.example.com' },
  Secret: { label: 'DATABASE_URL' },
  Schema: { label: 'users' },
  Migration: { label: 'Add roles' },
  Event: { label: 'user.created' },
  Stream: { label: 'Events Stream' },
  GitBranch: { label: 'feature/auth' },
  GitCommit: { label: 'Initial commit' },
  PullRequest: { label: 'Add auth flow' },
  Build: { label: 'Build' },
  Deployment: { label: 'production' },
  Rollback: { label: 'Rollback' },
  CDN: { label: 'CloudFront' },
  StorageBucket: { label: 'Assets Bucket' },
  APIGateway: { label: 'API Gateway' },
  MessageBroker: { label: 'RabbitMQ' },
  LogEntry: { label: 'Request completed' },
  Alert: { label: 'High CPU Usage' },
  Trace: { label: 'api-gateway' },
  Dashboard: { label: 'Monitoring' },
  Module: { label: 'auth' },
  Interface: { label: 'IUserService' },
  ErrorState: { label: 'TypeError' },
  ConfigFile: { label: '.env' },
  Dependency: { label: 'express' },
  CronJob: { label: 'cleanup-logs' },
  Notification: { label: 'Deploy succeeded' },
  Task: { label: 'Implement OAuth' },
  File: { label: 'readme.md' },
  // ── Phase 1: Core Architecture Diagrams
  SequenceDiagram: { label: 'Auth Flow', size: 3.5 },
  EREntity: { label: 'users', size: 2.5 },
  ClassNode: { label: 'UserService', size: 2.5 },
  SystemBoundary: { label: 'Payment System', size: 4 },
  CircuitBreaker: { label: 'Circuit Breaker' },
  // Phase 2
  ComponentNode: { label: 'SearchBar', size: 2 },
  DataLake: { label: 'Raw Events Lake', size: 2.5 },
  DataWarehouse: { label: 'Analytics DW', size: 2.5 },
  MLModel: { label: 'Fraud Detector', size: 2 },
  FeatureStore: { label: 'Feature Store', size: 2 },
  MindMapNode: { label: 'Architecture', size: 3 },
  UserJourneyStep: { label: 'Onboarding Flow', size: 3 },
  DeploymentStrategy: { label: 'Blue-Green Deploy', size: 2.5 },
  // Phase 3
  Sidecar: { label: 'Envoy Proxy' },
  DeadLetterQueue: { label: 'Failed Orders' },
  RateLimiter: { label: 'API Throttle' },
  GPU: { label: 'A100 GPU' },
  Bundle: { label: 'main.js' },
  SagaStep: { label: 'Reserve Inventory' },
  // Composable (Tier 2: Shape + Icon composition)
  Composable: { label: 'Fund Vehicle', size: 2.5 },
};
