/**
 * showcase-scripts.js — Demo VisualScripts for the three use-case showcases.
 *
 * Each script has 5 frames x 5s = ~25s loop.
 */

// ── 1. CS Concept: Binary Search ─────────────────────────────────────
export const CS_SCRIPT = {
  frames: [
    {
      narrationSegment: 'We start with an unsorted array of 8 numbers. Binary search requires sorted data — so step one is to understand the problem.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Binary Search', size: 2.5, color: '#C9A84C' },
        { id: 'arr1', type: 'Array', position: { x: 50, y: 40 }, label: 'Unsorted Data', size: 3, highlight: true, metadata: { items: [38, 12, 77, 5, 42, 91, 23, 64] } },
        { id: 'bigo-lin', type: 'BigO', position: { x: 80, y: 75 }, label: 'Linear Scan', size: 1.8, metadata: { complexity: 'O(n)' } },
        { id: 'label1', type: 'Label', position: { x: 50, y: 75 }, label: 'Searching unsorted data means checking every element — O(n) time.' },
      ],
    },
    {
      narrationSegment: 'Sort the array in ascending order. Now each element has a predictable position relative to its neighbors.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Binary Search', size: 2.5, color: '#C9A84C' },
        { id: 'arr-unsorted', type: 'Array', position: { x: 50, y: 25 }, label: 'Before', size: 2, metadata: { items: [38, 12, 77, 5, 42, 91, 23, 64] } },
        { id: 'arr-sorted', type: 'Array', position: { x: 50, y: 55 }, label: 'Sorted', size: 3, highlight: true, metadata: { items: [5, 12, 23, 38, 42, 64, 77, 91] } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'arr-unsorted', targetEntityId: 'arr-sorted', label: 'sort' },
        { id: 'label1', type: 'Label', position: { x: 50, y: 82 }, label: 'Sorting unlocks divide-and-conquer: we can eliminate half the data each step.' },
      ],
    },
    {
      narrationSegment: 'Build a binary search tree from the sorted array. The middle element becomes the root, splitting data into left and right subtrees.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Binary Search', size: 2.5, color: '#C9A84C' },
        { id: 'arr-sorted', type: 'Array', position: { x: 50, y: 22 }, label: 'Sorted', size: 2, metadata: { items: [5, 12, 23, 38, 42, 64, 77, 91] } },
        { id: 'tree1', type: 'BinaryTree', position: { x: 50, y: 58 }, label: 'BST', size: 3, highlight: true, metadata: { nodes: [42, 12, 77, 5, 23, 64, 91] } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'arr-sorted', targetEntityId: 'tree1', label: 'build BST' },
        { id: 'label1', type: 'Label', position: { x: 50, y: 88 }, label: 'Root = 42. Left subtree holds values < 42, right subtree holds values > 42.' },
      ],
    },
    {
      narrationSegment: 'Search for 64: compare with root 42 — go right. Compare with 77 — go left. Found! Only 3 comparisons instead of 8.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Searching for 64', size: 2.5, color: '#C9A84C' },
        { id: 'tree1', type: 'BinaryTree', position: { x: 42, y: 50 }, label: 'BST', size: 3.5, highlight: true, metadata: { nodes: [42, 12, 77, 5, 23, 64, 91] } },
        { id: 'step1', type: 'StepList', position: { x: 85, y: 40 }, label: 'Search Path', size: 2, metadata: { steps: ['42 → go right', '77 → go left', '64 → found!'] } },
        { id: 'callout1', type: 'Callout', position: { x: 85, y: 75 }, label: 'Found: 64', size: 1.5, color: '#4ade80' },
        { id: 'label1', type: 'Label', position: { x: 42, y: 88 }, label: '3 comparisons vs 8 for linear scan — the power of halving the search space.' },
      ],
    },
    {
      narrationSegment: 'Binary search achieves O(log n) time complexity. For 1 million elements, that is only ~20 comparisons instead of 1 million.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Why O(log n) Matters', size: 2.5, color: '#C9A84C' },
        { id: 'tree1', type: 'BinaryTree', position: { x: 30, y: 50 }, label: 'BST', size: 3, metadata: { nodes: [42, 12, 77, 5, 23, 64, 91] } },
        { id: 'bigo', type: 'BigO', position: { x: 72, y: 35 }, label: 'Time Complexity', size: 2.5, highlight: true, metadata: { complexity: 'O(log n)' } },
        { id: 'metric1', type: 'Metric', position: { x: 72, y: 70 }, label: '1M elements', size: 2, metadata: { value: '~20', trend: 'down' } },
        { id: 'callout1', type: 'Callout', position: { x: 30, y: 88 }, label: 'Each comparison eliminates half the remaining data', size: 1.5 },
      ],
    },
  ],
};

