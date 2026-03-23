/**
 * @preplai/mcp-server — Illustrations Reference for Agents
 *
 * Builds the get_illustrations response: entity types, aliases, short keys,
 * topic hints, metadata hints. Single source for agent discovery.
 */
import { registry, COMPOSABLE_SHAPES, ICON_CATEGORIES } from '@preplai/illustrations';
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

  // ── Phase 2: Domain-Specific ──
  'react component, vue component, angular component, frontend component tree': ['ComponentNode'],
  'data lake, raw storage, s3, unstructured data': ['DataLake'],
  'data warehouse, snowflake, bigquery, redshift, olap': ['DataWarehouse'],
  'ml model, trained model, inference, prediction': ['MLModel'],
  'feature store, feast, ml features, training features': ['FeatureStore'],
  'mindmap, brainstorm, mind map, idea map': ['MindMapNode'],
  'user journey, customer journey, ux flow, sentiment': ['UserJourneyStep'],
  'blue green deployment, canary deployment, rolling update': ['DeploymentStrategy'],

  // ── Phase 3: Microservices & Patterns ──
  'sidecar, envoy, istio, service mesh proxy': ['Sidecar'],
  'dead letter queue, dlq, failed messages, poison queue': ['DeadLetterQueue'],
  'rate limiter, throttle, api limit, token bucket': ['RateLimiter'],
  'gpu, cuda, a100, h100, accelerator, tpu': ['GPU'],
  'bundle, chunk, webpack, code splitting, js bundle': ['Bundle'],
  'saga, distributed transaction, compensation, choreography': ['SagaStep'],

  // ── Finance & Investment (Composable) ──
  'fund structure, PE, VC, capital, LP, GP, fund vehicle': ['Composable'],
  'portfolio, allocation, asset class, diversification': ['Composable'],
  'financial flow, capital flow, cash flow, money flow': ['Composable', 'Arrow', 'DataFlow'],
  'investment, returns, yield, dividend, interest': ['Composable'],
  'risk model, risk assessment, var, volatility': ['Composable'],
  'balance sheet, income statement, financial statement': ['Composable', 'Table'],
  'stock, equity, bond, derivative, option, futures': ['Composable'],
  'bank, fintech, insurance, underwriting': ['Composable'],

  // ── Legal & Compliance (Composable) ──
  'contract, agreement, terms, clause, NDA': ['Composable'],
  'compliance, regulation, audit, governance': ['Composable'],
  'legal entity, jurisdiction, filing, license': ['Composable'],
  'intellectual property, patent, trademark, copyright': ['Composable'],

  // ── Business & Strategy (Composable) ──
  'strategy, strategic plan, OKR, KPI, initiative': ['Composable'],
  'market analysis, TAM, SAM, SOM, competitive': ['Composable'],
  'org chart, team structure, department, division': ['Composable'],
  'business model, revenue model, pricing': ['Composable'],
  'swot, pest, porter, framework, matrix': ['Composable', 'Table'],
  'stakeholder, decision maker, sponsor, champion': ['Composable'],
  'supply chain, logistics, procurement, vendor': ['Composable'],

  // ── Product & Design (Composable) ──
  'product roadmap, feature, milestone, release plan': ['Composable', 'Timeline'],
  'bot, chatbot, robot, virtual agent, automated assistant': ['Composable'],
  'ai agent, copilot, ai assistant, llm agent': ['Composable'],
  'ai architecture, rag, retrieval augmented generation': ['Composable', 'Database', 'Service', 'Arrow'],
  'prompt, prompt engineering, system prompt': ['Composable', 'CodeBlock'],
  'persona, user segment, cohort, demographic': ['Composable'],
  'funnel, conversion, retention, churn, growth': ['Composable', 'BarChart'],
  'a/b test, experiment, hypothesis, variant': ['Composable'],

  // ── Healthcare (Composable) ──
  'patient, diagnosis, treatment, clinical': ['Composable'],
  'hospital, clinic, pharmacy, lab': ['Composable'],
  'medical device, imaging, scan, test': ['Composable'],

  // ── Education (Composable) ──
  'curriculum, course, lesson, module, learning': ['Composable'],
  'student, teacher, classroom, school': ['Composable'],

  // ── Composite non-engineering hints ──
  'fund architecture, investment structure': ['Composable', 'Arrow', 'DataFlow'],
  'legal hierarchy, corporate structure': ['Composable', 'Arrow'],
  'business strategy overview': ['Composable', 'Timeline', 'BarChart', 'Arrow'],
  'product strategy': ['Composable', 'Timeline', 'BarChart', 'Arrow'],
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
  // Flow (connections support: thickness?: "thin"|"thick", animated?: boolean, bidirectional?: boolean)
  Arrow: 'sourceEntityId, targetEntityId; label?; thickness?: "thin"|"thick"; animated?: boolean; bidirectional?: boolean',
  BidirectArrow: 'sourceEntityId, targetEntityId; label?; thickness?: "thin"|"thick"',
  DottedArrow: 'sourceEntityId, targetEntityId; label?; thickness?: "thin"|"thick"',
  DataFlow: 'sourceEntityId, targetEntityId; label?; thickness?: "thin"|"thick"',
  Bus: 'sourceEntityId, targetEntityId; label?',
  // Universal
  Concept: 'label? (≤12 chars inside, else below)',
  Entity: 'label?, width?',
  Group: 'label?',
  H1: 'label?',
  H2: 'label?',
  H3: 'label?',
  Text: 'Paragraph body text (wide, multi-line). Use textContent or label for text body. 800px wide, 22px font, left-aligned by default. Overrides: maxWidth?, maxLines? (default 8), align?: "left"|"center"|"right", fontSize?, fontWeight?, lineHeight?, background? (boolean for card backing)',
  Span: 'Short inline annotation text beside entities (compact). Use textContent or label. 250px wide, 15px font, center-aligned by default. Overrides: maxWidth?, maxLines? (default 2), align?: "left"|"center"|"right"',
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

  // Phase 2: Domain-Specific
  ComponentNode: 'framework?: "react"|"vue"|"angular", props?: string[]',
  DataLake: 'provider?: "S3"|"GCS"|"ADLS", format?: "parquet"|"json"|"csv"',
  DataWarehouse: 'provider?: "Snowflake"|"BigQuery"|"Redshift"',
  MLModel: 'framework?: "PyTorch"|"TensorFlow"|"scikit-learn", version?, accuracy?, status?: "training"|"deployed"|"archived"',
  FeatureStore: 'provider?: "Feast"|"Hopsworks"|"Tecton"',
  MindMapNode: 'topic?, branches: [{label}]',
  UserJourneyStep: 'steps: [{step, sentiment: 1-5}]',
  DeploymentStrategy: 'strategy?: "blue-green"|"canary"|"rolling", trafficSplit?: number',

  // Phase 3: Microservices & Patterns
  Sidecar: 'proxy?: "Envoy"|"Istio"|"Linkerd"',
  DeadLetterQueue: 'messageCount?, retryPolicy?',
  RateLimiter: 'limit?, algorithm?: "token-bucket"|"sliding-window"',
  GPU: 'model?: "A100"|"H100"|"T4", memory?',
  Bundle: 'name?, size?, chunks?',
  SagaStep: 'step?, action?, compensation?',

  // ── Composable (Tier 2: Shape + Icon composition) ──
  Composable: 'shape: rect|circle|hexagon|diamond|shield|cylinder|document|stadium|pill|parallelogram|pentagon|octagon|triangle|trapezoid|cloud, icon?: landmark|briefcase|coins|chart-line|...(100+ icons), style?: default|minimal|emphasized|outlined, iconColor?, badgeLabel?',
};

