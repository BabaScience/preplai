/**
 * Default metadata for entity types that require structured data.
 * Used by the illustration debug page so types render without user input.
 * Based on packages/illustrations/METADATA_SCHEMAS.md
 */

export const METADATA_DEFAULTS = {
  BinaryTree: {
    tree: {
      value: 5,
      left: { value: 3, left: { value: 1 }, right: { value: 4 } },
      right: { value: 8, left: { value: 6 }, right: { value: 9 } },
    },
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
  Array: {
    values: ['a', 'b', 'c', 'd', 'e'],
    disabledIndexes: [1, 3],
    selectedIndexes: [0, 2],
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
  CodeBlock: {
    textContent: 'function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}',
    codeLanguage: 'javascript',
  },
  StepList: {
    textContent: 'Step 1: Initialize\nStep 2: Process\nStep 3: Finalize',
  },
};
