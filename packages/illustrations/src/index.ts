/**
 * @pre/illustrations — Public API
 *
 * Re-exports all utilities, components, and the registry
 * for use by @pre/player and @pre/compiler.
 */

// ── Core utilities
export { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from './utils.js';

// ── Design tokens & visual utilities
export {
  COLORS,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
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
export { renderArrow, renderDataFlow, resolveEntityRef } from './components/arrow.js';
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
export { renderArray } from './components/array.js';
export { renderLinkedList } from './components/linkedlist.js';
export { renderBinaryTree } from './components/binarytree.js';

// ── Generic component factory (for extending)
export { createGenericRenderer } from './components/generic.js';
