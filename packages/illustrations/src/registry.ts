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
import { renderAnalogy } from './components/analogy.js';
import { renderAnnotation } from './components/annotation.js';
import { renderComparison } from './components/card-types.js';
import { renderQuote } from './components/quote.js';
import { renderH1, renderH2, renderH3 } from './components/heading.js';
import { renderStack } from './components/stack.js';
import { renderArray } from './components/array.js';
import { renderArrayCell } from './components/arraycell.js';
import { renderLinkedList } from './components/linkedlist.js';
import { renderBinaryTree } from './components/binarytree.js';
import { renderHashTable } from './components/hashtable.js';
import { renderQueue } from './components/queue.js';
import { renderDecorator } from './components/decorator.js';
import { renderDNSResolver } from './components/dnsresolver.js';
import { renderVolume } from './components/volume.js';
import { renderTmpfs } from './components/tmpfs.js';
import { renderList } from './components/list.js';
import { renderTuple } from './components/tuple.js';
import { renderSet } from './components/set.js';
import { renderDockerImage } from './components/dockerimage.js';
import { renderDockerRegistry } from './components/dockerregistry.js';
import { renderCallStack } from './components/callstack.js';
import { renderBTree } from './components/btree.js';
import { renderProcessState } from './components/processstate.js';
import { renderDeadlockGraph } from './components/deadlockgraph.js';
import { renderGanttChart } from './components/ganttchart.js';
import { renderCacheHierarchy } from './components/cachehierarchy.js';
import { renderMemoryLayout } from './components/memorylayout.js';
import { renderConfusionMatrix } from './components/confusionmatrix.js';
import { renderBarChart } from './components/barchart.js';
import { renderCoordinateSystem } from './components/coordinatesystem.js';
import { renderCycle } from './components/cycle.js';
import { renderEquation } from './components/equation.js';
import { renderExpression } from './components/expression.js';
import { renderBigO } from './components/bigo.js';
import { renderService } from './components/service.js';
import { renderFirewall } from './components/firewall.js';
import { renderCPU } from './components/cpu.js';
import { renderEntityNode } from './components/entity.js';
import { renderFlowDiagram } from './components/flowdiagram.js';
import { renderFreeBodyDiagram } from './components/freebodydiagram.js';
import { renderFSM } from './components/fsm.js';
import { renderHeap } from './components/heap.js';
import { renderHistogram } from './components/histogram.js';
import { renderMatrix } from './components/matrix.js';
import { renderMemoryBlock } from './components/memoryblock.js';
import { renderMemoryMap } from './components/memorymap.js';
import { renderMonitor } from './components/monitor.js';
import { renderNeuralNetwork } from './components/neuralnetwork.js';
import { renderPacket } from './components/packet.js';
import { renderPieChart } from './components/piechart.js';
import { renderPipelineStage } from './components/pipelinestage.js';
import { renderPod } from './components/pod.js';
import { renderProcess } from './components/process.js';
import { renderProtocolLayer } from './components/protocollayer.js';
import { renderRecursionTree } from './components/recursiontree.js';
import { renderScatterPlot } from './components/scatterplot.js';
import { renderSemaphore } from './components/semaphore.js';
import { renderSubnet } from './components/subnet.js';

// ── Generic renderer for types not yet fully implemented
import { createGenericRenderer } from './components/generic.js';
import { getCategoryColor } from './design-tokens.js';

// ── Build generic renderers using design tokens
const generic = (type: string, shape: 'rect' | 'circle' | 'diamond' | 'hexagon' = 'rect') =>
  createGenericRenderer(getCategoryColor(type), shape);

const infraGeneric = generic('Service');
const infraOrg = generic('Queue');  // fallback only; renderQueue used
const univGrn = generic('Tree');
const univBcd = generic('Group');
const univRed = generic('Badge');
const physBcd = generic('Wave');
const physPnk = generic('Vector');
const dsGrn = generic('LinkedList');
const dsOrg = generic('HashTable');  // fallback only; renderHashTable used
const dsPrp = generic('BinaryTree');
const csArchGrn = generic('LogicGate');
const osGrn = generic('Thread');
const netOrg = generic('ProtocolStack');

