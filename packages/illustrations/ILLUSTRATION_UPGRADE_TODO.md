# Illustration Upgrade TODO — 5 Cinematic Pillars

> Track progress upgrading every SVG entity to cinema-quality with all 5 pillars.
> Workflow: Design in Pencil (both themes) → Founder approval → Implement in TS → Build & verify.
> Reference: `ILLUSTRATION_UPGRADE_GUIDE.md`

---

## Legend

- `[ ]` Not started
- `[D]` Designed in Pencil (awaiting approval)
- `[A]` Approved by Founder
- `[x]` Implemented, built, verified

---

## Batch 1 — Core Infrastructure (DONE)

| # | Entity | File | Status | Notes |
|---|--------|------|--------|-------|
| 1 | User | `user.ts` | [x] | Badge card, float + status dot pulse + accent shimmer |
| 2 | Cloud | `cloud.ts` | [x] | Volumetric bumps, drift + node twinkle scale |
| 3 | LoadBalancer | `loadbalancer.ts` | [x] | Diamond prism, pulse ring + center glow + entry breathe |
| 4 | Server | `server.ts` | [x] | Rack bars, LED staggered blink + body float |
| 5 | Cache | `cache.ts` | [x] | Cylinder + bolt, cap breathe scale + float |
| 6 | Database | `database.ts` | [x] | Cylinder, staggered dot pulse scale + float |
| 7 | Container | `container.ts` | [x] | Dashed rect, border stroke breathe + float |
| 8 | Queue | `queue.ts` | [x] | Multi-cell, flow shimmer translateX + float |
| 9 | Service | `service.ts` | [x] | Hex + gear, gear spin 6s + body glow |
| 10 | APIEndpoint | `api-endpoint.ts` | [x] | Wide rect, cursor blink + float |

---

## Batch 2 — Extended Infrastructure (DONE)

| # | Entity | File | Shape | Status | Animation Notes |
|---|--------|------|-------|--------|-----------------|
| 11 | Firewall | `firewall.ts` | Shield path | [x] | Flame scale pulse 1→1.4 + body float + dot pulse |
| 12 | Lambda | `lambda.ts` | Rounded rect | [x] | λ breathe scale 1→1.1 + float + exec dot pulse |
| 13 | Network | `network.ts` | Circle hub+spoke | [x] | Node twinkle scale 1→1.5 staggered + hub glow + float |
| 14 | Pod | `pod.ts` | Rounded rect + grid | [x] | Status dots scale pulse + cell shimmer + float |
| 15 | Process | `process.ts` | Circle + arrow | [x] | Arrow pulse scale 1→1.08 + float + dot pulse |
| 16 | Device | `device.ts` | Monitor+stand+base | [x] | Power LED blink + scan line shimmer + float |
| 17 | Monitor | `monitor.ts` | Screen + heartbeat | [x] | Heartbeat shimmer + metric dots pulse + float |
| 18 | CDN | `cdn.ts` | Globe + edge nodes | [x] | Edge twinkle scale 1→1.4 + drift/scale + float |
| 19 | APIGateway | `api-gateway.ts` | Rect + fan-out | [x] | Fan-out dots pulse + GW badge breathe + float |
| 20 | Subnet | `subnet.ts` | Dashed boundary | [x] | Bus dots pulse + host shimmer + float |

---

## Batch 3 — DevOps & CI/CD (DONE)

| # | Entity | File | Shape | Status | Animation Notes |
|---|--------|------|-------|--------|-----------------|
| 21 | Pipeline | `pipeline.ts` | 3 stage rects + arrows | [x] | Stage shimmer translateX + arrow scale pulse + float |
| 22 | Build | `build.ts` | Rect + gear + bars | [x] | Gear spin 6s + progress bar scaleX pulse + float |
| 23 | Deployment | `deployment.ts` | Rect + upward arrow | [x] | Arrow translateY pulse + dot scale + float |
| 24 | Rollback | `rollback.ts` | Rect + undo arc | [x] | Arc rotate pulse + dot scale + float |
| 25 | GitBranch | `git-branch.ts` | Trunk + branch lines | [x] | Node twinkle scale 1→1.4 staggered + branch pulse + float |
| 26 | GitCommit | `git-commit.ts` | Timeline + 3 dots | [x] | Commit dots scale twinkle staggered + float |
| 27 | PullRequest | `pull-request.ts` | Merge lines + nodes | [x] | Merge arrow shimmer + node scale pulse + float |
| 28 | CronJob | `cron-job.ts` | Clock face + hands | [x] | Minute hand rotate 8s + center dot pulse + float |
| 29 | DockerImage | `dockerimage.ts` | 3 stacked layers | [x] | Layer shimmer staggered + tag breathe + float |
| 30 | DockerRegistry | `dockerregistry.ts` | Registry + grid | [x] | Thumbnail shimmer staggered + dot scale + float |

