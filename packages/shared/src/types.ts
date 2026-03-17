/**
 * @preplai/shared — Core TypeScript Interfaces
 *
 * These types are the single source of truth for all cross-package data contracts.
 * No package may define competing shapes for these types.
 */

// ── VisualEntityType Union (90 types) ─────────────────────────────────

export type VisualEntityType =
  // Infrastructure (15)
  | 'User' | 'Server' | 'Database' | 'Container' | 'Pod'
  | 'Cloud' | 'Network' | 'Device' | 'Arrow' | 'DataFlow'
  | 'Process' | 'Queue' | 'Cache' | 'LoadBalancer' | 'Service'
  // Extended Infrastructure (10)
  | 'Firewall' | 'Lambda' | 'Subnet' | 'Volume'
  | 'Registry' | 'Monitor' | 'Pipeline' | 'Decision' | 'Cluster'
  // Docker & Storage (6)
  | 'DNSResolver' | 'Decorator' | 'Tmpfs'
  | 'DockerImage' | 'DockerRegistry'
  // Flow / Connection (2)
  | 'BidirectArrow' | 'DottedArrow'
  // Abstract / Universal (12)
  | 'Concept' | 'Entity' | 'Group' | 'Label' | 'Comparison'
  // Headings (3)
  | 'H1' | 'H2' | 'H3'
  | 'Timeline' | 'Metric' | 'Cycle' | 'Stack'
  | 'Badge' | 'Quote'
  // Math & Science (6)
  | 'Equation' | 'Expression' | 'Matrix' | 'Graph2D'
  | 'CoordinateSystem'
  // Physics (6)
  | 'FreeBodyDiagram' | 'Circuit' | 'Wave' | 'Vector' | 'Field'
  // General Purpose (8)
  | 'Table' | 'Histogram' | 'PieChart' | 'FlowDiagram' | 'VennDiagram'
  | 'Annotation' | 'BarChart' | 'ScatterPlot'
  // Pedagogical (6)
  | 'StepList' | 'CodeBlock' | 'Definition' | 'Callout' | 'Proof' | 'Analogy'
  // Data Structures (11)
  | 'Array' | 'LinkedList' | 'BinaryTree' | 'HashTable' | 'Heap' | 'GraphDS' | 'Trie'
  | 'List' | 'Tuple' | 'Set' | 'Dict'
  // Algorithm Visualization (3)
  | 'ArrayCell' | 'RecursionTree'
  // Automata & Theory (3)
  | 'FSM' | 'StateNode' | 'Transition'
  // Computer Architecture (5)
  | 'CPU' | 'Register' | 'MemoryBlock' | 'LogicGate' | 'Bus'
  // Operating Systems (3)
  | 'ProcessBlock' | 'MemoryMap' | 'Thread'
  // Networking (1)
  | 'Packet'
  // Machine Learning (1)
  | 'NeuralNetwork'
  // Compilers & PL (4)
  | 'CallStack' | 'SymbolTable'
  // Databases (2)
  | 'BTree' | 'QueryPlan'
  // Operating Systems (4)
  | 'ProcessState' | 'GanttChart' | 'DeadlockGraph'
  // Architecture (3)
  | 'CacheHierarchy' | 'PipelineStage' | 'MemoryLayout'
  // Concurrency (2)
  | 'Semaphore' | 'Mutex'
  // Theory (2)
  | 'TuringMachine' | 'BigO'
  // Algorithms extended (2)
  | 'SortAnimation' | 'GraphTraversal'
  // ML extended (1)
  | 'ConfusionMatrix'
  // Software Architecture: API & Web (6)
  | 'APIEndpoint' | 'HTTPRequest' | 'HTTPResponse' | 'WebSocket' | 'GraphQLSchema' | 'Webhook'
  // Software Architecture: Auth & Security (4)
  | 'AuthFlow' | 'Token' | 'Certificate' | 'Secret'
  // Software Architecture: Data & Messaging (4)
  | 'Schema' | 'Migration' | 'Event' | 'Stream'
  // Software Architecture: CI/CD & DevOps (6)
  | 'GitBranch' | 'GitCommit' | 'PullRequest' | 'Build' | 'Deployment' | 'Rollback'
  // Software Architecture: Cloud Infrastructure (4)
  | 'CDN' | 'StorageBucket' | 'APIGateway' | 'MessageBroker'
  // Software Architecture: Observability (4)
  | 'LogEntry' | 'Alert' | 'Trace' | 'Dashboard'
  // Software Architecture: Code & Architecture (6)
  | 'Module' | 'Interface' | 'ErrorState' | 'ConfigFile' | 'Dependency' | 'CronJob'
  // Software Architecture: Collaboration (3)
  | 'Notification' | 'Task' | 'File';


