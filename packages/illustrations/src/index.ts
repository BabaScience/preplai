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
  getEntityDimensions,
  VISIBILITY_BASE,
  SIZE_CLAMP_MIN,
  SIZE_CLAMP_MAX,
} from './utils.js';
export type { EntityDimensions } from './utils.js';

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
  PALETTES,
  PALETTES_LIGHT,
  PALETTES_CINEMA,
  setActivePalette,
  setActiveTheme,
  getActiveTheme,
  getActivePaletteName,
  getSemanticCategory,
  getParticleColors,
} from './design-tokens.js';
export type { PaletteName, Palette, SemanticCategory, EntityStatus, EntityEmphasis, ColorRamp, ColorStop } from './design-tokens.js';
export { STATUS_COLORS, EMPHASIS_SCALES, generateColorRamp, clearColorRampCache } from './design-tokens.js';

// ── Color cascade system
export { resolveColorCascade, resolveColorCascadeFromHex, applyShapeColors, applyTextColor, applyGlowColors } from './color-cascade.js';
export type { ColorCascade } from './color-cascade.js';

// ── Universal entity overlays
export { applyEntityOverlays, applyStatusOverlay, applyProgressRing, applyEmphasis, applyBadge } from './entity-overlays.js';
export type { BadgeConfig } from './entity-overlays.js';

// ── Lottie animation overlays
export { applyLottieOverlay, destroyLottieOverlay, destroyAllLottie, notifyLottieFocus, setLottieSpeed, getActiveLottieIds } from './lottie-overlay.js';
export type { LottieAnimationConfig } from './lottie-overlay.js';
export {
  createLinearGradient,
  createRadialGradient,
  createDarkGradient,
  ensureDefs,
  ensureDropShadowFilter,
  ensureGlassFilter,
} from './visual-utils.js';

// ── Bounding box registry (for arrow edge routing)
export { getEntityBounds } from './bounds-registry.js';
export type { EntityBounds } from './bounds-registry.js';

// ── Registry & dispatcher
export { registry, renderEntity } from './registry.js';

// ── Fully implemented components (direct access)
export { renderServer } from './components/server.js';
export { renderDatabase } from './components/database.js';
export { renderUser } from './components/user.js';
export { renderCloud } from './components/cloud.js';
export { renderConcept } from './components/concept.js';
export { renderDecision } from './components/decision.js';
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
export { renderText, renderSpan } from './components/text.js';
export { renderSmartLabel } from './components/smart-label.js';
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
export { renderLogicGate } from './components/logicgate.js';
export { renderMutex } from './components/mutex.js';
export { renderSymbolTable } from './components/symboltable.js';

// ── Software Architecture: API & Web
export { renderAPIEndpoint } from './components/api-endpoint.js';
export { renderHTTPRequest, renderHTTPResponse } from './components/http-request.js';
export { renderWebSocket } from './components/websocket.js';
export { renderGraphQLSchema } from './components/graphql-schema.js';
export { renderWebhook } from './components/webhook.js';

// ── Software Architecture: Auth & Security
export { renderAuthFlow } from './components/auth-flow.js';
export { renderToken } from './components/token.js';
export { renderCertificate } from './components/certificate.js';
export { renderSecret } from './components/secret.js';

// ── Software Architecture: Data & Messaging
export { renderSchema } from './components/schema.js';
export { renderMigration } from './components/migration.js';
export { renderEvent } from './components/event.js';
export { renderStream } from './components/stream.js';

// ── Software Architecture: CI/CD & DevOps
export { renderGitBranch } from './components/git-branch.js';
export { renderGitCommit } from './components/git-commit.js';
export { renderPullRequest } from './components/pull-request.js';
export { renderBuild } from './components/build.js';
export { renderDeployment } from './components/deployment.js';
export { renderRollback } from './components/rollback.js';

// ── Software Architecture: Cloud Infrastructure
export { renderCDN } from './components/cdn.js';
export { renderStorageBucket } from './components/storage-bucket.js';
export { renderAPIGateway } from './components/api-gateway.js';
export { renderMessageBroker } from './components/message-broker.js';

// ── Software Architecture: Observability
export { renderLogEntry } from './components/log-entry.js';
export { renderAlert } from './components/alert.js';
export { renderTrace } from './components/trace.js';
export { renderDashboard } from './components/dashboard.js';

// ── Software Architecture: Code & Architecture
export { renderModule } from './components/module.js';
export { renderInterface } from './components/interface.js';
export { renderErrorState } from './components/error-state.js';
export { renderConfigFile } from './components/config-file.js';
export { renderDependency } from './components/dependency.js';
export { renderCronJob } from './components/cron-job.js';

// ── Software Architecture: Collaboration
export { renderNotification } from './components/notification.js';
export { renderTask } from './components/task.js';
export { renderFile } from './components/file.js';

// ── Phase 1: Core Architecture Diagrams
export { renderSequenceDiagram } from './components/sequence-diagram.js';
export { renderEREntity } from './components/er-entity.js';
export { renderClassNode } from './components/class-node.js';
export { renderSystemBoundary } from './components/system-boundary.js';
export { renderCircuitBreaker } from './components/circuit-breaker.js';

// ── Phase 2: Domain-Specific
export { renderComponentNode } from './components/component-node.js';
export { renderDataLake } from './components/data-lake.js';
export { renderDataWarehouse } from './components/data-warehouse.js';
export { renderMLModel } from './components/ml-model.js';
export { renderFeatureStore } from './components/feature-store.js';
export { renderMindMapNode } from './components/mindmap-node.js';
export { renderUserJourneyStep } from './components/user-journey-step.js';
export { renderDeploymentStrategy } from './components/deployment-strategy.js';

// ── Phase 3: Microservices & Patterns
export { renderSidecar } from './components/sidecar.js';
export { renderDeadLetterQueue } from './components/dead-letter-queue.js';
export { renderRateLimiter } from './components/rate-limiter.js';
export { renderGPU } from './components/gpu.js';
export { renderBundle } from './components/bundle.js';
export { renderSagaStep } from './components/saga-step.js';

// ── Composable (Tier 2: Shape + Icon composition)
export { renderComposable } from './components/composable.js';
export { renderShape, COMPOSABLE_SHAPES } from './components/composable-shapes.js';
export type { ComposableShape } from './components/composable-shapes.js';
export { ICON_PATHS, ICON_CATEGORIES, ICON_NAMES } from './components/icon-paths.js';
export { resolveSemanticType } from './components/semantic-resolver.js';
export type { SemanticHint } from './components/semantic-resolver.js';

// ── Generic component factory (for extending)
export { createGenericRenderer } from './components/generic.js';
