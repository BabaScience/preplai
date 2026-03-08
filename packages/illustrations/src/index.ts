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
export { renderCodeBlock } from './components/codeblock.js';
export { renderArrow, renderDataFlow } from './components/arrow.js';
export { resolveEntityRef } from '@preplai/shared';
export { renderGraph2D } from './components/graph2d.js';
export { renderContainer } from './components/container.js';
export { renderNetwork } from './components/network.js';
export { renderDevice } from './components/device.js';
export { renderCache } from './components/cache.js';
export { renderLoadBalancer } from './components/loadbalancer.js';
export { renderLambda } from './components/lambda.js';
export { renderPipeline } from './components/pipeline.js';
export { renderGroup } from './components/group.js';
export { renderMetric } from './components/metric.js';
export { renderBadge } from './components/badge.js';
export { renderTimeline } from './components/timeline.js';
export { renderStepList } from './components/steplist.js';
export { renderDefinition } from './components/definition.js';
export { renderCallout } from './components/callout.js';
export { renderAnalogy } from './components/analogy.js';
export { renderAnnotation } from './components/annotation.js';
export { createTextCardRenderer } from './components/text-card.js';
export { renderArray } from './components/array.js';
export { renderLinkedList } from './components/linkedlist.js';
export { renderBinaryTree } from './components/binarytree.js';
export { renderHashTable } from './components/hashtable.js';
export { renderQueue } from './components/queue.js';
export { renderDecorator } from './components/decorator.js';
export { renderDNSResolver } from './components/dnsresolver.js';
export { renderVolume } from './components/volume.js';
export { renderTmpfs } from './components/tmpfs.js';
export { renderList } from './components/list.js';
export { renderTuple } from './components/tuple.js';
export { renderSet } from './components/set.js';
export { renderDockerImage } from './components/dockerimage.js';
export { renderDockerRegistry } from './components/dockerregistry.js';
export { renderCallStack } from './components/callstack.js';
export { renderStack } from './components/stack.js';
export { renderBTree } from './components/btree.js';
export { renderProcessState } from './components/processstate.js';
export { renderGanttChart } from './components/ganttchart.js';
export { renderCacheHierarchy } from './components/cachehierarchy.js';
export { renderMemoryLayout } from './components/memorylayout.js';
export { renderConfusionMatrix } from './components/confusionmatrix.js';
export { renderCPU } from './components/cpu.js';

// ── Generic component factory (for extending)
export { createGenericRenderer } from './components/generic.js';
