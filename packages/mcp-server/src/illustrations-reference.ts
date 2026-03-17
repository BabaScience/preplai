/**
 * @preplai/mcp-server — Illustrations Reference for Agents
 *
 * Builds the get_illustrations response: entity types, aliases, short keys,
 * topic hints, metadata hints. Single source for agent discovery.
 */
import { registry } from '@preplai/illustrations';
import { ENTITY_TYPE_ALIASES, AGENT_SHORT_KEYS } from '@preplai/compiler';
import { ENTITY_DEFAULTS } from '@preplai/shared';

// ── Topic → preferred types (from ILLUSTRATIONS_AGENT_GUIDE) ───────────────

const TOPIC_HINTS: Record<string, string[]> = {
  'cloud, saas, aws, gcp': ['Cloud'],
  'service, microservice, backend': ['Service'],
  'api, rest api, endpoint': ['Service'],
  'api gateway, routing': ['Service'],
  'dns, nameserver, domain resolution': ['DNSResolver'],
  'key concept, glossary term': ['Concept'],
  'code snippet, algorithm': ['CodeBlock'],
  'loop, lifecycle, retry': ['Cycle'],
  'electronic circuit': ['Circuit'],
  '2d plane, vectors, coordinates': ['CoordinateSystem'],
  'single vector, force, velocity': ['Vector'],
  'function plot, roc, scatter': ['Graph2D'],
  'big o, complexity curves': ['BigO'],
  'categorical comparison': ['BarChart'],
  'classification metrics': ['ConfusionMatrix'],
  'array, list, indices': ['Array'],
  'sorting algorithm, bubble sort, quicksort': ['SortAnimation'],
  'bst, heap, tree': ['BinaryTree', 'BTree'],
  'call stack, recursion': ['CallStack'],
  'recursion tree, call tree': ['RecursionTree'],
  'layered model, tech stack, osi': ['Stack'],
  'numbered steps, algorithm walkthrough': ['StepList'],
  'process states': ['ProcessState'],
  'main heading, title': ['H1'],
  'section heading': ['H2'],
  'subsection heading': ['H3'],
  'physical server, rack, host': ['Server'],
  'database, db': ['Database'],
  'key-value, map, dict': ['HashTable'],
  'analogy, x is like y': ['Analogy'],
  'long explanation': ['Definition', 'Callout', 'Analogy'],
  'frequency bins': ['Histogram'],
  'binary search on sorted array': ['Array'],
  'l1 l2 l3 cache hierarchy': ['CacheHierarchy'],
  'memory layout, stack heap': ['MemoryLayout'],
  'deadlock, resource allocation': ['DeadlockGraph'],
  'gantt, scheduling, timeline': ['GanttChart'],
  'fsm, state machine, automata': ['FSM'],
  'turing machine, computation': ['TuringMachine'],
  'wave, sine, oscillation': ['Wave'],
  'free body diagram, forces': ['FreeBodyDiagram'],
  'venn diagram, set overlap': ['VennDiagram'],
  'flowchart, process flow': ['FlowDiagram'],
  'table, rows, columns': ['Table'],
  'thread, concurrency': ['Thread'],
  'timeline, events': ['Timeline'],
  'infrastructure diagram': ['Server', 'Database', 'Cloud', 'Service', 'LoadBalancer', 'Queue', 'Cache', 'Container', 'Monitor', 'Firewall', 'DNSResolver', 'Arrow', 'DataFlow'],

  // ── Microservices & Messaging ──
  'message queue, kafka, rabbitmq, sqs, pub/sub, event bus': ['Queue'],
  'load balancer, nginx, haproxy, traffic distribution': ['LoadBalancer'],
  'caching, redis, memcached, in-memory store': ['Cache'],

  // ── Containers & Orchestration ──
  'docker, container, containerization': ['Container', 'DockerImage'],
  'kubernetes, k8s, orchestration, pod': ['Pod', 'Container'],
  'docker registry, container registry, ecr, gcr': ['DockerRegistry'],
  'persistent volume, storage, pvc, ebs': ['Volume'],
  'subnet, network segment, vpc': ['Subnet', 'Network'],
  'virtual network, vpc, vnet, networking': ['Network'],

  // ── Serverless & FaaS ──
  'serverless, lambda, function, faas, cloud function': ['Lambda'],

  // ── CI/CD & Pipelines ──
  'ci/cd, pipeline, deployment, github actions, jenkins': ['Pipeline', 'PipelineStage'],
  'data pipeline, etl, data flow, streaming': ['Pipeline', 'Queue', 'DataFlow'],

  // ── Observability & Monitoring ──
  'monitoring, observability, grafana, prometheus, metrics': ['Monitor'],
  'logging, tracing, alerting, dashboard': ['Monitor', 'Metric'],

  // ── Security ──
  'firewall, waf, security group, network security': ['Firewall'],
  'authentication, auth, oauth, identity': ['Service', 'Firewall'],

  // ── Workers & Patterns ──
  'worker process, background job, daemon, cron': ['Process'],
  'decorator pattern, middleware, proxy pattern': ['Decorator'],

  // ── Composite architecture hints (multi-type) ──
  'microservices architecture': ['Service', 'Queue', 'LoadBalancer', 'Database', 'Cache', 'Arrow', 'DataFlow'],
  'event-driven architecture, eda': ['Service', 'Queue', 'DataFlow', 'Database', 'Arrow'],
  'kubernetes cluster, k8s cluster': ['Pod', 'Container', 'Network', 'LoadBalancer', 'Volume'],
  'serverless architecture': ['Lambda', 'Queue', 'Database', 'Cloud', 'Arrow'],
  'ci/cd pipeline architecture': ['Pipeline', 'PipelineStage', 'Container', 'DockerRegistry', 'Cloud'],

  // ── Software Architecture: API & Web ──
  'api endpoint, rest endpoint, route handler': ['APIEndpoint'],
  'http request, http response, fetch, ajax': ['HTTPRequest', 'HTTPResponse'],
  'websocket, realtime, socket, ws': ['WebSocket'],
  'graphql, schema, query, mutation': ['GraphQLSchema'],
  'webhook, callback url, event hook': ['Webhook'],

  // ── Software Architecture: Auth & Security ──
  'oauth, auth flow, authentication flow, sso, jwt flow': ['AuthFlow', 'Token'],
  'jwt, token, access token, bearer': ['Token'],
  'ssl, tls, certificate, https': ['Certificate'],
  'env var, secret, vault, credentials': ['Secret'],

  // ── Software Architecture: Data & Messaging ──
  'database schema, table schema, erd, columns': ['Schema'],
  'database migration, schema migration, flyway': ['Migration'],
  'domain event, event sourcing, event payload': ['Event'],
  'data stream, kafka topic, kinesis, event stream': ['Stream'],

  // ── Software Architecture: CI/CD & DevOps ──
  'git branch, feature branch, branching strategy': ['GitBranch'],
  'git commit, commit history, commit hash': ['GitCommit'],
  'pull request, pr, merge request, code review': ['PullRequest'],
  'build, ci build, compilation, build pipeline': ['Build'],
  'deployment, deploy, release, ship': ['Deployment'],
  'rollback, revert, undo deployment': ['Rollback'],

  // ── Software Architecture: Cloud Infrastructure ──
  'cdn, cloudfront, edge, content delivery': ['CDN'],
  'storage bucket, s3, blob storage, object storage': ['StorageBucket'],
  'api gateway, kong, apigee, gateway routing': ['APIGateway'],
  'message broker, rabbitmq, activemq, exchange': ['MessageBroker'],

  // ── Software Architecture: Observability ──
  'log entry, application log, structured log': ['LogEntry'],
  'alert, pagerduty, opsgenie, incident': ['Alert'],
  'distributed trace, span, jaeger, zipkin': ['Trace'],
  'monitoring dashboard, grafana dashboard, datadog': ['Dashboard', 'Monitor'],

  // ── Software Architecture: Code & Architecture ──
  'module, package, library, npm package': ['Module'],
  'interface, contract, abstract class, protocol': ['Interface'],
  'error, exception, error state, failure': ['ErrorState'],
  'config file, env file, yaml config, settings': ['ConfigFile'],
  'dependency, package dependency, npm, pip': ['Dependency'],
  'cron job, scheduled task, periodic job': ['CronJob'],

  // ── Software Architecture: Collaboration ──
  'notification, push notification, alert message': ['Notification'],
  'task, ticket, issue, jira, todo': ['Task'],
  'file, document, artifact, attachment': ['File'],

  // ── Composite software architecture hints ──
  'software architecture overview': ['Server', 'Database', 'Cache', 'Queue', 'LoadBalancer', 'APIGateway', 'Service', 'Arrow', 'DataFlow'],
  'api architecture': ['APIEndpoint', 'APIGateway', 'Database', 'Cache', 'LoadBalancer', 'Arrow'],
  'deployment pipeline': ['GitBranch', 'PullRequest', 'Build', 'Deployment', 'Pipeline', 'Arrow'],
  'observability stack': ['LogEntry', 'Alert', 'Trace', 'Dashboard', 'Monitor', 'Metric'],
  'auth system': ['AuthFlow', 'Token', 'Certificate', 'Secret', 'Service', 'Arrow'],

  // ── Phase 1: Core Architecture Diagrams ──
  'sequence diagram, interaction, message flow, api call flow': ['SequenceDiagram'],
  'er diagram, entity relationship, database schema, table design': ['EREntity'],
  'class diagram, oop, object oriented, uml class': ['ClassNode'],
  'system boundary, c4, context diagram, system context': ['SystemBoundary'],
  'circuit breaker, fault tolerance, resilience, bulkhead': ['CircuitBreaker'],
};