---

## Batch 4 — Auth, Security & Messaging (DONE)

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 31 | AuthFlow | `auth-flow.ts` | Flow card | [x] | Lock pulse, key shimmer |
| 32 | Token | `token.ts` | Badge/pill | [x] | Token glow, float |
| 33 | Certificate | `certificate.ts` | Document rect | [x] | Seal pulse, float |
| 34 | Secret | `secret.ts` | Lock rect | [x] | Lock breathe, dot mask |
| 35 | MessageBroker | `message-broker.ts` | Hub rect | [x] | Message flow, hub pulse |
| 36 | Event | `event.ts` | Lightning badge | [x] | Lightning flash, float |
| 37 | Stream | `stream.ts` | Flow rect | [x] | Stream flow translateX, float |
| 38 | Webhook | `webhook.ts` | Hook shape | [x] | Hook swing, float |
| 39 | WebSocket | `websocket.ts` | Bi-arrow rect | [x] | Bi-directional pulse, float |
| 40 | Notification | `notification.ts` | Bell/card | [x] | Bell swing, float |

---

## Batch 5 — Observability & Data (DONE)

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 41 | Dashboard | `dashboard.ts` | Screen rect | [x] | Chart line draw, float |
| 42 | LogEntry | `log-entry.ts` | Log line | [x] | Line scroll, float |
| 43 | Alert | `alert.ts` | Warning badge | [x] | Alert flash, scale pulse |
| 44 | Trace | `trace.ts` | Span lines | [x] | Span flow, float |
| 45 | Metric | `metric.ts` | Number card | [x] | Value pulse, float |
| 46 | Schema | `schema.ts` | Document rect | [x] | Field shimmer, float |
| 47 | Migration | `migration.ts` | Arrow rect | [x] | Arrow flow, float |
| 48 | DataLake | `data-lake.ts` | Lake shape | [x] | Water ripple, float |
| 49 | DataWarehouse | `data-warehouse.ts` | Warehouse rect | [x] | Shelf shimmer, float |
| 50 | StorageBucket | `storage-bucket.ts` | Bucket shape | [x] | Fill shimmer, float |

---

## Batch 6 — Software Architecture (DONE)

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 51 | Module | `module.ts` | Rect | [x] | Border pulse, float |
| 52 | Interface | `interface.ts` | Rect | [x] | Connector dots pulse, float |
| 53 | ErrorState | `error-state.ts` | Warning rect | [x] | Error flash, float |
| 54 | ConfigFile | `config-file.ts` | Document rect | [x] | Line shimmer, float |
| 55 | Dependency | `dependency.ts` | Arrow rect | [x] | Arrow pulse, float |
| 56 | Decision | `decision.ts` | Diamond | [x] | Fork flow, center glow |
| 57 | CircuitBreaker | `circuit-breaker.ts` | Circle | [x] | Break flash, reconnect pulse |
| 58 | Sidecar | `sidecar.ts` | Side rect | [x] | Side attach pulse, float |
| 59 | RateLimiter | `rate-limiter.ts` | Gate rect | [x] | Gate tick, counter pulse |
| 60 | DeadLetterQueue | `dead-letter-queue.ts` | Striked rect | [x] | Warning pulse, float |

---

