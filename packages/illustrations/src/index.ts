/**
 * @pre/illustrations — Public API
 *
 * Re-exports all utilities, components, and the registry
 * for use by @pre/player and @pre/compiler.
 */

// ── Core utilities
export { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from './utils.js';

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

// ── Generic component factory (for extending)
export { createGenericRenderer } from './components/generic.js';
