/**
 * @preplai/compiler — Compiler-specific Types
 *
 * CompileResult, error/warning types, and compiler constants.
 * These types are private to the compiler package; they are not re-exported
 * from @preplai/shared because they are build-time concerns, not runtime data model.
 */

import type { VisualScript } from '@preplai/shared';
import {
  KNOWN_ENTITY_TYPES as SHARED_KNOWN_ENTITY_TYPES,
  SKIP_CLAMP_TYPES as SHARED_SKIP_CLAMP_TYPES,
} from '@preplai/shared';

// ── Error & Warning Codes ─────────────────────────────────────────────

export type CompilerErrorCode =
  | 'SCHEMA_VALIDATION_FAILED'
  | 'DUPLICATE_ENTITY_ID'
  | 'DUPLICATE_FRAME_ID'
  | 'FRAME_ORDER_INVALID'
  | 'INVALID_PARENT_REF';

export type CompilerWarningCode =
  | 'UNKNOWN_ENTITY_TYPE'
  | 'POSITION_CLAMPED'
  | 'NAN_POSITION_RESET'
  | 'UNRESOLVED_SOURCE_REF'
  | 'UNRESOLVED_TARGET_REF'
  | 'UNRESOLVED_PARENT_REF'
  | 'FRAME_DURATION_EXTENDED'
  | 'ENTITY_BARELY_VISIBLE'
  | 'ENTITY_COUNT_HIGH'
  | 'FRAME_ENRICHED';

// ── Compiler Error & Warning ──────────────────────────────────────────

export interface CompilerError {
  code: CompilerErrorCode;
  message: string;
  suggestion: string;
  path?: string;
}

export interface CompilerWarning {
  code: CompilerWarningCode;
  message: string;
  entityId?: string;
  frameId?: string;
}

// ── CompileResult ─────────────────────────────────────────────────────

export type CompileResult =
  | { success: true; script: VisualScript; warnings: CompilerWarning[] }
  | { success: false; errors: CompilerError[] };

// ── Known Entity Types (re-exported from @preplai/shared) ────────────

export const KNOWN_ENTITY_TYPES: ReadonlySet<string> = SHARED_KNOWN_ENTITY_TYPES;

// ── Type-specific Size Defaults (base pixel dimensions at size=1.0) ────
// Used for clamping: half-width/height converted to % determines min margin.