## Batch 7 — Data Structures (DONE)

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 61 | Array | `array.ts` | Cell grid | [x] | Cell highlight sweep, float |
| 62 | LinkedList | `linkedlist.ts` | Node chain | [x] | Arrow flow, node pulse |
| 63 | BinaryTree | `binarytree.ts` | Tree nodes | [x] | Level highlight, float |
| 64 | BTree | `btree.ts` | Tree nodes | [x] | Node glow, float |
| 65 | HashTable | `hashtable.ts` | Bucket grid | [x] | Hash scatter, bucket pulse |
| 66 | Heap | `heap.ts` | Tree shape | [x] | Bubble up/down, float |
| 67 | Stack | `stack.ts` | Stacked rects | [x] | Top element pulse, float |
| 68 | List | `list.ts` | Vertical cells | [x] | Item shimmer, float |
| 69 | Set | `set.ts` | Circle | [x] | Element pulse, float |
| 70 | Tuple | `tuple.ts` | Grouped cells | [x] | Cell highlight, float |

---

## Batch 8 — Algorithms & Theory

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 71 | ArrayCell | `arraycell.ts` | Single cell | [ ] | Highlight pulse |
| 72 | RecursionTree | `recursiontree.ts` | Tree | [ ] | Level expand, float |
| 73 | SortAnimation | `sortanimation.ts` | Bar chart | [ ] | Bar swap, float |
| 74 | FSM | `fsm.ts` | State circles | [ ] | State transition glow |
| 75 | CallStack | `callstack.ts` | Stacked frames | [ ] | Frame push/pop, float |
| 76 | SymbolTable | `symboltable.ts` | Table | [ ] | Row highlight, float |
| 77 | BigO | `bigo.ts` | Math card | [ ] | Curve draw, float |
| 78 | TuringMachine | `turingmachine.ts` | Tape + head | [ ] | Head move, tape scroll |
| 79 | Semaphore | `semaphore.ts` | Traffic light | [ ] | Light switch, float |
| 80 | Mutex | `mutex.ts` | Lock shape | [ ] | Lock toggle, float |

---

## Batch 9 — Computer Architecture

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 81 | CPU | `cpu.ts` | Chip rect | [ ] | Pin pulse, core glow |
| 82 | GPU | `gpu.ts` | Wide chip | [ ] | Core grid pulse, float |
| 83 | MemoryBlock | `memoryblock.ts` | Block rect | [ ] | Bit shimmer, float |
| 84 | MemoryLayout | `memorylayout.ts` | Segmented rect | [ ] | Segment highlight, float |
| 85 | MemoryMap | `memorymap.ts` | Map rect | [ ] | Region pulse, float |
| 86 | LogicGate | `logicgate.ts` | Gate shape | [ ] | Signal flow, output flash |
| 87 | ProcessState | `processstate.ts` | State circle | [ ] | State transition glow |
| 88 | Thread | `thread.ts` | Threaded line | [ ] | Thread flow, pulse |
| 89 | DeadlockGraph | `deadlockgraph.ts` | Circle graph | [ ] | Cycle highlight, float |
| 90 | Packet | `packet.ts` | Packet rect | [ ] | Packet flow, float |

---

## Batch 10 — Charts & Visualization

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 91 | BarChart | `barchart.ts` | Bar chart | [ ] | Bar grow, float |
| 92 | PieChart | `piechart.ts` | Pie circle | [ ] | Slice pulse, float |
| 93 | Histogram | `histogram.ts` | Bar chart | [ ] | Bar shimmer, float |
| 94 | ScatterPlot | `scatterplot.ts` | Dot plot | [ ] | Dot pulse, float |
| 95 | Graph2D | `graph2d.ts` | XY graph | [ ] | Line draw, float |
| 96 | CoordinateSystem | `coordinatesystem.ts` | Axes | [ ] | Grid shimmer, float |
| 97 | VennDiagram | `venndiagram.ts` | Overlapping circles | [ ] | Circle breathe, float |
| 98 | GanttChart | `ganttchart.ts` | Timeline bars | [ ] | Bar fill, float |
| 99 | Timeline | `timeline.ts` | Horizontal line | [ ] | Point pulse, float |
| 100 | FlowDiagram | `flowdiagram.ts` | Multi-node | [ ] | Flow highlight, float |

---

