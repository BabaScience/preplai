# Illustration Roadmap — Software Engineering Coverage

> Based on research of what engineers actually visualize (C4 model adoption at 79%, sequence diagrams at 81% usage, ER diagrams as core DB design tool, etc.)

## Current State: 119 entity types

## Phase 1 — Core Architecture Diagrams (Highest Impact)

These are drawn by virtually every software engineer. No workaround exists today.

| Type | Visual | Metadata | Priority |
|------|--------|----------|----------|
| **SequenceDiagram** | Vertical lifelines with activation bars, horizontal message arrows between them | `participants: [{name, type?}], messages: [{from, to, label, type?: "sync"\|"async"\|"reply"}]` | Critical |
| **EREntity** | Multi-compartment rectangle: entity name (header) + attribute list with types and keys | `tableName, columns: [{name, type, key?: "PK"\|"FK"\|"UK"}]` | Critical |
| **ClassNode** | Three-compartment rectangle: class name / attributes / methods with visibility (+/-/#) | `className, attributes: [{visibility, name, type}], methods: [{visibility, name, params, returnType}]` | Critical |
| **SystemBoundary** | Large dashed rectangle with label, contains other entities visually | `label, style?: "dashed"\|"solid", description?` | Critical |
| **CircuitBreaker** | Inline switch icon with 3 states (Closed/Open/Half-Open) on a connection | `state: "closed"\|"open"\|"half-open", failureRate?, threshold?` | High |

## Phase 2 — Domain-Specific (Frontend, ML, Data)

Frequently needed by specific engineering domains.

| Type | Visual | Metadata |
|------|--------|----------|
| **ComponentNode** | Angle bracket icon `</>` with component name, shows props | `framework?: "react"\|"vue"\|"angular", props?: string[]` |
| **DataLake** | Wide, shallow cylinder (lake shape) with raw/unstructured indicator | `provider?: "S3"\|"GCS"\|"ADLS", format?: "parquet"\|"json"\|"csv"` |
| **DataWarehouse** | Stacked cylinder or house-shaped icon with structured data indicator | `provider?: "Snowflake"\|"BigQuery"\|"Redshift"` |
| **MLModel** | Brain/model icon (simpler than NeuralNetwork) with version + accuracy | `framework?: "PyTorch"\|"TensorFlow", version?, accuracy?, status?: "training"\|"deployed"\|"archived"` |
| **FeatureStore** | Dual-port storage icon showing training + inference paths | `provider?: "Feast"\|"Hopsworks"\|"Tecton"` |
| **MindMapNode** | Central topic with radiating branches | `topic, branches: [{label, children?}]` |
| **UserJourneyStep** | Horizontal step with sentiment indicator (happy/neutral/sad) | `step, sentiment: 1-5, touchpoint?, channel?` |
| **DeploymentStrategy** | Parallel environment boxes with traffic router between them | `strategy: "blue-green"\|"canary"\|"rolling", trafficSplit?: number` |

## Phase 3 — Microservices & Messaging Patterns

Niche but visually distinctive. Cannot be well-represented by generic boxes.

| Type | Visual | Metadata |
|------|--------|----------|
| **Sidecar** | Small proxy box visually attached to a parent service | `proxy?: "Envoy"\|"Istio"\|"Linkerd", parentServiceId?` |
| **DeadLetterQueue** | Queue with skull/warning icon overlay | `messageCount?, retryPolicy?` |
| **RateLimiter** | Funnel or gauge icon showing throttling | `limit?, window?, algorithm?: "token-bucket"\|"sliding-window"` |
| **GPU** | Processor icon with parallel cores indicator | `model?: "A100"\|"H100"\|"T4", memory?` |
| **Bundle** | Package icon with size metric | `name?, size?, chunks?` |
| **SagaStep** | Numbered step in distributed transaction with compensating action | `step, action, compensation?` |

## Implementation Pattern

Each new component follows the standard checklist:
1. Create `packages/illustrations/src/components/<name>.ts`
2. Implement render function using `buildEntityGroup`, `applyEntranceAnimation`, design tokens
3. Add `ENTITY_COLORS` entry if new color category needed
4. Register in `registry.ts`
5. Export from `index.ts`
6. Add metadata defaults in `apps/website/src/pages/dev/entity-defaults.ts`
7. Add to shared types (VisualEntityType union + KNOWN_ENTITY_TYPES)
8. Add to compiler aliases if shorthand needed
9. Add metadata schema to METADATA_SCHEMAS.md
10. Build: `pnpm --filter @preplai/illustrations run build`

## Estimated Impact

- Phase 1: Covers 80%+ of architecture diagrams engineers draw
- Phase 2: Covers frontend, ML, data engineering, product design domains
- Phase 3: Covers advanced microservices and infrastructure patterns
- Total: ~19 new types, bringing us to ~138 entity types
