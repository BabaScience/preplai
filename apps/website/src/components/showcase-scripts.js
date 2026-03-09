/**
 * showcase-scripts.js — Demo VisualScripts for the three use-case showcases.
 *
 * Each script has 3 frames × 5s = ~15s loop.
 */

// ── 1. CS Concept: Binary Search ─────────────────────────────────────
export const CS_SCRIPT = {
  frames: [
    {
      narrationSegment: 'An unsorted array of numbers needs to be searched efficiently.',
      entities: [
        { id: 'arr1', type: 'Array', position: { x: 50, y: 45 }, label: 'Data', size: 3, highlight: true, metadata: { items: [38, 12, 77, 5, 42, 91, 23, 64] } },
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Binary Search', size: 2.5, color: '#C9A84C' },
      ],
    },
    {
      narrationSegment: 'First, sort the array. Then build a binary search tree.',
      entities: [
        { id: 'arr1', type: 'Array', position: { x: 50, y: 18 }, label: 'Sorted', size: 2, metadata: { items: [5, 12, 23, 38, 42, 64, 77, 91] } },
        { id: 'tree1', type: 'BinaryTree', position: { x: 50, y: 58 }, label: 'BST', size: 3, highlight: true, metadata: { nodes: [42, 12, 77, 5, 23, 64, 91] } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'arr1', targetEntityId: 'tree1', label: 'build', style: 'dashed' },
      ],
    },
    {
      narrationSegment: 'Search for 64: compare at root, go right, found. O(log n) time.',
      entities: [
        { id: 'tree1', type: 'BinaryTree', position: { x: 45, y: 50 }, label: 'BST', size: 3.5, highlight: true, metadata: { nodes: [42, 12, 77, 5, 23, 64, 91] } },
        { id: 'bigo', type: 'BigO', position: { x: 85, y: 25 }, label: 'Time Complexity', size: 2, metadata: { complexity: 'O(log n)' } },
        { id: 'callout1', type: 'Callout', position: { x: 85, y: 70 }, label: 'Found: 64', size: 1.5, color: '#4ade80' },
      ],
    },
  ],
};

// ── 2. System Architecture: Event-Driven ─────────────────────────────
export const ARCH_SCRIPT = {
  frames: [
    {
      narrationSegment: 'Three microservices need to communicate without tight coupling.',
      entities: [
        { id: 'svc1', type: 'Server', position: { x: 20, y: 35 }, label: 'Orders', size: 2.5, highlight: true },
        { id: 'svc2', type: 'Server', position: { x: 50, y: 35 }, label: 'Payments', size: 2.5 },
        { id: 'svc3', type: 'Server', position: { x: 80, y: 35 }, label: 'Shipping', size: 2.5 },
        { id: 'h1', type: 'H2', position: { x: 50, y: 10 }, label: 'Event-Driven Architecture', size: 2, color: '#C9A84C' },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'svc2', label: 'direct call?', style: 'dashed' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'svc3', label: 'direct call?', style: 'dashed' },
      ],
    },
    {
      narrationSegment: 'A message queue decouples the services. Each publishes events.',
      entities: [
        { id: 'svc1', type: 'Server', position: { x: 20, y: 25 }, label: 'Orders', size: 2 },
        { id: 'svc2', type: 'Server', position: { x: 20, y: 55 }, label: 'Payments', size: 2 },
        { id: 'svc3', type: 'Server', position: { x: 20, y: 80 }, label: 'Shipping', size: 2 },
        { id: 'queue', type: 'Queue', position: { x: 55, y: 50 }, label: 'Event Bus', size: 3, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'queue', label: 'publish' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'queue', label: 'publish' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc3', label: 'subscribe' },
      ],
    },
    {
      narrationSegment: 'Full event-driven flow: Order placed → Payment processed → Shipment dispatched.',
      entities: [
        { id: 'svc1', type: 'Server', position: { x: 15, y: 30 }, label: 'Orders', size: 2 },
        { id: 'svc2', type: 'Server', position: { x: 15, y: 70 }, label: 'Payments', size: 2 },
        { id: 'queue', type: 'Queue', position: { x: 50, y: 50 }, label: 'Event Bus', size: 2.5 },
        { id: 'svc3', type: 'Server', position: { x: 85, y: 30 }, label: 'Shipping', size: 2 },
        { id: 'db1', type: 'Database', position: { x: 85, y: 70 }, label: 'Event Store', size: 2, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'queue', label: 'OrderPlaced' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc2', label: 'consume' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc2', targetEntityId: 'queue', label: 'PaymentDone' },
        { id: 'a4', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'svc3', label: 'consume' },
        { id: 'a5', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'queue', targetEntityId: 'db1', label: 'persist' },
      ],
    },
  ],
};

// ── 3. Agent Monitoring: AI Reasoning ────────────────────────────────
export const AGENT_SCRIPT = {
  frames: [
    {
      narrationSegment: 'An AI agent receives a complex question requiring multi-step reasoning.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 15, y: 50 }, label: 'User', size: 2.5, color: '#C9A84C' },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 55, y: 50 }, label: 'AI Agent', size: 3, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user1', targetEntityId: 'nn1', label: 'prompt' },
        { id: 'h1', type: 'H2', position: { x: 55, y: 10 }, label: 'Agent Reasoning', size: 2, color: '#C9A84C' },
      ],
    },
    {
      narrationSegment: 'The agent breaks the problem into steps and evaluates each branch.',
      entities: [
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 15, y: 50 }, label: 'Agent', size: 2 },
        { id: 'step1', type: 'Pipeline', position: { x: 55, y: 30 }, label: 'Reasoning Pipeline', size: 3, highlight: true, metadata: { stages: ['Parse', 'Research', 'Analyze', 'Synthesize'] } },
        { id: 'dec1', type: 'Decision', position: { x: 55, y: 75 }, label: 'Confidence Check', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'step1' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'dec1', label: 'evaluate' },
      ],
    },
    {
      narrationSegment: 'High confidence reached. The agent delivers a verified, cited answer.',
      entities: [
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 10, y: 45 }, label: 'Agent', size: 2 },
        { id: 'step1', type: 'Pipeline', position: { x: 45, y: 30 }, label: 'Pipeline', size: 2.5, metadata: { stages: ['Parse', 'Research', 'Analyze', 'Synthesize'] } },
        { id: 'dec1', type: 'Decision', position: { x: 45, y: 72 }, label: 'Verified', size: 1.8, color: '#4ade80' },
        { id: 'metric1', type: 'Metric', position: { x: 82, y: 30 }, label: 'Confidence', size: 2, highlight: true, metadata: { value: '94%', trend: 'up' } },
        { id: 'user1', type: 'User', position: { x: 82, y: 72 }, label: 'User', size: 2, color: '#C9A84C' },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'step1' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'dec1', label: 'pass' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'dec1', targetEntityId: 'user1', label: 'answer' },
        { id: 'a4', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'step1', targetEntityId: 'metric1', style: 'dashed' },
      ],
    },
  ],
};
