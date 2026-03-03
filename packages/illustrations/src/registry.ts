/**
 * @preplai/illustrations — Component Registry
 *
 * Maps VisualEntityType string → render function.
 * Dispatches entities to the appropriate component.
 *
 * Render function signature:
 *   (entity: VisualEntity, parentEl: SVGElement) → SVGElement
 *
 * Arrow/DataFlow use extended signature:
 *   (entity: VisualEntity, allEntities: VisualEntity[], parentEl: SVGElement) → SVGElement | null
 */

import type { VisualEntity } from '@preplai/shared';

// ── Fully implemented components
import { renderServer } from './components/server.js';
import { renderDatabase } from './components/database.js';
import { renderUser } from './components/user.js';
import { renderCloud } from './components/cloud.js';
import { renderConcept } from './components/concept.js';
import { renderCodeBlock } from './components/codeblock.js';
import { renderArrow, renderDataFlow } from './components/arrow.js';
import { renderGraph2D } from './components/graph2d.js';
import { renderContainer } from './components/container.js';
import { renderNetwork } from './components/network.js';
import { renderDevice } from './components/device.js';
import { renderCache } from './components/cache.js';
import { renderLoadBalancer } from './components/loadbalancer.js';
import { renderLambda } from './components/lambda.js';
import { renderPipeline } from './components/pipeline.js';
import { renderGroup } from './components/group.js';
import { renderMetric } from './components/metric.js';
import { renderBadge } from './components/badge.js';
import { renderTimeline } from './components/timeline.js';
import { renderStepList } from './components/steplist.js';
import { renderDefinition } from './components/definition.js';
import { renderCallout } from './components/callout.js';
import { renderArray } from './components/array.js';
import { renderLinkedList } from './components/linkedlist.js';
import { renderBinaryTree } from './components/binarytree.js';
import { renderHashTable } from './components/hashtable.js';
import { renderQueue } from './components/queue.js';
import { renderDecorator } from './components/decorator.js';
import { renderDNSResolver } from './components/dnsresolver.js';
import { renderVolume } from './components/volume.js';
import { renderBindMount } from './components/bindmount.js';
import { renderTmpfs } from './components/tmpfs.js';
import { renderList } from './components/list.js';
import { renderTuple } from './components/tuple.js';
import { renderSet } from './components/set.js';
import { renderDockerImage } from './components/dockerimage.js';
import { renderDockerRegistry } from './components/dockerregistry.js';
import { renderAST } from './components/ast.js';
import { renderCallStack } from './components/callstack.js';
import { renderBTree } from './components/btree.js';
import { renderProcessState } from './components/processstate.js';
import { renderGanttChart } from './components/ganttchart.js';
import { renderCacheHierarchy } from './components/cachehierarchy.js';
import { renderMemoryLayout } from './components/memorylayout.js';
import { renderConfusionMatrix } from './components/confusionmatrix.js';

// ── Generic renderer for types not yet fully implemented
import { createGenericRenderer } from './components/generic.js';
import { getCategoryColor } from './design-tokens.js';

// ── Build generic renderers using design tokens
const generic = (type: string, shape: 'rect' | 'circle' | 'diamond' | 'hexagon' = 'rect') =>
  createGenericRenderer(getCategoryColor(type), shape);

const infra = generic('Service');
const infraAlt = generic('Pod');
const infraOrg = generic('Queue');  // fallback only; renderQueue used
const infraRed = generic('Firewall');
const infraBlu = generic('Subnet');
const univCyan = generic('Entity');
const univOrg = generic('Label');
const univGrn = generic('Tree');
const univBcd = generic('Group');
const univPrp = generic('Stack');
const univRed = generic('Badge');
const mathSci = generic('Equation');
const mathPrp = generic('Matrix');
const physOrg = generic('Circuit');
const physBcd = generic('Wave');
const physPnk = generic('Vector');
const physPrp = generic('Field');
const genGrn = generic('Histogram');
const genBcd = generic('FlowDiagram');
const genOrg = generic('Annotation');
const pedPrp = generic('Proof');
const dsGrn = generic('LinkedList');
const dsOrg = generic('HashTable');  // fallback only; renderHashTable used
const dsBcd = generic('Heap');
const dsPrp = generic('BinaryTree');
const algoGrn = generic('ArrayCell');
const algoRed = generic('Pointer');
const algoPrp = generic('RecursionTree');
const csArch = generic('CPU');
const csArchOrg = generic('Register');
const csArchPrp = generic('MemoryBlock');
const csArchGrn = generic('LogicGate');
const osBcd = generic('ProcessBlock');
const osGrn = generic('Thread');
const osPrp = generic('MemoryMap');
const netCyan = generic('Packet');
const netOrg = generic('ProtocolStack');
const mlPrp = generic('NeuralNetwork');
const mlCyan = generic('DecisionBoundary');

const decisionDiamond = generic('Decision', 'diamond');
const circleCache = generic('StateNode', 'circle');
const circleCycle = generic('Cycle', 'circle');
const circleParticle = generic('Particle', 'circle');
const circleCluster = generic('Cluster', 'circle');

/**
 * The global component registry.
 * Maps VisualEntityType string → render function.
 */