export const BASE_ENTITY_SIZES: ReadonlyMap<string, { w: number; h: number }> = new Map([
  // Default fallback for unknown / unspecified types
  ['_default', { w: 80, h: 60 }],
  // Infrastructure
  ['User',         { w: 60,  h: 80  }],
  ['Server',       { w: 80,  h: 100 }],
  ['Database',     { w: 80,  h: 100 }],
  ['Container',    { w: 120, h: 80  }],
  ['Pod',          { w: 80,  h: 60  }],
  ['Cloud',        { w: 140, h: 80  }],
  ['Network',      { w: 120, h: 80  }],
  ['Device',       { w: 80,  h: 80  }],
  ['Arrow',        { w: 100, h: 20  }],
  ['DataFlow',     { w: 100, h: 20  }],
  ['BidirectArrow',{ w: 100, h: 20  }],
  ['DottedArrow',  { w: 100, h: 20  }],
  ['Process',      { w: 80,  h: 60  }],
  ['Queue',        { w: 120, h: 60  }],
  ['Cache',        { w: 80,  h: 80  }],
  ['LoadBalancer', { w: 80,  h: 60  }],
  ['Service',      { w: 80,  h: 60  }],
  // Abstract
  ['Concept',  { w: 100, h: 60 }],
  ['Entity',   { w: 80,  h: 60 }],
  ['Group',    { w: 200, h: 150 }],
  ['Label',    { w: 100, h: 40 }],
  ['H1',       { w: 200, h: 60 }],
  ['H2',       { w: 180, h: 50 }],
  ['H3',       { w: 160, h: 45 }],
  ['CodeBlock',{ w: 200, h: 120 }],
  ['Table',    { w: 200, h: 120 }],
  // Phase 1: Core Architecture Diagrams
  ['SequenceDiagram', { w: 300, h: 250 }],
  ['EREntity',        { w: 160, h: 140 }],
  ['ClassNode',       { w: 180, h: 160 }],
  ['SystemBoundary',  { w: 300, h: 200 }],
  ['CircuitBreaker',  { w: 60,  h: 80  }],
  // Phase 2: Domain-Specific
  ['ComponentNode',      { w: 120, h: 70  }],
  ['DataLake',           { w: 120, h: 60  }],
  ['DataWarehouse',      { w: 90,  h: 100 }],
  ['MLModel',            { w: 100, h: 70  }],
  ['FeatureStore',       { w: 100, h: 80  }],
  ['MindMapNode',        { w: 200, h: 200 }],
  ['UserJourneyStep',    { w: 300, h: 80  }],
  ['DeploymentStrategy', { w: 200, h: 120 }],
  // Phase 3: Microservices & Patterns
  ['Sidecar',         { w: 80,  h: 60  }],
  ['DeadLetterQueue', { w: 80,  h: 60  }],
  ['RateLimiter',     { w: 60,  h: 80  }],
  ['GPU',             { w: 80,  h: 60  }],
  ['Bundle',          { w: 80,  h: 60  }],
  ['SagaStep',        { w: 100, h: 60  }],
  // Extended Infrastructure
  ['Firewall',        { w: 60,  h: 80  }],
  ['Lambda',          { w: 80,  h: 60  }],
  ['Subnet',          { w: 120, h: 80  }],
  ['Volume',          { w: 80,  h: 80  }],
  ['Registry',        { w: 80,  h: 80  }],
  ['Monitor',         { w: 100, h: 80  }],
  ['Pipeline',        { w: 120, h: 60  }],
  ['Decision',        { w: 80,  h: 80  }],
  ['Cluster',         { w: 160, h: 120 }],
  // Docker & Storage
  ['DNSResolver',     { w: 80,  h: 60  }],
  ['Decorator',       { w: 80,  h: 60  }],
  ['Tmpfs',           { w: 80,  h: 60  }],
  ['DockerImage',     { w: 80,  h: 80  }],
  ['DockerRegistry',  { w: 80,  h: 80  }],
  // Abstract / Universal
  ['Comparison',      { w: 200, h: 120 }],
  ['Timeline',        { w: 300, h: 80  }],
  ['Metric',          { w: 100, h: 60  }],
  ['Cycle',           { w: 100, h: 100 }],
  ['Stack',           { w: 80,  h: 120 }],
  ['Badge',           { w: 80,  h: 40  }],
  ['Quote',           { w: 200, h: 80  }],
  // Math & Science
  ['Equation',        { w: 200, h: 60  }],
  ['Expression',      { w: 180, h: 50  }],
  ['Matrix',          { w: 160, h: 120 }],
  ['Graph2D',         { w: 200, h: 200 }],
  ['CoordinateSystem',{ w: 200, h: 200 }],
  // Physics
  ['FreeBodyDiagram', { w: 200, h: 200 }],
  ['Circuit',         { w: 200, h: 160 }],
  ['Wave',            { w: 200, h: 80  }],
  ['Vector',          { w: 120, h: 60  }],
  ['Field',           { w: 200, h: 160 }],
  // General Purpose
  ['Histogram',       { w: 200, h: 150 }],
  ['PieChart',        { w: 200, h: 200 }],
  ['FlowDiagram',     { w: 200, h: 160 }],
  ['VennDiagram',     { w: 200, h: 160 }],
  ['Annotation',      { w: 120, h: 60  }],
  ['BarChart',        { w: 200, h: 150 }],
  ['ScatterPlot',     { w: 200, h: 150 }],
  // Pedagogical
  ['StepList',        { w: 200, h: 120 }],
  ['Definition',      { w: 200, h: 80  }],
  ['Callout',         { w: 160, h: 80  }],
  ['Proof',           { w: 200, h: 160 }],
  ['Analogy',         { w: 200, h: 80  }],
  // Data Structures
  ['Array',           { w: 200, h: 60  }],
  ['LinkedList',      { w: 300, h: 60  }],
  ['BinaryTree',      { w: 200, h: 160 }],
  ['HashTable',       { w: 160, h: 120 }],
  ['Heap',            { w: 160, h: 120 }],
  ['GraphDS',         { w: 200, h: 160 }],
  ['Trie',            { w: 200, h: 160 }],
  ['List',            { w: 160, h: 80  }],
  ['Tuple',           { w: 160, h: 60  }],
  ['Set',             { w: 120, h: 80  }],
  ['Dict',            { w: 160, h: 120 }],
  // Algorithm Visualization
  ['ArrayCell',       { w: 60,  h: 60  }],
  ['RecursionTree',   { w: 200, h: 160 }],
  // Automata & Theory
  ['FSM',             { w: 200, h: 160 }],
  ['StateNode',       { w: 80,  h: 80  }],
  // Computer Architecture
  ['CPU',             { w: 100, h: 100 }],
  ['Register',        { w: 80,  h: 50  }],
  ['MemoryBlock',     { w: 80,  h: 60  }],
  ['LogicGate',       { w: 80,  h: 60  }],
  // Operating Systems
  ['ProcessBlock',    { w: 80,  h: 60  }],
  ['MemoryMap',       { w: 200, h: 160 }],
  ['Thread',          { w: 80,  h: 50  }],
  // Networking
  ['Packet',          { w: 80,  h: 50  }],
  // Machine Learning
  ['NeuralNetwork',   { w: 200, h: 160 }],
  // Compilers & PL
  ['CallStack',       { w: 100, h: 160 }],
  ['SymbolTable',     { w: 160, h: 120 }],
  // Databases
  ['BTree',           { w: 200, h: 120 }],
  ['QueryPlan',       { w: 200, h: 160 }],
  // OS extended
  ['ProcessState',    { w: 80,  h: 60  }],
  ['GanttChart',      { w: 300, h: 100 }],
  ['DeadlockGraph',   { w: 200, h: 160 }],
  // Architecture
  ['CacheHierarchy',  { w: 200, h: 160 }],
  ['PipelineStage',   { w: 100, h: 60  }],
  ['MemoryLayout',    { w: 200, h: 160 }],
  // Concurrency
  ['Semaphore',       { w: 80,  h: 80  }],
  ['Mutex',           { w: 80,  h: 80  }],
  // Theory
  ['TuringMachine',   { w: 200, h: 120 }],
  ['BigO',            { w: 160, h: 120 }],
  // Algorithms extended
  ['SortAnimation',   { w: 200, h: 120 }],
  ['GraphTraversal',  { w: 200, h: 160 }],
  // ML extended
  ['ConfusionMatrix', { w: 200, h: 160 }],
  // Software Architecture: API & Web
  ['APIEndpoint',     { w: 120, h: 50  }],
  ['HTTPRequest',     { w: 100, h: 50  }],
  ['HTTPResponse',    { w: 100, h: 50  }],
  ['WebSocket',       { w: 80,  h: 60  }],
  ['GraphQLSchema',   { w: 120, h: 80  }],
  ['Webhook',         { w: 80,  h: 60  }],
  // Software Architecture: Auth & Security
  ['AuthFlow',        { w: 120, h: 80  }],
  ['Token',           { w: 80,  h: 50  }],
  ['Certificate',     { w: 80,  h: 80  }],
  ['Secret',          { w: 80,  h: 60  }],
  // Software Architecture: Data & Messaging
  ['Schema',          { w: 120, h: 80  }],
  ['Migration',       { w: 100, h: 60  }],
  ['Event',           { w: 80,  h: 50  }],
  ['Stream',          { w: 120, h: 60  }],
  // Software Architecture: CI/CD & DevOps
  ['GitBranch',       { w: 80,  h: 60  }],
  ['GitCommit',       { w: 80,  h: 60  }],
  ['PullRequest',     { w: 100, h: 70  }],
  ['Build',           { w: 80,  h: 60  }],
  ['Deployment',      { w: 80,  h: 60  }],
  ['Rollback',        { w: 80,  h: 60  }],
  // Software Architecture: Cloud Infrastructure
  ['CDN',             { w: 100, h: 60  }],
  ['StorageBucket',   { w: 80,  h: 80  }],
  ['APIGateway',      { w: 100, h: 60  }],
  ['MessageBroker',   { w: 120, h: 60  }],
  // Software Architecture: Observability
  ['LogEntry',        { w: 200, h: 60  }],
  ['Alert',           { w: 80,  h: 60  }],
  ['Trace',           { w: 200, h: 80  }],
  ['Dashboard',       { w: 200, h: 120 }],
  // Software Architecture: Code & Architecture
  ['Module',          { w: 100, h: 70  }],
  ['Interface',       { w: 100, h: 60  }],
  ['ErrorState',      { w: 80,  h: 60  }],
  ['ConfigFile',      { w: 80,  h: 80  }],
  ['Dependency',      { w: 80,  h: 60  }],
  ['CronJob',         { w: 80,  h: 60  }],
  // Software Architecture: Collaboration
  ['Notification',    { w: 100, h: 60  }],
  ['Task',            { w: 80,  h: 50  }],
  ['File',            { w: 70,  h: 80  }],
  // Composable (Tier 2)
  ['Composable',      { w: 100, h: 80  }],
  // Text types
  ['Text',            { w: 160, h: 50  }],
  ['Span',            { w: 120, h: 40  }],
  // Connection types (not in SKIP_CLAMP_TYPES but are visual connectors)
  ['Transition',      { w: 100, h: 20  }],
  ['Bus',             { w: 120, h: 20  }],
]);

// ── Arrow-like types (skip position clamping — re-exported from shared) ──

export const SKIP_CLAMP_TYPES: ReadonlySet<string> = SHARED_SKIP_CLAMP_TYPES;
