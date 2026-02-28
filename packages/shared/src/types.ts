/**
 * @pre/shared — Core TypeScript Interfaces
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
  | 'Firewall' | 'APIGateway' | 'Lambda' | 'Subnet' | 'Volume'
  | 'Registry' | 'Monitor' | 'Pipeline' | 'Decision' | 'Cluster'
  // Flow / Connection (2)
  | 'BidirectArrow' | 'DottedArrow'
  // Abstract / Universal (12)
  | 'Concept' | 'Entity' | 'Group' | 'Label' | 'Comparison'
  | 'Timeline' | 'Metric' | 'Cycle' | 'Stack' | 'Tree'
  | 'Badge' | 'Quote'
  // Math & Science (6)
  | 'Equation' | 'Expression' | 'Matrix' | 'Graph2D'
  | 'NumberLine' | 'CoordinateSystem'
  // Physics (6)
  | 'FreeBodyDiagram' | 'Circuit' | 'Wave' | 'Vector' | 'Field' | 'Particle'
  // General Purpose (8)
  | 'Table' | 'Histogram' | 'PieChart' | 'FlowDiagram' | 'VennDiagram'
  | 'Annotation' | 'BarChart' | 'ScatterPlot'
  // Pedagogical (6)
  | 'StepList' | 'CodeBlock' | 'Definition' | 'Callout' | 'Proof' | 'Analogy'
  // Data Structures (7)
  | 'Array' | 'LinkedList' | 'BinaryTree' | 'HashTable' | 'Heap' | 'GraphDS' | 'Trie'
  // Algorithm Visualization (3)
  | 'ArrayCell' | 'Pointer' | 'RecursionTree'
  // Automata & Theory (3)
  | 'FSM' | 'StateNode' | 'Transition'
  // Computer Architecture (5)
  | 'CPU' | 'Register' | 'MemoryBlock' | 'LogicGate' | 'Bus'
  // Operating Systems (3)
  | 'ProcessBlock' | 'MemoryMap' | 'Thread'
  // Networking (2)
  | 'Packet' | 'ProtocolStack'
  // Machine Learning (2)
  | 'NeuralNetwork' | 'DecisionBoundary';


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


// ── IllustrationFrame ─────────────────────────────────────────────────

export interface IllustrationFrame {
  id: string;
  startTime: number;
  endTime: number;
  entities: VisualEntity[];
  transitions?: EntityTransition[];
  narrationSegment: string;
  description: string;
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