// ── VisualEntity ──────────────────────────────────────────────────────

export interface VisualEntity {
  id: string;
  type: VisualEntityType;
  position: { x: number; y: number };

  size?: number;
  label?: string;
  color?: string;
  highlight?: boolean;

  animation?: {
    delay?: number;
    duration?: number;
    easing?: string;
    entrance?: string;
  };

  sourceEntityId?: string;
  targetEntityId?: string;
  parentEntityId?: string;

  textContent?: string;
  codeLanguage?: string;
  metadata?: Record<string, unknown>;
}


// ── Focus Cue (narration-synced highlight) ────────────────────────────

export interface FocusCue {
  /** Seconds from start of frame audio when this cue fires */
  time: number;
  /**
   * Entity IDs to highlight (multi-entity focus).
   * Primary entity is first in array.
   */
  entityIds: string[];
  /**
   * Per-entity confidence scores (0-1), same order as entityIds.
   * If omitted, all entities get confidence 1.0.
   */
  confidences?: number[];
  /** @deprecated Use entityIds[0]. Kept for backward compatibility. */
  entityId?: string;
  /** The word/phrase in narration that triggered this cue */
  word?: string;
  /** Narration text segment active while this cue is in effect */
  segment?: string;
}

// ── Frame Audio (populated by server after TTS generation) ────────────

export interface FrameAudio {
  /** URL path to serve audio: /audio/:sessionId/:frameIndex.mp3 */
  url: string;
  /** Duration of audio in seconds */
  duration: number;
  /** Timed focus cues derived from word timestamps + entity matching */
  focusCues: FocusCue[];
  /** Generation status */
  status: 'pending' | 'ready' | 'error';
  /** Error message if status is 'error' */
  errorMessage?: string;
}

// ── IllustrationFrame ─────────────────────────────────────────────────

export interface IllustrationFrame {
  id: string;
  startTime: number;
  endTime: number;
  entities: VisualEntity[];
  transitions?: EntityTransition[];
  narrationSegment: string;
  description: string;
  /** ISO 639-1 language code for this frame's narration (overrides script-level) */
  language?: string;
  /** Audio metadata populated by server after ElevenLabs TTS generation */
  audio?: FrameAudio;
  /** Agent-provided explicit focus cues (override auto-detect) */
  focusCues?: FocusCue[];
}


// ── EntityTransition ──────────────────────────────────────────────────

export interface EntityTransition {
  entityId: string;
  from: Partial<VisualEntity>;
  to: Partial<VisualEntity>;
  duration: number;
  easing?: string;
}


// ── VisualScript ──────────────────────────────────────────────────────

export interface VisualScript {
  sceneId: string;
  frames: IllustrationFrame[];
  totalDuration: number;
  entities?: Record<string, VisualEntity>;
  style?: 'cinema' | 'light';
  /** ISO 639-1 language code for narration (e.g. 'en', 'fr', 'it'). Default: 'en' */
  language?: string;
}


// ── Session Types ─────────────────────────────────────────────────────

export type SessionState = 'idle' | 'building' | 'ready' | 'playing' | 'completed';
export type SessionStatus = 'active' | 'expired' | 'archived';

export interface Session {
  id: string;
  title: string;
  domain?: string;
  state: SessionState;
  status: SessionStatus;
  sceneIds: string[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface SceneRecord {
  id: string;
  sessionId: string;
  orderIndex: number;
  visualScriptJson: string;
  narrationText?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}


// ── API Types ─────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_ARCHIVED'
  | 'SCENE_NOT_FOUND'
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  suggestion: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export const ok = <T>(data: T): ApiResponse<T> => ({ success: true, data });

export const fail = (
  code: ApiErrorCode,
  message: string,
  suggestion: string,
  details?: Record<string, unknown>,
): ApiResponse<never> => ({
  success: false,
  error: { code, message, suggestion, details },
});

export type McpToolResult<T> =
  | { ok: true; result: T }
  | { ok: false; error: Pick<ApiError, 'code' | 'message' | 'suggestion'> };

export type McpToolName =
  | 'create_session'
  | 'add_scene'
  | 'update_scene'
  | 'add_narration'
  | 'get_session_url';

export type EntranceAnimationClass =
  | 'entrance-fadeInUp'
  | 'entrance-fadeIn'
  | 'entrance-drawIn'
  | 'entrance-scaleIn';