// ── Metadata hints by type (from COMPACT_REFERENCE, METADATA_SCHEMAS) ───────

const METADATA_HINTS: Record<string, string> = {
  // Infrastructure
  User: 'label?',
  Server: 'label?',
  Database: 'label?',
  Cloud: 'label?',
  Container: 'label?',
  Pod: 'label?',
  Network: 'label?',
  Device: 'label?',
  Process: 'label?',
  Queue: 'label?',
  Cache: 'label?',
  LoadBalancer: 'label?',
  Service: 'kind: "Service"|"API"|"APIGateway", hubLabel?',
  Firewall: 'label?',
  Lambda: 'label?',
  Subnet: 'label?',
  Volume: 'label?',
  DNSResolver: 'label?',
  Decorator: 'label?',
  DockerImage: 'label?',
  DockerRegistry: 'label?',
  Monitor: 'label?',
  Pipeline: 'label?',
  PipelineStage: 'label, status?',
  // Flow
  Arrow: 'sourceEntityId, targetEntityId; label?',
  BidirectArrow: 'sourceEntityId, targetEntityId; label?',
  DottedArrow: 'sourceEntityId, targetEntityId; label?',
  DataFlow: 'sourceEntityId, targetEntityId; label?',
  Bus: 'sourceEntityId, targetEntityId; label?',
  // Universal
  Concept: 'label? (≤12 chars inside, else below)',
  Entity: 'label?, width?',
  Group: 'label?',
  H1: 'label?',
  H2: 'label?',
  H3: 'label?',
  Comparison: 'left, right (or label parsed for "X vs Y")',
  Timeline: 'events: [{label, position}]',
  Metric: 'label?, value?',
  Cycle: 'label?',
  Stack: 'layers: [{label, sublabel?, color?}]',
  Badge: 'label?',
  Quote: 'label, author?, width?, maxLines?',
  // Math & Science
  Equation: 'expression?, width?',
  Expression: 'expression?, width?',
  Matrix: 'rows (2D array), rowLabels?, colLabels?',
  Graph2D: 'domain, range, points, expression?, curveType?, parametric?',
  CoordinateSystem: 'points, vectors, xRange?, yRange?, gridSpacing?, showGrid?',
  // Physics
  FreeBodyDiagram: 'forces: [{label, angle, magnitude?, color?}]',
  Vector: 'dx, dy, label?, showMagnitude?',
  Wave: 'frequency?, amplitude?, phase?',
  // General
  Table: 'headers, rows',
  Histogram: 'bins: [{label, count}]',
  PieChart: 'slices: [{label, value}], donut?, showPercentages?',
  FlowDiagram: 'steps: [{label, type?: default|decision}]',
  VennDiagram: 'sets: [{label, color?}]',
  Annotation: 'label, width?, maxLines?',
  BarChart: 'bars: [{label, value, color?}], xLabel?, yLabel?, horizontal?',
  ScatterPlot: 'points, domain?, range?, xLabel?, yLabel?',
  // Pedagogical
  StepList: 'steps, currentStep?, checkmarks?',
  CodeBlock: 'code or lines, codeLanguage?',
  Definition: 'term, definition',
  Callout: 'calloutType, body',
  Analogy: 'x, y or label (parsed for "X is like Y")',
  // Data Structures
  Array: 'values or cells, selectedIndexes?, compareIndexes?, swapIndexes?, doneIndexes?, pointerLabels?',
  LinkedList: 'values',
  BinaryTree: 'tree or nodes, disabledIndexes?, selectedIndexes?',
  BTree: 'tree, branchingFactor?',
  HashTable: 'pairs',
  Dict: 'pairs',
  Heap: 'nodes',
  List: 'values',
  Tuple: 'values',
  Set: 'values',
  // Algorithm
  ArrayCell: 'value, index, state: default|active|compare|swap|done',
  RecursionTree: 'calls, edges',
  SortAnimation: 'values, compareIndexes?, swapIndexes?, doneIndexes?, pointerLabels? (same as Array)',
  // Automata & Theory
  FSM: 'states, transitions',
  TuringMachine: 'tape, headPosition, state',
  BigO: 'curves?, domain?',
  // Architecture
  CacheHierarchy: 'levels: [{name, size?}]',
  MemoryLayout: 'stack, heap',
  CPU: 'label?',
  MemoryBlock: 'label?',
  LogicGate: 'label?',
  // OS
  ProcessState: 'states, transitions',
  GanttChart: 'tasks, maxTime?',
  DeadlockGraph: 'nodes, edges',
  MemoryMap: 'label?',
  Thread: 'status?',
  // Concurrency
  Semaphore: 'value?, max?, label?',
  Mutex: 'label?',
  // Networking
  Packet: 'headers, payload?, protocol?, highlightSection?',
  // ML
  NeuralNetwork: 'label?',
  ConfusionMatrix: 'matrix, rowLabels?, colLabels?',
  // Compilers
  CallStack: 'frames: [{name, locals?}]',
  SymbolTable: 'label?',
  // Misc
  Decision: 'label?',
  Cluster: 'label?',

  // ── Software Architecture: API & Web ──
  APIEndpoint: 'method?: "GET"|"POST"|"PUT"|"DELETE"|"PATCH", path?, statusCode?',
  HTTPRequest: 'method?: "GET"|"POST"|"PUT"|"DELETE", url?, contentType?',
  HTTPResponse: 'statusCode?, contentType?, bodyPreview?',
  WebSocket: 'url?, protocol?',
  GraphQLSchema: 'types?, queries?, mutations?',
  Webhook: 'event?, url?, method?',

  // ── Software Architecture: Auth & Security ──
  AuthFlow: 'provider?, flowType?: "oauth"|"jwt"|"saml"|"basic"',
  Token: 'tokenType?: "JWT"|"Bearer"|"API Key"|"OAuth", expiresIn?',
  Certificate: 'issuer?, domain?, expiresAt?',
  Secret: 'secretType?: "env"|"vault"|"ssm", key?',

  // ── Software Architecture: Data & Messaging ──
  Schema: 'columns?: [{name, type}], tableName?',
  Migration: 'version?, direction?: "up"|"down", description?',
  Event: 'eventType?, payload?, source?',
  Stream: 'topic?, partitions?, consumerGroup?',

  // ── Software Architecture: CI/CD & DevOps ──
  GitBranch: 'branchName?, baseBranch?, commits?',
  GitCommit: 'hash?, message?, author?',
  PullRequest: 'prNumber?, status?: "open"|"merged"|"closed", reviewers?',
  Build: 'buildNumber?, status?: "pending"|"running"|"passed"|"failed", duration?',
  Deployment: 'environment?: "staging"|"production"|"dev", version?, status?',
  Rollback: 'fromVersion?, toVersion?, reason?',

  // ── Software Architecture: Cloud Infrastructure ──
  CDN: 'regions?, provider?',
  StorageBucket: 'provider?: "S3"|"GCS"|"Azure Blob", accessLevel?',
  APIGateway: 'routes?, rateLimit?',
  MessageBroker: 'protocol?: "AMQP"|"MQTT"|"STOMP", queues?',

  // ── Software Architecture: Observability ──
  LogEntry: 'level?: "info"|"warn"|"error"|"debug", timestamp?, message?',
  Alert: 'severity?: "critical"|"warning"|"info", status?: "firing"|"resolved"',
  Trace: 'service?, duration?, status?: "ok"|"error"',
  Dashboard: 'panels?',

  // ── Software Architecture: Code & Architecture ──
  Module: 'exports?',
  Interface: 'methods?: string[]',
  ErrorState: 'errorType?, message?, code?',
  ConfigFile: 'filename?, entries?: [{key, value}]',
  Dependency: 'version?, scope?',
  CronJob: 'schedule?, lastRun?',

  // ── Software Architecture: Collaboration ──
  Notification: 'channel?: "push"|"email"|"slack"|"sms", title?',
  Task: 'status?: "todo"|"in_progress"|"done", priority?: "low"|"medium"|"high"',
  File: 'extension?, size?',

  // Phase 1: Core Architecture Diagrams
  SequenceDiagram: 'participants: [{name, type?}], messages: [{from, to, label, type?: "sync"|"async"|"reply"}]',
  EREntity: 'tableName?, columns: [{name, type, key?: "PK"|"FK"|"UK"}]',
  ClassNode: 'className?, stereotype?, attributes?: [{visibility?, name, type}], methods?: [{visibility?, name, params?, returnType?}]',
  SystemBoundary: 'label?, style?: "dashed"|"solid", description?',
  CircuitBreaker: 'state?: "closed"|"open"|"half-open", failureRate?, threshold?',
};

// ── Public API ─────────────────────────────────────────────────────────────

export interface IllustrationsReference {
  entityTypes: string[];
  aliases: Record<string, string>;
  shortKeys: Record<string, string>;
  topicHints: Record<string, string[]>;
  metadataHints: Record<string, string>;
  positionFormat: string;
  defaultSize: number;
}

export function getIllustrationsReference(): IllustrationsReference {
  return {
    entityTypes: Object.keys(registry).sort(),
    aliases: { ...ENTITY_TYPE_ALIASES },
    shortKeys: { ...AGENT_SHORT_KEYS },
    topicHints: { ...TOPIC_HINTS },
    metadataHints: { ...METADATA_HINTS },
    positionFormat: '[x,y]',
    defaultSize: ENTITY_DEFAULTS.size,
  };
}
