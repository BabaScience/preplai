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
  Label: { label: 'Label text', width: 200, maxLines: 6 },
  H1: { label: 'Main Heading' },
  H2: { label: 'Section Heading' },
  H3: { label: 'Subsection Heading' },
  Comparison: { left: 'Array', right: 'LinkedList', label: 'Array vs LinkedList' },
  Proof: { label: 'Proof step or statement.', width: 200, maxLines: 6 },
  Quote: { label: 'Quote or citation.', width: 200, maxLines: 6 },
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
  Service: { kind: 'Service', hubLabel: undefined },
  Concept: { label: 'Recursion', width: 80, maxLines: 4 },
};

/** Entity-level defaults (not metadata) for types that need textContent etc. */
export const ENTITY_FIELD_DEFAULTS = {
  Service: { label: 'Auth Service' },
  Decision: { label: '?' },
  Comparison: { label: 'Array vs LinkedList' },
  BigO: { size: 2 },
  CoordinateSystem: { size: 2 },
  BinaryTree: { size: 2.5 },
  BTree: { size: 2.5 },
  HashTable: { size: 2 },
  Dict: { size: 2 },
  CodeBlock: {
    textContent: 'function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}',
    codeLanguage: 'javascript',
  },
};