## Batch 11 — Diagrams & Architecture Patterns

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 101 | SequenceDiagram | `sequence-diagram.ts` | Lifeline | [ ] | Message arrow flow |
| 102 | EREntity | `er-entity.ts` | Table rect | [ ] | Field highlight, float |
| 103 | ClassNode | `class-node.ts` | UML rect | [ ] | Section pulse, float |
| 104 | ComponentNode | `component-node.ts` | Component | [ ] | Port pulse, float |
| 105 | SystemBoundary | `system-boundary.ts` | Boundary rect | [ ] | Border dash flow, float |
| 106 | MindMapNode | `mindmap-node.ts` | Organic node | [ ] | Branch grow, float |
| 107 | UserJourneyStep | `user-journey-step.ts` | Step card | [ ] | Step highlight, float |
| 108 | DeploymentStrategy | `deployment-strategy.ts` | Strategy card | [ ] | Phase pulse, float |
| 109 | SagaStep | `saga-step.ts` | Step card | [ ] | Step glow, float |
| 110 | NeuralNetwork | `neuralnetwork.ts` | Layer grid | [ ] | Neuron pulse, signal flow |

---

## Batch 12 — Text, Layout & Simple Entities

> These may need lighter treatment (just float + 1-2 pillars) since they're primarily text-based.

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 111 | Concept | `concept.ts` | Rounded rect | [ ] | Glow breathe, float |
| 112 | Entity | `entity.ts` | Generic rect | [ ] | Border pulse, float |
| 113 | Badge | `badge.ts` | Pill shape | [ ] | Badge glow, float |
| 114 | Quote | `quote.ts` | Quote card | [ ] | Quote mark pulse, float |
| 115 | Definition | `definition.ts` | Card rect | [ ] | Term highlight, float |
| 116 | Callout | `callout.ts` | Callout card | [ ] | Icon pulse, float |
| 117 | Analogy | `analogy.ts` | Split card | [ ] | Arrow pulse, float |
| 118 | Comparison | `comparison.ts` | Split card | [ ] | Column shimmer, float |
| 119 | StepList | `steplist.ts` | Numbered list | [ ] | Step reveal, float |
| 120 | CodeBlock | `codeblock.ts` | Code card | [ ] | Cursor blink, float |

---

## Batch 13 — Remaining Entities

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 121 | Table | `table.ts` | Table grid | [ ] | Row highlight, float |
| 122 | Annotation | `annotation.ts` | Annotation | [ ] | Pointer pulse, float |
| 123 | Cycle | `cycle.ts` | Circle | [ ] | Arrow rotate, float |
| 124 | HTTPRequest | `http-request.ts` | Request card | [ ] | Status pulse, float |
| 125 | GraphQLSchema | `graphql-schema.ts` | Schema card | [ ] | Field shimmer, float |
| 126 | Decorator | `decorator.ts` | Wrapper rect | [ ] | Border pulse, float |
| 127 | DNSResolver | `dnsresolver.ts` | Lookup rect | [ ] | Query flow, float |
| 128 | FeatureStore | `feature-store.ts` | Store rect | [ ] | Feature pulse, float |
| 129 | MLModel | `ml-model.ts` | Brain/rect | [ ] | Neuron glow, float |
| 130 | Bundle | `bundle.ts` | Package rect | [ ] | Wrap shimmer, float |

---

## Batch 14 — Physics, Math & Science

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 131 | Equation | `equation.ts` | Math card | [ ] | Term highlight, float |
| 132 | Expression | `expression.ts` | Math inline | [ ] | Cursor blink, float |
| 133 | Matrix | `matrix.ts` | Grid | [ ] | Cell shimmer, float |
| 134 | Vector | `vector.ts` | Arrow line | [ ] | Arrow pulse, float |
| 135 | Wave | `wave.ts` | Sine wave | [ ] | Wave animate, float |
| 136 | FreeBodyDiagram | `freebodydiagram.ts` | Force arrows | [ ] | Force pulse, float |
| 137 | ConfusionMatrix | `confusionmatrix.ts` | Grid | [ ] | Cell highlight, float |
| 138 | CacheHierarchy | `cachehierarchy.ts` | Nested rects | [ ] | Level pulse, float |
| 139 | PipelineStage | `pipelinestage.ts` | Stage rect | [ ] | Stage fill, float |
| 140 | Dict | — (mapped to HashTable) | — | [ ] | — |