// ── Public API ─────────────────────────────────────────────────────────────

export interface IllustrationsReference {
  entityTypes: string[];
  aliases: Record<string, string>;
  shortKeys: Record<string, string>;
  topicHints: Record<string, string[]>;
  metadataHints: Record<string, string>;
  universalMetadata: Record<string, string>;
  diagramStyles: Record<string, string>;
  composableShapes: string[];
  composableIcons: Record<string, string[]>;
  positionFormat: string;
  defaultSize: number;
}

/**
 * Universal metadata fields available on ALL entity types (non-connections).
 * These are applied as overlays after component rendering.
 */
const UNIVERSAL_METADATA: Record<string, string> = {
  status: '"healthy"|"warning"|"error"|"inactive"|"loading" — adds visual status indicator (ring, dot, glow, or opacity change)',
  progress: '0.0–1.0 — renders circular progress arc around entity',
  emphasis: '"low"|"normal"|"high"|"critical" — scales entity presence (0.85× to 1.15×)',
  badge: '{ text: string, color?: string, position?: "top-right"|"top-left"|"bottom-right" } — pill badge overlay',
  lottieAnimation: '{ src: string, loop?: boolean, speed?: number, trigger?: "idle"|"entrance"|"focus" } — animated micro-asset overlay. Built-in src values: "gear-spin", "loading-spinner", "check-success", "pulse"',
};