// ── 2. System Architecture: Event-Driven ─────────────────────────────
export const ARCH_SCRIPT = {
  frames: [
    {
      narrationSegment: 'Three microservices communicate via direct calls. Each service is tightly coupled — if Payments goes down, Orders breaks too.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Event-Driven Architecture', size: 2, color: '#C9A84C' },
        { id: 'svc1', type: 'Server', position: { x: 20, y: 40 }, label: 'Orders', size: 2.5, highlight: true },
        { id: 'svc2', type: 'Server', position: { x: 50, y: 40 }, label: 'Payments', size: 2.5 },
        { id: 'svc3', type: 'Server', position: { x: 80, y: 40 }, label: 'Shipping', size: 2.5 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'svc2', label: 'direct call', style: 'dashed' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'svc3', label: 'direct call', style: 'dashed' },
        { id: 'label1', type: 'Label', position: { x: 50, y: 75 }, label: 'Tight coupling: one failure cascades through the entire chain.' },
      ],
    },
    {
      narrationSegment: 'Introduce a message queue as the central event bus. Services publish events instead of calling each other directly.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Event-Driven Architecture', size: 2, color: '#C9A84C' },
        { id: 'svc1', type: 'Server', position: { x: 15, y: 30 }, label: 'Orders', size: 2 },
        { id: 'svc2', type: 'Server', position: { x: 15, y: 55 }, label: 'Payments', size: 2 },
        { id: 'svc3', type: 'Server', position: { x: 15, y: 80 }, label: 'Shipping', size: 2 },
        { id: 'queue', type: 'Queue', position: { x: 60, y: 50 }, label: 'Event Bus', size: 3, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'queue', label: 'publish' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'queue', label: 'publish' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc3', label: 'subscribe' },
      ],
    },
    {
      narrationSegment: 'Full pub/sub flow: Orders publishes OrderPlaced, Payments consumes it and publishes PaymentDone, Shipping picks it up.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Publish / Subscribe Flow', size: 2, color: '#C9A84C' },
        { id: 'svc1', type: 'Server', position: { x: 12, y: 35 }, label: 'Orders', size: 2 },
        { id: 'svc2', type: 'Server', position: { x: 12, y: 65 }, label: 'Payments', size: 2 },
        { id: 'queue', type: 'Queue', position: { x: 50, y: 50 }, label: 'Event Bus', size: 2.5, highlight: true },
        { id: 'svc3', type: 'Server', position: { x: 88, y: 50 }, label: 'Shipping', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'queue', label: 'OrderPlaced' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc2', label: 'consume' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'queue', label: 'PaymentDone' },
        { id: 'a4', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc3', label: 'consume' },
      ],
    },
    {
      narrationSegment: 'Add an event store to persist every event, and a monitor service for real-time dashboards and alerting.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Event Store + Monitoring', size: 2, color: '#C9A84C' },
        { id: 'svc1', type: 'Server', position: { x: 12, y: 30 }, label: 'Orders', size: 1.8 },
        { id: 'svc2', type: 'Server', position: { x: 12, y: 60 }, label: 'Payments', size: 1.8 },
        { id: 'queue', type: 'Queue', position: { x: 45, y: 45 }, label: 'Event Bus', size: 2.5 },
        { id: 'svc3', type: 'Server', position: { x: 80, y: 28 }, label: 'Shipping', size: 1.8 },
        { id: 'db1', type: 'Database', position: { x: 80, y: 58 }, label: 'Event Store', size: 2, highlight: true },
        { id: 'monitor', type: 'Monitor', position: { x: 80, y: 82 }, label: 'Dashboard', size: 1.8 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'queue', label: 'publish' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc3', label: 'consume' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'db1', label: 'persist' },
        { id: 'a4', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'db1', targetEntityId: 'monitor', label: 'stream', style: 'dashed' },
      ],
    },
    {
      narrationSegment: 'Complete system: decoupled services, persistent event log, real-time monitoring. Every event is auditable and replayable.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Complete Architecture', size: 2, color: '#C9A84C' },
        { id: 'svc1', type: 'Server', position: { x: 10, y: 30 }, label: 'Orders', size: 1.8 },
        { id: 'svc2', type: 'Server', position: { x: 10, y: 55 }, label: 'Payments', size: 1.8 },
        { id: 'svc3', type: 'Server', position: { x: 10, y: 80 }, label: 'Shipping', size: 1.8 },
        { id: 'queue', type: 'Queue', position: { x: 42, y: 50 }, label: 'Event Bus', size: 2.5, highlight: true },
        { id: 'db1', type: 'Database', position: { x: 75, y: 30 }, label: 'Event Store', size: 2 },
        { id: 'monitor', type: 'Monitor', position: { x: 75, y: 60 }, label: 'Dashboard', size: 1.8 },
        { id: 'metric1', type: 'Metric', position: { x: 75, y: 85 }, label: 'Throughput', size: 1.5, metadata: { value: '12K/s', trend: 'up' } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'queue', label: 'publish' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'queue', label: 'publish' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc3', label: 'consume' },
        { id: 'a4', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'db1', label: 'persist' },
        { id: 'a5', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'db1', targetEntityId: 'monitor', label: 'stream', style: 'dashed' },
      ],
    },
  ],
};