export const registry: Record<string, (entity: VisualEntity, parentEl: SVGElement) => SVGGElement> = {
  // ── Infrastructure (fully implemented)
  User: renderUser,
  Server: renderServer,
  Database: renderDatabase,
  Cloud: renderCloud,

  // ── Infrastructure (fully implemented)
  Container: renderContainer,
  Pod: infraAlt,
  Network: renderNetwork,
  Device: renderDevice,
  Process: univBcd,
  Queue: renderQueue,
  Cache: renderCache,
  LoadBalancer: renderLoadBalancer,
  Service: infra,
  Firewall: infraRed,
  APIGateway: infra,
  Lambda: renderLambda,
  Subnet: infraBlu,
  Volume: renderVolume,
  Registry: infraAlt,
  DNSResolver: renderDNSResolver,
  Decorator: renderDecorator,
  BindMount: renderBindMount,
  Tmpfs: renderTmpfs,
  DockerImage: renderDockerImage,
  DockerRegistry: renderDockerRegistry,
  Monitor: infraAlt,
  Pipeline: renderPipeline,
  Decision: decisionDiamond,
  Cluster: circleCluster,

  // ── Flow / Connection (special)
  Arrow: renderArrow as any,    // Extended signature handled by renderEntity dispatcher
  DataFlow: renderDataFlow as any,

  // ── Universal
  Concept: renderConcept,
  Entity: univCyan,
  Group: renderGroup,
  Label: univOrg,
  Comparison: univOrg,
  Timeline: renderTimeline,
  Metric: renderMetric,
  Cycle: circleCycle,
  Stack: univPrp,
  Tree: univGrn,
  Badge: renderBadge,
  Quote: univPrp,

  // ── Math & Science (Graph2D fully implemented)
  Equation: mathSci,
  Expression: mathSci,
  Matrix: mathPrp,
  Graph2D: renderGraph2D,
  NumberLine: mathSci,
  CoordinateSystem: mathSci,

  // ── Physics
  FreeBodyDiagram: physOrg,
  Circuit: physOrg,
  Wave: physBcd,
  Vector: physPnk,
  Field: physPrp,
  Particle: circleParticle,

  // ── General Purpose
  Table: infra,
  Histogram: genGrn,
  PieChart: infra,
  FlowDiagram: genBcd,
  VennDiagram: infra,
  Annotation: genOrg,
  BarChart: infra,
  ScatterPlot: infra,

  // ── Pedagogical (CodeBlock fully implemented)
  StepList: renderStepList,
  CodeBlock: renderCodeBlock,
  Definition: renderDefinition,
  Callout: renderCallout,
  Proof: pedPrp,
  Analogy: infra,

  // ── Data Structures
  Array: renderArray,
  LinkedList: renderLinkedList,
  BinaryTree: renderBinaryTree,
  BTree: renderBTree,
  HashTable: renderHashTable,
  Dict: renderHashTable,
  Heap: dsBcd,
  GraphDS: infra,
  Trie: dsGrn,
  List: renderList,
  Tuple: renderTuple,
  Set: renderSet,

  // ── Algorithm Visualization
  ArrayCell: algoGrn,
  Pointer: algoRed,
  RecursionTree: algoPrp,

  // ── Automata & Theory
  FSM: infra,
  StateNode: circleCache,
  Transition: infra,  // Special: needs source/target, handled like Arrow

  // ── Computer Architecture
  CPU: csArch,
  Register: csArchOrg,
  MemoryBlock: csArchPrp,
  LogicGate: csArchGrn,
  Bus: csArch,  // Special: needs source/target

  // ── Operating Systems
  ProcessBlock: osBcd,
  ProcessState: renderProcessState,
  GanttChart: renderGanttChart,
  PageTable: osBcd,
  DeadlockGraph: infraRed,
  MemoryMap: osPrp,
  Thread: osGrn,

  // ── Architecture
  CacheHierarchy: renderCacheHierarchy,
  PipelineStage: infra,
  MemoryLayout: renderMemoryLayout,

  // ── Networking
  Packet: netCyan,
  ProtocolStack: netOrg,

  // ── Machine Learning
  NeuralNetwork: mlPrp,
  DecisionBoundary: mlCyan,
  ConfusionMatrix: renderConfusionMatrix,

  // ── Compilers & PL
  AST: renderAST,
  CallStack: renderCallStack,
  ParseTree: renderAST,
  SymbolTable: infra,

  // ── Databases
  QueryPlan: infra,

  // ── Concurrency
  Semaphore: generic('Semaphore'),
  Mutex: generic('Mutex'),

  // ── Networking extended
  OSILayer: generic('OSILayer'),
  ProtocolLayer: generic('ProtocolLayer'),

  // ── Theory
  TuringMachine: generic('TuringMachine'),
  BigO: generic('BigO'),

  // ── Algorithms extended
  SortAnimation: generic('SortAnimation'),
  GraphTraversal: generic('GraphTraversal'),
};

/**
 * Render a single entity and append it to parentEl.
 *
 * @param entity      - VisualEntity descriptor
 * @param parentEl    - SVG root or group to append into
 * @param allEntities - Full entities array (required for Arrow/DataFlow)
 * @returns The created element, or null if type unknown
 */
export function renderEntity(
  entity: VisualEntity,
  parentEl: SVGElement,
  allEntities: VisualEntity[] = [],
): SVGElement | null {
  const fn = registry[entity.type];

  if (!fn) {
    console.warn(`[PRE registry] Unknown entity type: "${entity.type}". Skipping.`);
    return null;
  }

  // Arrow, DataFlow, Transition, and Bus need position resolution across all entities
  if (
    entity.type === 'Arrow' ||
    entity.type === 'DataFlow' ||
    entity.type === 'Transition' ||
    entity.type === 'Bus'
  ) {
    // Cast to extended signature
    return (fn as any)(entity, allEntities, parentEl);
  }

  return fn(entity, parentEl);
}
