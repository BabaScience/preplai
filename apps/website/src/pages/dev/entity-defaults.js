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
};