export function getIllustrationsReference(): IllustrationsReference {
  return {
    entityTypes: Object.keys(registry).sort(),
    aliases: { ...ENTITY_TYPE_ALIASES },
    shortKeys: { ...AGENT_SHORT_KEYS },
    topicHints: { ...TOPIC_HINTS },
    metadataHints: { ...METADATA_HINTS },
    universalMetadata: { ...UNIVERSAL_METADATA },
    diagramStyles: {
      // Engineers & SRE
      'hub-spoke': 'center=[50,42], satellites=[20,25],[80,25],[20,62],[80,62]. For: "How does X work?"',
      'pipeline': '4-step=[15,45],[38,45],[62,45],[85,45]. All same Y. For: "Show the flow", "CI/CD"',
      'incident-timeline': 'Pipeline positions + multi-frame status morphing. For: "Walk through the outage"',
      'before-after': 'left=[20,30-70], right=[80,30-70], center=[50,50]. For: "Compare before and after"',
      'layered-stack': 'tier1=y20, tier2=y45, tier3=y70, 3 entities per tier. For: "Show the architecture layers"',
      // Product Managers
      'user-flow': '[12,45]→[30,45]→[50,45]→[70,45]→[88,45]. For: "Show the user journey"',
      'metric-dashboard': 'header=[50,12], 2x2=[30,35],[70,35],[30,65],[70,65]. For: "Show KPIs"',
      'feature-tree': 'root=[50,18], L2=[25,45],[50,45],[75,45], L3 spread. For: "Break down the feature"',
      'roadmap': 'timeline=[50,22], milestones at y=55 spread across x. For: "Show the roadmap"',
      // Consultants
      'org-chart': 'root=[50,15], L2=3 nodes at y38, L3=6 nodes at y62. For: "Show the org structure"',
      'quadrant': 'TL=[28,30], TR=[72,30], BL=[28,65], BR=[72,65]. For: "SWOT", "competitive landscape"',
      'strategy-tree': 'Same as feature-tree. For: "OKR framework", "strategic goals"',
      'process-flow': 'steps at y45 + Decision diamond for branching. For: "Walk through the process"',
      // Finance & Legal
      'fund-hierarchy': 'root=[50,18], L2=3 at y42, L3=5 at y65. Deep tree. For: "Fund structure"',
      'decision-flow': 'start→parallel checks→Decision→pass/fail branches. For: "Compliance flow"',
      'waterfall': 'tiers at y=[15,30,45,60], spreading wider each level. For: "Capital cascade"',
    },
    composableShapes: [...COMPOSABLE_SHAPES],
    composableIcons: { ...ICON_CATEGORIES },
    positionFormat: '[x,y]',
    defaultSize: ENTITY_DEFAULTS.size,
  };
}
