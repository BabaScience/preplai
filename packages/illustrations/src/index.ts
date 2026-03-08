/**
 * @preplai/illustrations — Public API
 *
 * Re-exports all utilities, components, and the registry
 * for use by @preplai/player and @preplai/compiler.
 */

// ── Core utilities
export {
  SVG_NS,
  buildEntityGroup,
  applyEntranceAnimation,
  getSizeParam,
  VISIBILITY_BASE,
  SIZE_CLAMP_MIN,
  SIZE_CLAMP_MAX,
} from './utils.js';

// ── Design tokens & visual utilities
export {
  COLORS,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  getCategoryColor,
  ENTITY_COLORS,
} from './design-tokens.js';
export {
  createLinearGradient,
  createRadialGradient,
  createDarkGradient,
  ensureDefs,
  ensureDropShadowFilter,
} from './visual-utils.js';

// ── Registry & dispatcher
export { registry, renderEntity } from './registry.js';

// ── Fully implemented components (direct access)
export { renderServer } from './components/server.js';
export { renderDatabase } from './components/database.js';
export { renderUser } from './components/user.js';
export { renderCloud } from './components/cloud.js';
export { renderConcept } from './components/concept.js';
export { renderEntityNode } from './components/entity.js';
export { renderFlowDiagram } from './components/flowdiagram.js';
export { renderVennDiagram } from './components/venndiagram.js';
export { renderFreeBodyDiagram } from './components/freebodydiagram.js';
export { renderVector } from './components/vector.js';
export { renderWave } from './components/wave.js';
export { renderEquation, formatMathExpression } from './components/equation.js';
export { renderExpression } from './components/expression.js';
export { renderCodeBlock } from './components/codeblock.js';
export { renderArrow, renderDataFlow } from './components/arrow.js';
export { resolveEntityRef } from '@preplai/shared';
export { renderGraph2D } from './components/graph2d.js';
export { renderContainer } from './components/container.js';
export { renderNetwork } from './components/network.js';
export { renderDevice } from './components/device.js';
export { renderCache } from './components/cache.js';
export { renderLoadBalancer } from './components/loadbalancer.js';
export { renderFirewall } from './components/firewall.js';
export { renderLambda } from './components/lambda.js';
export { renderPipeline } from './components/pipeline.js';
export { renderGroup } from './components/group.js';
export { renderMetric } from './components/metric.js';
export { renderMonitor } from './components/monitor.js';
export { renderBadge } from './components/badge.js';
export { renderTimeline } from './components/timeline.js';
export { renderStepList } from './components/steplist.js';
export { renderDefinition } from './components/definition.js';
export { renderCallout } from './components/callout.js';
export { renderQuote } from './components/quote.js';
export { renderAnalogy } from './components/analogy.js';
export { renderAnnotation } from './components/annotation.js';
export { createTextCardRenderer } from './components/text-card.js';
export { renderArray } from './components/array.js';
export { renderSortAnimation } from './components/sortanimation.js';
export { renderLinkedList } from './components/linkedlist.js';
export { renderBinaryTree } from './components/binarytree.js';
export { renderHashTable } from './components/hashtable.js';
export { renderTable } from './components/table.js';
export { renderThread } from './components/thread.js';
export { renderQueue } from './components/queue.js';
export { renderDecorator } from './components/decorator.js';
export { renderDNSResolver } from './components/dnsresolver.js';
export { renderVolume } from './components/volume.js';
export { renderList } from './components/list.js';
export { renderTuple } from './components/tuple.js';
export { renderSet } from './components/set.js';
export { renderDockerImage } from './components/dockerimage.js';
export { renderDockerRegistry } from './components/dockerregistry.js';
export { renderCallStack } from './components/callstack.js';
export { renderStack } from './components/stack.js';
export { renderBTree } from './components/btree.js';
export { renderProcessState } from './components/processstate.js';
export { renderDeadlockGraph } from './components/deadlockgraph.js';
export { renderGanttChart } from './components/ganttchart.js';
export { renderCacheHierarchy } from './components/cachehierarchy.js';
export { renderMemoryLayout } from './components/memorylayout.js';
export { renderMemoryBlock } from './components/memoryblock.js';
export { renderMemoryMap } from './components/memorymap.js';
export { renderConfusionMatrix } from './components/confusionmatrix.js';
export { renderMatrix } from './components/matrix.js';
export { renderNeuralNetwork } from './components/neuralnetwork.js';
export { renderPacket } from './components/packet.js';
export { renderPieChart } from './components/piechart.js';
export { renderPipelineStage } from './components/pipelinestage.js';
export { renderPod } from './components/pod.js';
export { renderProcess } from './components/process.js';
export { renderRecursionTree } from './components/recursiontree.js';
export { renderScatterPlot } from './components/scatterplot.js';
export { renderSemaphore } from './components/semaphore.js';
export { renderSubnet } from './components/subnet.js';
export { renderTuringMachine } from './components/turingmachine.js';
export { renderCPU } from './components/cpu.js';

// ── Generic component factory (for extending)
export { createGenericRenderer } from './components/generic.js';