---

## Batch 15 — Compositional & Utility Illustrations

> These were previously marked "Skippable" but are now included in the upgrade plan.
> Composable is the highest-impact target — it powers all fallback/generic entity rendering.
> Arrow connectors get lighter treatment (glow + flow animation, 2-3 pillars).
> Text components get card-level treatment (subtle lighting + float).

| # | Entity | File | Shape | Status | Animation Ideas |
|---|--------|------|-------|--------|-----------------|
| 141 | Arrow/BidirectArrow/DottedArrow | `arrow.ts` | Connection lines | [ ] | Glow flow, pulse, directional shimmer |
| 142 | DataFlow/Bus | `arrow.ts` | Flow connectors | [ ] | Data dot flow, glow pulse |
| 143 | Composable (15 shapes + 100+ icons) | `composable.ts` | Generic shapes | [ ] | Shape-adaptive lighting, icon glow, float |
| 144 | ComposableShapes | `composable-shapes.ts` | Shape primitives | [ ] | Shared lighting + shadow primitives |
| 145 | Group | `group.ts` | Layout container | [ ] | Subtle border glow, ambient float |
| 146 | Heading (H1/H2/H3) | `heading.ts` | Text headings | [ ] | Text glow, subtle float |
| 147 | Text/Span/Label | `text.ts` | Body text | [ ] | Subtle ambient glow |
| 148 | TextCard | `text-card.ts` | Text card | [ ] | Card lighting, float |
| 149 | Generic | `generic.ts` | Fallback rect | [ ] | Border pulse, float |
| 150 | Volume | `volume.ts` | Volume shape | [ ] | Volume glow, float |
| 151 | Task | `task.ts` | Task item | [ ] | Checkbox pulse, float |
| 152 | File | `file.ts` | Document shape | [ ] | Corner fold shimmer, float |

### Truly Non-Visual (No upgrade needed)

| Entity | File | Reason |
|--------|------|--------|
| IconPaths | `icon-paths.ts` | SVG path data, not a renderer |
| SemanticResolver | `semantic-resolver.ts` | Type mapping logic, no visual output |
| CardTypes | `card-types.ts` | Type definitions only |
| SmartLabel | `smart-label.ts` | Text measurement utility |

---

## Progress Summary

| Batch | Name | Count | Done | Remaining | Phase |
|-------|------|-------|------|-----------|-------|
| 1 | Core Infrastructure | 10 | 10 | 0 | Implemented |
| 2 | Extended Infrastructure | 10 | 10 | 0 | Implemented |
| 3 | DevOps & CI/CD | 10 | 10 | 0 | Implemented |
| 4 | Auth, Security & Messaging | 10 | 10 | 0 | Implemented |
| 5 | Observability & Data | 10 | 10 | 0 | Implemented |
| 6 | Software Architecture | 10 | 10 | 0 | Implemented |
| 7 | Data Structures | 10 | 10 | 0 | Implemented |
| 8 | Algorithms & Theory | 10 | 0 | 10 | Designed in Pencil + contrast boosted |
| 9 | Computer Architecture | 10 | 0 | 10 | Designed in Pencil + contrast boosting |
| 10 | Charts & Visualization | 10 | 0 | 10 | Designed in Pencil + contrast boosted |
| 11 | Diagrams & Patterns | 10 | 0 | 10 | Designed in Pencil + contrast boosted |
| 12 | Text, Layout & Simple | 10 | 0 | 10 | Designed in Pencil, contrast pending |
| 13 | Remaining Entities | 10 | 0 | 10 | Designing in Pencil |
| 14 | Physics, Math & Science | 10 | 0 | 10 | Designed in Pencil + contrast boosted |
| 15 | Compositional & Utility | 12 | 0 | 12 | Not started |
| — | Non-visual (skip) | 4 | — | — | N/A |
| **Total** | | **~166** | **70** | **~82** | |