const decisionDiamond = generic('Decision', 'diamond');
const circleCache = generic('StateNode', 'circle');
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
  Pod: renderPod,
  Network: renderNetwork,
  Device: renderDevice,
  Process: renderProcess,
  Queue: renderQueue,
  Cache: renderCache,
  LoadBalancer: renderLoadBalancer,
  Service: renderService,
  Firewall: renderFirewall,
  Lambda: renderLambda,
  Subnet: renderSubnet,
  Volume: renderVolume,
  DNSResolver: renderDNSResolver,
  Decorator: renderDecorator,
  Tmpfs: renderTmpfs,
  DockerImage: renderDockerImage,
  DockerRegistry: renderDockerRegistry,
  Monitor: renderMonitor,
  Pipeline: renderPipeline,
  Decision: decisionDiamond,
  Cluster: circleCluster,

  // ── Flow / Connection (special)
  Arrow: renderArrow as any,    // Extended signature handled by renderEntity dispatcher
  BidirectArrow: renderArrow as any,
  DottedArrow: renderArrow as any,
  DataFlow: renderDataFlow as any,

  // ── Universal
  Concept: renderConcept,
  Entity: renderEntityNode,
  Group: renderGroup,
  H1: renderH1,
  H2: renderH2,
  H3: renderH3,
  Comparison: renderComparison,
  Timeline: renderTimeline,
  Metric: renderMetric,
  Cycle: renderCycle,
  Stack: renderStack,
  Tree: univGrn,
  Badge: renderBadge,
  Quote: renderQuote,

  // ── Math & Science (Graph2D fully implemented)
  Equation: renderEquation,
  Expression: renderExpression,
  Matrix: renderMatrix,
  Graph2D: renderGraph2D,
  CoordinateSystem: renderCoordinateSystem,

  // ── Physics
  FreeBodyDiagram: renderFreeBodyDiagram,
  Wave: physBcd,
  Vector: physPnk,

  // ── General Purpose
  Table: infraGeneric,
  Histogram: renderHistogram,
  PieChart: renderPieChart,
  FlowDiagram: renderFlowDiagram,
  VennDiagram: infraGeneric,
  Annotation: renderAnnotation,
  BarChart: renderBarChart,
  ScatterPlot: renderScatterPlot,

  // ── Pedagogical (CodeBlock fully implemented)
  StepList: renderStepList,
  CodeBlock: renderCodeBlock,
  Definition: renderDefinition,
  Callout: renderCallout,
  Analogy: renderAnalogy,

  // ── Data Structures
  Array: renderArray,
  LinkedList: renderLinkedList,
  BinaryTree: renderBinaryTree,
  BTree: renderBTree,
  HashTable: renderHashTable,
  Dict: renderHashTable,
  Heap: renderHeap,
  Trie: dsGrn,
  List: renderList,
  Tuple: renderTuple,
  Set: renderSet,

  // ── Algorithm Visualization
  ArrayCell: renderArrayCell,
  RecursionTree: renderRecursionTree,

  // ── Automata & Theory
  FSM: renderFSM,
  StateNode: circleCache,
  Transition: infraGeneric,  // Special: needs source/target, handled like Arrow

  // ── Computer Architecture
  CPU: renderCPU,
  MemoryBlock: renderMemoryBlock,
  LogicGate: csArchGrn,
  Bus: renderDataFlow as any,  // Uses DataFlow for bus connections

  // ── Operating Systems
  ProcessState: renderProcessState,
  GanttChart: renderGanttChart,
  DeadlockGraph: renderDeadlockGraph,
  MemoryMap: renderMemoryMap,
  Thread: osGrn,

  // ── Architecture
  CacheHierarchy: renderCacheHierarchy,
  PipelineStage: renderPipelineStage,
  MemoryLayout: renderMemoryLayout,

  // ── Networking
  Packet: renderPacket,
  ProtocolStack: netOrg,

  // ── Machine Learning
  NeuralNetwork: renderNeuralNetwork,
  ConfusionMatrix: renderConfusionMatrix,

  // ── Compilers & PL
  CallStack: renderCallStack,
  SymbolTable: infraGeneric,

  // ── Databases
  QueryPlan: infraGeneric,

  // ── Concurrency
  Semaphore: renderSemaphore,
  Mutex: generic('Mutex'),

  // ── Networking extended
  ProtocolLayer: renderProtocolLayer,

  // ── Theory
  TuringMachine: generic('TuringMachine'),
  BigO: renderBigO,

  // ── Algorithms extended
  SortAnimation: generic('SortAnimation'),
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

  // Arrow, BidirectArrow, DottedArrow, DataFlow, Transition, Bus need position resolution
  if (
    entity.type === 'Arrow' ||
    entity.type === 'BidirectArrow' ||
    entity.type === 'DottedArrow' ||
    entity.type === 'DataFlow' ||
    entity.type === 'Transition' ||
    entity.type === 'Bus'
  ) {
    // Cast to extended signature
    return (fn as any)(entity, allEntities, parentEl);
  }

  return fn(entity, parentEl);
}
