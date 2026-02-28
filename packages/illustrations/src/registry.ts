/**
 * @pre/illustrations — Component Registry
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

import type { VisualEntity } from '@pre/shared';

// ── Fully implemented components
import { renderServer } from './components/server.js';
import { renderDatabase } from './components/database.js';
import { renderUser } from './components/user.js';
import { renderCloud } from './components/cloud.js';
import { renderConcept } from './components/concept.js';
import { renderCodeBlock } from './components/codeblock.js';
import { renderArrow, renderDataFlow } from './components/arrow.js';
import { renderGraph2D } from './components/graph2d.js';

// ── Generic renderer for types not yet fully implemented
import { createGenericRenderer } from './components/generic.js';

// ── Build generic renderers per category / default color
const infra    = createGenericRenderer('#00e5ff');         // Infrastructure default
const infraAlt = createGenericRenderer('#00e676');         // Infrastructure green
const infraOrg = createGenericRenderer('#ffab00');         // Infrastructure orange
const infraPrp = createGenericRenderer('#b388ff');         // Infrastructure purple
const infraRed = createGenericRenderer('#ff4444');         // Infrastructure red
const infraBlu = createGenericRenderer('#4488ff');         // Infrastructure blue
const univCyan = createGenericRenderer('#00e5ff');         // Universal
const univOrg  = createGenericRenderer('#ffab00');         // Universal orange
const univGrn  = createGenericRenderer('#00e676');         // Universal green
const univBcd  = createGenericRenderer('#00bcd4');         // Universal teal
const univPrp  = createGenericRenderer('#b388ff');         // Universal purple
const univPink = createGenericRenderer('#ff2d7b');         // Universal pink
const univRed  = createGenericRenderer('#ff6b6b');         // Universal red
const mathSci  = createGenericRenderer('#00e5ff');         // Math
const mathPrp  = createGenericRenderer('#b388ff');         // Math purple
const physOrg  = createGenericRenderer('#ffab00');         // Physics orange
const physBcd  = createGenericRenderer('#00bcd4');         // Physics teal
const physPnk  = createGenericRenderer('#ff6b9d');         // Physics pink
const physPrp  = createGenericRenderer('#b388ff');         // Physics purple
const genGrn   = createGenericRenderer('#00e676');         // General green
const genBcd   = createGenericRenderer('#00bcd4');         // General teal
const genOrg   = createGenericRenderer('#ffab00');         // General orange
const pedGrn   = createGenericRenderer('#00e676');         // Pedagogical green
const pedOrg   = createGenericRenderer('#ffab00');         // Pedagogical orange
const pedPrp   = createGenericRenderer('#b388ff');         // Pedagogical purple
const dsGrn    = createGenericRenderer('#00e676');         // Data structure green
const dsOrg    = createGenericRenderer('#ffab00');         // Data structure orange
const dsBcd    = createGenericRenderer('#00bcd4');         // Data structure teal
const dsPrp    = createGenericRenderer('#b388ff');         // Data structure purple
const algoGrn  = createGenericRenderer('#00e5ff');         // Algorithm
const algoRed  = createGenericRenderer('#ff6b6b');         // Algorithm red
const algoPrp  = createGenericRenderer('#b388ff');         // Algorithm purple
const csArch   = createGenericRenderer('#00e5ff');         // Computer Architecture
const csArchOrg = createGenericRenderer('#ffab00');        // Comp arch orange
const csArchPrp = createGenericRenderer('#b388ff');        // Comp arch purple
const csArchGrn = createGenericRenderer('#00e676');        // Comp arch green
const osBcd    = createGenericRenderer('#00bcd4');         // OS teal
const osGrn    = createGenericRenderer('#00e676');         // OS green
const osPrp    = createGenericRenderer('#b388ff');         // OS purple
const netCyan  = createGenericRenderer('#00e5ff');         // Networking
const netOrg   = createGenericRenderer('#ffab00');         // Networking orange
const mlPrp    = createGenericRenderer('#b388ff');         // ML purple
const mlCyan   = createGenericRenderer('#00e5ff');         // ML cyan

// Diamond shape for Decision
const decisionDiamond = createGenericRenderer('#ffab00', 'diamond');
// Hexagon for LoadBalancer
const loadBalancerHex = createGenericRenderer('#00e5ff', 'hexagon');
// Circle shapes
const circleCache = createGenericRenderer('#00e676', 'circle');
const circleMetric = createGenericRenderer('#ff2d7b', 'circle');
const circleCycle = createGenericRenderer('#00bcd4', 'circle');
const circleParticle = createGenericRenderer('#ff6b9d', 'circle');
const circleCluster = createGenericRenderer('#4488ff', 'circle');

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

  // ── Infrastructure (generic stubs)
  Container: infraAlt,
  Pod: infraAlt,
  Network: infra,
  Device: infraOrg,
  Process: univBcd,
  Queue: infraOrg,
  Cache: circleCache,
  LoadBalancer: loadBalancerHex,
  Service: infra,
  Firewall: infraRed,
  APIGateway: infra,
  Lambda: infraOrg,
  Subnet: infraBlu,
  Volume: infraPrp,
  Registry: infraAlt,
  Monitor: infraAlt,
  Pipeline: univBcd,
  Decision: decisionDiamond,
  Cluster: circleCluster,

  // ── Flow / Connection (special)
  Arrow: renderArrow as any,    // Extended signature handled by renderEntity dispatcher
  DataFlow: renderDataFlow as any,

  // ── Universal
  Concept: renderConcept,
  Entity: univCyan,
  Group: univBcd,
  Label: univOrg,
  Comparison: univOrg,
  Timeline: univGrn,
  Metric: circleMetric,
  Cycle: circleCycle,
  Stack: univPrp,
  Tree: univGrn,
  Badge: univRed,
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
  StepList: infra,
  CodeBlock: renderCodeBlock,
  Definition: pedGrn,
  Callout: pedOrg,
  Proof: pedPrp,
  Analogy: infra,

  // ── Data Structures
  Array: infra,
  LinkedList: dsGrn,
  BinaryTree: dsPrp,
  HashTable: dsOrg,
  Heap: dsBcd,
  GraphDS: infra,
  Trie: dsGrn,

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
  MemoryMap: osPrp,
  Thread: osGrn,

  // ── Networking
  Packet: netCyan,
  ProtocolStack: netOrg,

  // ── Machine Learning
  NeuralNetwork: mlPrp,
  DecisionBoundary: mlCyan,
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
