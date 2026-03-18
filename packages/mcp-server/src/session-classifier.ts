/**
 * @preplai/mcp-server — Presentation Category Classifier
 *
 * Rule-based classification of presentations by entity type distribution.
 * Unknown patterns land in "uncategorized" for organic discovery.
 */

import type { VisualScript } from '@preplai/shared';
import { Session } from '@preplai/db';

/** Skip these when counting entity types — they don't signal domain */
const SKIP_TYPES = new Set([
  'H1', 'H2', 'H3', 'Label', 'Arrow', 'DataFlow', 'BidirectArrow',
  'DottedArrow', 'Bus', 'Concept', 'Entity', 'Group', 'Badge', 'Comparison',
]);

/** Category rules: entity type sets → category name */
const CATEGORY_RULES: Array<{ category: string; types: Set<string>; minMatch: number }> = [
  {
    category: 'infrastructure',
    types: new Set(['Server', 'Database', 'Cache', 'LoadBalancer', 'Cloud', 'Container', 'Pod', 'Network', 'Firewall', 'Lambda', 'Subnet', 'Volume', 'CDN', 'StorageBucket', 'APIGateway', 'MessageBroker', 'DNSResolver', 'Sidecar']),
    minMatch: 2,
  },
  {
    category: 'data-structures',
    types: new Set(['Array', 'LinkedList', 'BinaryTree', 'BTree', 'HashTable', 'Heap', 'Stack', 'Queue', 'Set', 'List', 'Tuple', 'Dict', 'ArrayCell', 'SortAnimation', 'RecursionTree', 'BigO', 'CallStack']),
    minMatch: 1,
  },
  {
    category: 'cicd-devops',
    types: new Set(['GitBranch', 'GitCommit', 'PullRequest', 'Build', 'Deployment', 'Rollback', 'Pipeline', 'PipelineStage', 'DockerImage', 'DockerRegistry', 'DeploymentStrategy', 'CronJob']),
    minMatch: 2,
  },
  {
    category: 'ml-ai',
    types: new Set(['NeuralNetwork', 'MLModel', 'FeatureStore', 'GPU', 'ConfusionMatrix', 'DataLake', 'DataWarehouse']),
    minMatch: 1,
  },
  {
    category: 'api-design',
    types: new Set(['APIEndpoint', 'HTTPRequest', 'HTTPResponse', 'WebSocket', 'GraphQLSchema', 'Webhook', 'RateLimiter', 'Schema']),
    minMatch: 2,
  },
  {
    category: 'frontend',
    types: new Set(['ComponentNode', 'Bundle', 'Device']),
    minMatch: 1,
  },
  {
    category: 'observability',
    types: new Set(['Monitor', 'LogEntry', 'Alert', 'Trace', 'Dashboard', 'Metric']),
    minMatch: 2,
  },
  {
    category: 'security-auth',
    types: new Set(['AuthFlow', 'Token', 'Certificate', 'Secret', 'CircuitBreaker']),
    minMatch: 2,
  },
  {
    category: 'event-driven',
    types: new Set(['Event', 'Stream', 'Queue', 'MessageBroker', 'SagaStep', 'DeadLetterQueue']),
    minMatch: 2,
  },
  {
    category: 'cs-theory',
    types: new Set(['FSM', 'TuringMachine', 'ProcessState', 'DeadlockGraph', 'Thread', 'Semaphore', 'Mutex', 'MemoryLayout', 'MemoryMap', 'CacheHierarchy', 'CPU', 'MemoryBlock']),
    minMatch: 1,
  },
];

/**
 * Count content entity types in a visual script (excluding headings, connections, generic types).
 */
function getEntityDistribution(script: VisualScript): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const frame of script.frames ?? []) {
    for (const entity of frame.entities) {
      if (SKIP_TYPES.has(entity.type)) continue;
      counts[entity.type] = (counts[entity.type] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Classify a presentation based on entity type distribution.
 * Returns the best matching category or "uncategorized".
 */
function classify(distribution: Record<string, number>): string {
  const types = new Set(Object.keys(distribution));
  let bestCategory = 'uncategorized';
  let bestScore = 0;

  for (const rule of CATEGORY_RULES) {
    let matchCount = 0;
    let matchWeight = 0;
    for (const type of types) {
      if (rule.types.has(type)) {
        matchCount++;
        matchWeight += distribution[type] ?? 0;
      }
    }
    if (matchCount >= rule.minMatch && matchWeight > bestScore) {
      bestScore = matchWeight;
      bestCategory = rule.category;
    }
  }

  return bestCategory;
}

/**
 * Classify a session and save the category + entity distribution to MongoDB.
 * Fire-and-forget — should never block add_scene.
 */
export async function classifySession(sessionId: string, script: VisualScript): Promise<void> {
  const distribution = getEntityDistribution(script);
  const category = classify(distribution);

  try {
    await Session.updateOne(
      { id: sessionId },
      { $set: { category, entityDistribution: distribution } },
    );
  } catch (err) {
    console.error('[session-classifier] Failed to save category:', err);
  }
}

/** Export for testing */
export { classify, getEntityDistribution, CATEGORY_RULES };