// ── 3. Agent Monitoring: What Did the Agent Do? ──────────────────────
export const AGENT_SCRIPT = {
  frames: [
    {
      narrationSegment: 'A user sends a complex prompt to an AI agent. The agent needs to reason through multiple steps to answer correctly.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'What Did the Agent Do?', size: 2, color: '#C9A84C' },
        { id: 'user1', type: 'User', position: { x: 20, y: 50 }, label: 'User', size: 2.5, color: '#C9A84C' },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 60, y: 50 }, label: 'AI Agent', size: 3, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user1', targetEntityId: 'nn1', label: 'complex prompt' },
        { id: 'label1', type: 'Label', position: { x: 50, y: 82 }, label: 'Instead of a black box, watch every step the agent takes.' },
      ],
    },
    {
      narrationSegment: 'The agent breaks the problem into a reasoning pipeline: parse the question, research context, analyze data, then synthesize an answer.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Reasoning Pipeline', size: 2, color: '#C9A84C' },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 12, y: 45 }, label: 'Agent', size: 2 },
        { id: 'step1', type: 'Pipeline', position: { x: 55, y: 35 }, label: 'Reasoning Steps', size: 3, highlight: true, metadata: { stages: ['Parse', 'Research', 'Analyze', 'Synthesize'] } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'step1', label: 'execute' },
        { id: 'label1', type: 'Label', position: { x: 55, y: 75 }, label: 'Each stage is visible — no more guessing what happened inside.' },
      ],
    },
    {
      narrationSegment: 'During Research and Analyze stages, the agent makes tool calls — querying a database and calling an external API for live data.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Tool Calls & Data', size: 2, color: '#C9A84C' },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 12, y: 40 }, label: 'Agent', size: 2 },
        { id: 'step1', type: 'Pipeline', position: { x: 50, y: 25 }, label: 'Pipeline', size: 2.5, metadata: { stages: ['Parse', 'Research', 'Analyze', 'Synthesize'] } },
        { id: 'db1', type: 'Database', position: { x: 75, y: 55 }, label: 'Knowledge Base', size: 2, highlight: true },
        { id: 'svc1', type: 'Server', position: { x: 40, y: 70 }, label: 'External API', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'step1' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'db1', label: 'query' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'svc1', label: 'API call' },
      ],
    },
    {
      narrationSegment: 'After synthesis, the agent runs a confidence check. If confidence is below threshold, it loops back to gather more data.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Confidence Check', size: 2, color: '#C9A84C' },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 10, y: 45 }, label: 'Agent', size: 1.8 },
        { id: 'step1', type: 'Pipeline', position: { x: 42, y: 30 }, label: 'Pipeline', size: 2.5, metadata: { stages: ['Parse', 'Research', 'Analyze', 'Synthesize'] } },
        { id: 'dec1', type: 'Decision', position: { x: 42, y: 68 }, label: 'Confidence ≥ 90%?', size: 2, highlight: true },
        { id: 'metric1', type: 'Metric', position: { x: 80, y: 35 }, label: 'Confidence', size: 2, metadata: { value: '94%', trend: 'up' } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'step1' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'dec1', label: 'evaluate' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'dec1', targetEntityId: 'metric1', label: 'pass', style: 'dashed' },
      ],
    },
    {
      narrationSegment: 'High confidence reached. The agent delivers a verified answer with a full audit trail — every decision, tool call, and data source visible.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 8 }, label: 'Answer Delivered', size: 2, color: '#C9A84C' },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 10, y: 40 }, label: 'Agent', size: 1.8 },
        { id: 'step1', type: 'Pipeline', position: { x: 38, y: 28 }, label: 'Pipeline', size: 2, metadata: { stages: ['Parse', 'Research', 'Analyze', 'Synthesize'] } },
        { id: 'dec1', type: 'Decision', position: { x: 38, y: 62 }, label: 'Verified', size: 1.5, color: '#4ade80' },
        { id: 'metric1', type: 'Metric', position: { x: 75, y: 28 }, label: 'Confidence', size: 2, highlight: true, metadata: { value: '94%', trend: 'up' } },
        { id: 'user1', type: 'User', position: { x: 75, y: 62 }, label: 'User', size: 2, color: '#C9A84C' },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'step1' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'dec1', label: 'pass' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'dec1', targetEntityId: 'user1', label: 'answer' },
        { id: 'a4', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'metric1', style: 'dashed' },
        { id: 'label1', type: 'Label', position: { x: 50, y: 88 }, label: 'Cinema, not logs. Every action accountable.' },
      ],
    },
  ],
};

/**
 * Showcase items config — labels + descriptions for the carousel
 */
export const SHOWCASE_ITEMS = [
  {
    script: CS_SCRIPT,
    label: 'Learn Visually',
    description: 'Stop reading walls of text. Ask your AI to explain binary search, TCP handshakes, or microservices — and watch the concepts animate step by step.',
  },
  {
    script: ARCH_SCRIPT,
    label: 'Explain to Stakeholders',
    description: 'Your AI researched the topic. Now share a visual walkthrough with your team, your client, or your board — not a text dump.',
  },
  {
    script: ARCH_SCRIPT,
    label: 'See What AI Built',
    description: 'Your coding assistant refactored a module. Now see the architecture it created — servers, queues, data flows — animated and narrated.',
  },
  {
    script: AGENT_SCRIPT,
    label: 'Review Incidents',
    description: 'Your system went down at 2 AM. Instead of reading a 20-page postmortem, watch a 2-minute visual walkthrough of exactly what happened.',
  },
];
