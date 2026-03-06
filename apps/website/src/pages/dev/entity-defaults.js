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
  HashTable: {
    pairs: [
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ],
  },
  CallStack: {
    frames: [
      { name: 'main()' },
      { name: 'processRequest()', locals: 'req, res' },
      { name: 'handleQuery()', locals: 'sql' },
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
    label: 'Binary search is like a phone book. Divide and conquer on sorted array.',
    width: 56,
    maxLines: 3,
  },
  Annotation: { label: 'Add your annotation here.', width: 56, maxLines: 3 },
  Label: { label: 'Label text', width: 56, maxLines: 3 },
  Comparison: { label: 'Compare items here.', width: 56, maxLines: 3 },
  Proof: { label: 'Proof step or statement.', width: 56, maxLines: 3 },
  Quote: { label: 'Quote or citation.', width: 56, maxLines: 3 },
  Stack: { label: 'Stack item or frame.', width: 56, maxLines: 3 },
  Array: {
    values: ['a', 'b', 'c', 'd', 'e'],
    disabledIndexes: [1, 3],
    selectedIndexes: [0, 2],
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
  AST: {
    ast: {
      type: 'Program',
      value: null,
      children: [
        { type: 'FunctionDecl', value: 'main' },
        {
          type: 'BinaryExpr',
          children: [
            { type: 'Literal', value: '1' },
            { type: 'Literal', value: '2' },
          ],
        },
      ],
    },
  },
};

/** Entity-level defaults (not metadata) for types that need textContent etc. */
export const ENTITY_FIELD_DEFAULTS = {
  BinaryTree: { size: 2.5 },
  BTree: { size: 2.5 },
  CodeBlock: {
    textContent: 'function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}',
    codeLanguage: 'javascript',
  },
  StepList: {
    textContent: 'Step 1: Initialize\nStep 2: Process\nStep 3: Finalize',
  },
};
