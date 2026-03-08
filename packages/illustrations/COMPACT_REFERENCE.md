# Compact Illustration Reference

**Agents:** Call `get_illustrations` for runtime data. This file is developer documentation.

Token-saving reference for agents. Use short keys and aliases when building `add_scene` visual_script. See [METADATA_SCHEMAS.md](./METADATA_SCHEMAS.md) for full details.

## Short Keys

| Level | Short | Full |
|-------|-------|------|
| Script | `f` | `frames` |
| Script | `td` | `totalDuration` |
| Script | `sid` | `sceneId` |
| Frame | `e` | `entities` |
| Frame | `n` | `narrationSegment` |
| Frame | `d` | `description` |
| Frame | `tr` | `transitions` |
| Entity | `p` | `position` |
| Entity | `m` | `metadata` |
| Entity | `l` | `label` |
| Entity | `c` | `color` |
| Entity | `src` | `sourceEntityId` |
| Entity | `tgt` | `targetEntityId` |
| Entity | `par` | `parentEntityId` |
| Entity | `a` | `animation` |
| Entity | `tc` | `textContent` |
| Entity | `hl` | `highlight` |

**Position shorthand:** `[50, 50]` instead of `{x: 50, y: 50}`

## Entity Type Aliases

| Alias | Type |
|-------|------|
| BT | BinaryTree |
| BTR | BTree |
| LL | LinkedList |
| HT | HashTable |
| ARR | Array |
| LST | List |
| TUP | Tuple |
| ST | Set |
| SVC | Service |
| GW | APIGateway |
| LB | LoadBalancer |
| DNS | DNSResolver |
| CB | CodeBlock |
| DF | Definition |
| H1 | H1 |
| H2 | H2 |
| H3 | H3 |
| SL | StepList |
| CST | CallStack |
| COORD | CoordinateSystem |
| G2 | Graph2D |
| G3 | Graph3D |
| GRP | Group |
| BC | BarChart |
| CM | ConfusionMatrix |
| CH | CacheHierarchy |
| ML | MemoryLayout |
| GC | GanttChart |
| PS | ProcessState |
| BIGO | BigO |
| CKT | Circuit |
| CYC | Cycle |
| PT | ParseTree |

## Metadata by Type

| Type | Alias | Metadata keys | Example |
|------|-------|---------------|---------|
| BinaryTree | BT | tree/nodes, disabledIndexes?, selectedIndexes? | `{nodes:[5,3,8], selectedIndexes:[1]}` |
| BTree | BTR | tree, branchingFactor? | `{tree:{value:"[10,20]", children:[]}}` |
| Array | ARR | values/cells, disabledIndexes?, selectedIndexes?, pointerLabels? | `{values:[5,12,42], pointerLabels:[{index:0,label:"low"},{index:1,label:"mid",showValue:true,highlight:true}]}` |
| CallStack | CST | frames | `{frames:[{name:"main()"}]}` |
| Stack | — | layers | `{layers:[{label:"App", sublabel:"HTTP"}]}` |
| StepList | SL | steps, currentStep?, checkmarks? | `{steps:["Parse","Validate"], currentStep:1}` |
| ProcessState | PS | states, transitions | `{states:[{name:"Ready"}], transitions:[{from:"Ready",to:"Running"}]}` |
| GanttChart | GC | tasks, maxTime? | `{tasks:[{name:"P1",start:0,end:3}]}` |
| BarChart | BC | bars, xLabel?, yLabel?, horizontal? | `{bars:[{label:"Jan",value:10}]}` |
| ConfusionMatrix | CM | matrix, rowLabels?, colLabels? | `{matrix:[[45,5],[8,42]]}` |
| Graph2D | G2 | domain, range, points, expression?, curveType? | `{expression:"x*x", domain:[-5,5]}` |
| CoordinateSystem | COORD | points, vectors, xRange?, yRange? | `{vectors:[{dx:3,dy:2}]}` |
| BigO | BIGO | curves?, domain? | `{curves:["O(n)","O(n²)"]}` |
| CodeBlock | CB | code or lines | `{code:"function f(){}\n"}` |
| Circuit | CKT | components, connections | `{components:[{type:"battery"}], connections:[{from:0,to:1}]}` |
| HashTable | HT | pairs | `{pairs:[["k1","v1"]]}` |
| CacheHierarchy | CH | levels | `{levels:[{name:"L1",size:"32KB"}]}` |
| MemoryLayout | ML | stack, heap | `{stack:["main"], heap:["obj"]}` |

## No Metadata (use entity fields only)

Server, Database, User, Cloud, Service, API, APIGateway, Cache, Concept, Cycle, DNSResolver, Label, H1, H2, H3, Arrow, DataFlow — use `id`, `type`, `position`, `label` (or `metadata.label`), `color`. Omit size — a single tuned default is used for all entities.
