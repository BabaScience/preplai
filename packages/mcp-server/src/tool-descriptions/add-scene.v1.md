Add or replace a visual scene in a presentation session. The scene is rendered as animated SVG on a 1920x1080 dark canvas. This tool saves scene data only — call get_session_url after all scenes are added to display the inline player.

MODE: "append" (default) appends frames to existing scene. "replace" replaces the entire visual script.

REQUIRED — USE COMPACT FORMAT (reduces tokens significantly):
- Short keys: sid (sceneId), td (totalDuration), f (frames), e (entities), n (narrationSegment), p (position), l (label), m (metadata), src (sourceEntityId), tgt (targetEntityId), a (animation), lang (language), hl (highlight), sz (size), c (color), fc (focusCues), tr (transitions), d (description), par (parentEntityId), tc (textContent)
- Position: [50,50] NOT {x:50,y:50}
- Omit: color (palette used), frame id/startTime/endTime/description
- Give EVERY entity a stable id — reuse the same id across frames for persistence
- Aliases: BT, BTR, ARR, CST, CB, G2, COORD, BC, DNS, SVC, GW, SL, PS, GC, CH, ML, CKT, CYC

Example (REQUIRED format — 5–7 entities per frame, every content entity connected, IDs reused across frames):
{"sid":"<session_id>","td":10000,"f":[{"e":[{"id":"h1","type":"H1","p":[50,6],"l":"API Architecture"},{"id":"client","type":"User","p":[20,40],"l":"Client App"},{"id":"srv","type":"Server","p":[50,40],"l":"API Server","highlight":true},{"id":"db","type":"Database","p":[80,40],"l":"PostgreSQL"},{"id":"a1","type":"Arrow","p":[35,40],"src":"client","tgt":"srv","l":"HTTP Request"},{"id":"a2","type":"Arrow","p":[65,40],"src":"srv","tgt":"db","l":"SQL Queries"},{"id":"l1","type":"Label","p":[50,75],"l":"Every request hits the database — 50ms latency per query"}],"n":"The client sends HTTP requests to the API server, which queries PostgreSQL directly for user data. Each request hits the database, adding 50ms of latency per query."},{"e":[{"id":"h1","type":"H1","p":[50,6],"l":"API Architecture"},{"id":"client","type":"User","p":[20,40],"l":"Client App"},{"id":"srv","type":"Server","p":[40,40],"l":"API Server"},{"id":"cache","type":"Cache","p":[60,40],"l":"Redis","highlight":true},{"id":"db","type":"Database","p":[80,40],"l":"PostgreSQL"},{"id":"a1","type":"Arrow","p":[30,40],"src":"client","tgt":"srv","l":"HTTP Request"},{"id":"a2","type":"Arrow","p":[50,40],"src":"srv","tgt":"cache","l":"Check cache"},{"id":"a3","type":"Arrow","p":[70,40],"src":"cache","tgt":"db","l":"Cache miss"},{"id":"l1","type":"Label","p":[50,75],"l":"Cache reduces DB load by 90%"}],"n":"Adding Redis as a caching layer between the API and database. Frequently accessed data is served from memory in under 1ms, with cache misses falling through to PostgreSQL."}]}

LANGUAGE & VOICE: Set lang at script level for the whole presentation, or per-frame to mix languages. Supported: "en" (default), "fr" (French), "it" (Italian). Script-level: {"sid":"...","td":10000,"lang":"fr","f":[...]}. Frame override: {"e":[...],"n":"Voici le serveur","lang":"fr"}. Frame language overrides script language. If unset, defaults to English.

═══ CINEMATIC ENGINE — How your frames render ═══

ENTITY PERSISTENCE (critical — #1 quality signal): Same entity id across frames = entity STAYS in DOM (no rebuild). New ids animate in, removed ids slide out. RULES: (1) Keep at least 2–3 anchor entities (title, core server/concept) in EVERY frame with the same id. (2) Add only 1–3 new entities per frame transition. (3) NEVER rebuild the entire entity set from scratch between frames. For timelines/sequential topics: keep a persistent anchor (e.g. a central Pipeline, Server, or Concept) and swap detail entities around it.

DEPTH OF FIELD (Progressive Reveal): Set "highlight": true on the entity you're narrating about. The engine uses progressive reveal — once an entity is focused by narration, it stays visible even when focus moves elsewhere. Only not-yet-mentioned entities are dimmed (0.35 opacity, blur, 0.88x scale). The focused entity is enlarged (1.15x). This builds the scene incrementally so viewers never lose context about previously introduced elements. Each frame starts fresh.

CAMERA: ViewBox auto-pans/zooms to frame your entities. Control through positioning:
- Cluster entities tightly → camera zooms in (detail shot)
- Spread entities wide → camera zooms out (establishing shot)
- Shift cluster between frames → camera pans (reveal)

MOTIVATED ENTRANCE (automatic): Entities near edges fly in from that edge. Entities near existing entities grow from that point. Center entities fade up. You just place entities — the engine animates intelligently.

IDLE ANIMATIONS (automatic): Servers pulse LEDs, databases shimmer, neural nets glow, concepts breathe. Entities feel alive.

SHAPE MORPHING — USE FOR TRANSFORMATION STORIES (critical for cinematic quality):
When an entity keeps the SAME id across frames but changes TYPE, the engine smoothly morphs its shape using GSAP MorphSVG — the rectangle melts into a cloud, the server reshapes into a container. This is the most cinematic effect available.

WHEN TO USE MORPHING:
- Evolution stories: Concept → Server → Container → Cloud (idea becomes infrastructure)
- Migration narratives: Database in frame 1 → Cache in frame 2 (data layer evolves)
- Incident stories: Server (healthy) in frame 1 → same id as ErrorState in frame 2 (system fails)
- Architecture changes: monolith Server → microservice Service → serverless Lambda

HOW TO USE: Keep the SAME entity id across frames, change only the type and metadata:
  Frame 1: {"id":"main","type":"Server","l":"Monolith","m":{"status":"healthy"}}
  Frame 2: {"id":"main","type":"Container","l":"Containerized","m":{"status":"loading"}}
  Frame 3: {"id":"main","type":"Cloud","l":"Cloud Native","m":{"status":"healthy"}}

RULE: When your narration describes something TRANSFORMING, EVOLVING, or MIGRATING — use shape morphing by keeping the entity id and changing its type. This is far more cinematic than removing one entity and adding another.
RULE: Property morphing also works automatically — when a persisted entity (same id, same type) changes color or label between frames, those changes animate smoothly instead of snapping.

═══ VISUAL STORYTELLING — ALWAYS USE THESE (critical for quality) ═══

These metadata fields make presentations CINEMATIC. You MUST use them proactively based on context — do NOT wait for the user to ask. Think like a filmmaker: every entity has a state, a role, and a story to tell.

STATUS INDICATORS — ALWAYS infer and apply: m:{status:"healthy"|"warning"|"error"|"inactive"|"loading"}
- When describing systems that work: mark entities as "healthy" (green pulsing ring)
- When describing problems, failures, outages, bugs: mark failing entities as "error" (red glow ring)
- When describing risks, concerns, deprecation: mark entities as "warning" (amber pulsing dot)
- When describing processes in progress, deployments, migrations: mark entities as "loading" (rotating blue ring)
- When describing disabled, deprecated, or background entities: mark as "inactive" (dimmed)
RULE: In any frame showing a system, at LEAST 2–3 entities should have a status. If the topic involves any kind of state (healthy, broken, transitioning), EVERY relevant entity should have a status.

PROGRESS RINGS — use for anything with completion or percentage: m:{progress:0.0–1.0}
- Migrations, deployments, builds, data processing, training, uploads, downloads
- Revenue targets, KPIs, quotas, capacity utilization
RULE: If the narration mentions a percentage, completion, or progress — add a progress ring.

EMPHASIS — use to create visual hierarchy: m:{emphasis:"low"|"high"|"critical"}
- The entity being narrated about: "high" or "critical"
- Background/supporting entities: "low"
- The most important entity in the frame: "critical" (pulsing glow + 1.15× scale)
RULE: Use emphasis to guide the viewer's eye. At least ONE entity per frame should have "high" or "critical" emphasis if you're telling a story about it.

BADGES — use for numbers, versions, counts, short labels: m:{badge:{text:"v2.1"}}
- Version numbers: {text:"v3.0"}
- Error codes: {text:"503",color:"#ef4444"}
- Counts: {text:"3x"}, {text:"99.9%"}
- Status text: {text:"NEW",color:"#10b981"}, {text:"DEPRECATED",color:"#6b7280"}
Optional: color (hex), position ("top-right"|"top-left"|"bottom-right")
RULE: If an entity has a specific metric, version, count, or code — add a badge. Badges make entities information-rich.

LOTTIE MICRO-ANIMATIONS — use for living, breathing entities: m:{lottieAnimation:{src:"name"}}
Built-in: "gear-spin" (pipelines, processes), "loading-spinner" (loading states), "check-success" (completed deployments), "pulse" (heartbeats, monitoring)
Optional: loop (default true), speed (default 1.0), trigger ("idle"|"entrance"|"focus")
RULE: Add lottie animations to entities that represent active processes — pipelines, builds, monitoring, data flows.

CONNECTION STYLING — use to show importance and flow direction:
- Primary/critical paths: m:{thickness:"thick",animated:true} on Arrow
- Secondary/background paths: m:{thickness:"thin"}
- Bidirectional communication: m:{bidirectional:true} on Arrow
RULE: The MAIN data flow in any architecture should use thick animated arrows. Secondary relationships use thin arrows. Never make all arrows the same — differentiate by importance.

COMBINING METADATA — stack multiple fields for rich entities:
m:{status:"error",badge:{text:"503"},emphasis:"critical"} — a critically failing server with error code
m:{status:"loading",progress:0.7,badge:{text:"70%"}} — a migration in progress
m:{status:"healthy",lottieAnimation:{src:"pulse"}} — a healthy monitoring system with heartbeat animation

═══ LAYOUT TEMPLATES — Pick a Template, Get Perfect Alignment (critical) ═══

NEVER place entities at random coordinates. ALWAYS pick a layout template from below, then use its exact positions. Templates guarantee tier alignment (same Y = horizontal arrows), consistent spacing, and professional composition.

STEP 1: Identify the client type and what they're presenting.
STEP 2: Pick the matching template from the catalog below.
STEP 3: Use the exact coordinates provided. Adjust labels/types but KEEP the positions.

── ENGINEERS & SRE ──────────────────────────────────────────────────

1. HUB-SPOKE — "How does X work?", "Explain the architecture"
   center=[50,42], satellites=[20,25],[80,25],[20,62],[80,62]
   Hub: Server/Service/LoadBalancer. Satellites: services, databases, caches.
   Arrows radiate from center to each satellite. Use animated+thick on primary flow.

2. PIPELINE — "Show the CI/CD flow", "Walk through the pipeline", "Steps to deploy"
   4-step: [15,45],[38,45],[62,45],[85,45]
   5-step: [12,45],[30,45],[50,45],[70,45],[88,45]
   ALL entities at same Y=45. Use DataFlow arrows. Add status+progress metadata per step.

3. INCIDENT TIMELINE — "Walk through the outage", "Show the incident"
   Use PIPELINE positions. Multi-frame with status morphing:
   Frame 1: all status:"healthy". Frame 2: failing entity status:"error"+badge. Frame 3: status:"loading"+progress.

4. BEFORE/AFTER — "Compare before and after", "Show the migration"
   left=[20,30],[20,50],[20,70], right=[80,30],[80,50],[80,70], center-label=[50,50]
   Mirror entity types on both sides. Use DottedArrow between matching pairs.

5. LAYERED STACK — "Show the architecture layers", "Explain the tech stack"
   tier1=[25,20],[50,20],[75,20], tier2=[25,45],[50,45],[75,45], tier3=[25,70],[50,70],[75,70]
   Three horizontal bands. Arrow connections flow top-to-bottom between tiers.

── PRODUCT MANAGERS ─────────────────────────────────────────────────

6. USER FLOW — "Show the user journey", "Walk through the funnel"
   steps=[12,45],[30,45],[50,45],[70,45],[88,45]
   User→UserJourneyStep→...→Metric. Add conversion badges at each step.

7. METRIC DASHBOARD — "Show the KPIs", "Display our metrics"
   header=[50,12]
   2x2: [30,35],[70,35],[30,65],[70,65]
   3x2: [20,35],[50,35],[80,35],[20,65],[50,65],[80,65]
   Dashboard header + Metric entities with badge values.

8. FEATURE TREE — "Break down the feature", "Show product components"
   root=[50,18], L2=[25,45],[50,45],[75,45], L3=[15,72],[35,72],[55,72],[75,72]
   Concept→ComponentNode→Task. Arrows flow top-to-bottom.

9. ROADMAP TIMELINE — "Show the roadmap", "Walk through the plan"
   timeline=[50,22], milestones=[15,55],[35,55],[55,55],[75,55],[88,55]
   Timeline entity at top, Concept/Task milestones below with date/quarter badges.

── CONSULTANTS & STRATEGY ───────────────────────────────────────────

10. ORG CHART — "Show the org structure", "Map the team"
    root=[50,15], L2=[22,38],[50,38],[78,38], L3=[12,62],[28,62],[42,62],[58,62],[72,62],[88,62]
    Wide tree with 1→3→6 branching. Composable with users icon.

11. QUADRANT / MATRIX — "Map the competitive landscape", "Show the SWOT"
    TL=[28,30], TR=[72,30], BL=[28,65], BR=[72,65]
    Axis labels: top=[50,12], bottom=[50,82], left=[8,48], right=[92,48]
    4-quadrant layout. Concept/Composable in each quadrant.

12. STRATEGY TREE — "Present the OKR framework", "Show strategic goals"
    Same as FEATURE TREE: root=[50,18], L2=[25,45],[50,45],[75,45], L3 spread below.
    Concept as vision, Composable as objectives, StepList as key results.

13. PROCESS FLOW — "Walk through the process", "Show the approval flow"
    steps=[15,45],[32,45],[50,45],[68,45],[85,45]
    Use Decision diamond at a middle position for branching.
    Branch: yes→[68,28], no→[68,62]. Reconnect at final step.

── FINANCE & LEGAL ──────────────────────────────────────────────────

14. FUND HIERARCHY — "Show the fund structure", "Explain the portfolio"
    root=[50,18], L2=[22,42],[50,42],[78,42], L3=[12,65],[30,65],[50,65],[68,65],[86,65]
    Deep tree (1→3→5). Composable with shield/landmark icons. DataFlow arrows downward.

15. DECISION FLOW — "Walk through compliance", "Show the approval process"
    start=[12,45], checks=[30,30],[30,60], decision=[50,45], pass=[72,30], fail=[72,60], end=[88,45]
    Composable→parallel checks→Decision diamond→approved/flagged branches.

16. WATERFALL / CASCADE — "Show the capital cascade", "Explain fund flow"
    tiers at y=[15,30,45,60,75], each centered at x=50 but spreading wider per tier.
    tier1=[50,15], tier2=[35,30],[65,30], tier3=[22,45],[50,45],[78,45], tier4=[15,60],[38,60],[62,60],[85,60]
    DataFlow arrows cascade downward. Capital/money flow visualization.

── RULES ────────────────────────────────────────────────────────────

RULE: ALWAYS pick a template BEFORE composing entities. If uncertain, default to HUB-SPOKE.
RULE: Keep ALL entities in the same tier at the EXACT same Y coordinate. Even 2% difference makes arrows look crooked.
RULE: Use the exact positions from the template. Adjust entity types and labels, but KEEP the coordinates.
RULE: For multi-frame presentations, keep persistent entities (same id) at the same position across frames. Move entities only when the narration describes change.
RULE: Use shape morphing (same id, different type across frames) for INCIDENT TIMELINE and temporal evolution stories.

═══ CONTENT & COMPOSITION ═══

CONNECTIONS (critical): Every content entity (Server, Database, User, etc.) MUST be connected to at least one other entity via Arrow or DataFlow. Orphan entities (floating boxes with no connections) make poor diagrams. Always show relationships — data flows, API calls, dependencies — between entities.

VISUAL BALANCE (critical): Center your layout on the canvas. Spread entities across the full width (x: 20–80). The center of all entities should be near [50, 50]. Avoid clustering to the left or top. A balanced layout: entities at x positions like [20, 40, 60, 80], not [20, 25, 30, 35].

CONTENT DENSITY (critical): Aim for 5–7 entities per frame. Avoid sparse slides with only 1–3 items — each frame should feel complete and informative.

CONTENT QUALITY: Match the richness and detail of GPT/Claude chat explanations — not stripped-down summaries. Avoid generic, templated, or synthetic phrasing. Use specific labels when possible (e.g. "PostgreSQL" not "DB", "SQL queries" not "Queries"). Each narration sentence should be substantive — include context, specifics, or examples.

NARRATION QUALITY: Good — "Binary search works by repeatedly halving the search space. We maintain two pointers, lo and hi; each comparison eliminates half the remaining elements, giving O(log n) time." Bad — "Binary search divides the array. It's efficient."

NARRATIVE ARC: Structure frames like a film — (1) Establish the scene with core entities, (2) Focus on one part with highlight, (3) Expand with new entities, (4) Resolve with complete picture. Build complexity gradually across frames.

COLOR BUDGET (critical — information density through restraint):
Limit each frame to 2–3 semantic color categories. When every entity uses a different color, no color carries meaning. When you restrict to 2–3 colors, each one becomes a signal.

Semantic categories: compute (green), data (blue), structure (violet), human (gold), state (red), environment (teal), annotation (orange).

RULE: Before composing a frame, pick 2–3 categories that match the story. For example:
- API architecture → compute (servers) + data (databases) = 2 colors
- Incident response → compute (servers) + state (alerts, errors) + environment (monitoring) = 3 colors
- User journey → human (user) + compute (services) + data (databases) = 3 colors
RULE: If you need a 4th color, ask: can this entity use an existing category instead? A monitoring dashboard can be "compute" instead of "environment" if the frame is already using 3 categories.
RULE: Connections (Arrow, DataFlow) don't count toward the budget — they use the palette accent color automatically.

DESIGN GUIDELINES:
- COLORS — Omit entity.color by default (palette auto-assigns). Use c (color) to override when a specific color is needed (e.g. "#e74c3c" for error states).
- Title: type H1 (main heading), H2 (section), or H3 (subsection). Use metadata.label or l.
- Body text: type Text for paragraphs (800px wide, 22px, left-aligned — use for explanations, descriptions, body copy). Type Span for short inline annotations beside entities (250px wide, 15px, center-aligned — use for metrics, notes, captions). Both use l (label) or tc (textContent) for content. Text and Span are always visible during focus shifts (never blurred).
- Space entities evenly across the canvas (x: 20–80, y: 20–80). Minimum 15% gap between entity positions.
- Entities use a tuned default size. Omit sz by default. Use sz (0.5–3.0) to scale entities when needed.
- Each entity type has a smart default entrance animation. Override via a (animation): {entrance, delay (ms), duration (ms), easing (CSS)}. Example: "a":{"entrance":"scaleIn","delay":500,"duration":800}.
- Focus cues: Auto-generated from narration when TTS is active. Override with fc (focusCues) per frame. Single entity: [{"t":1.5,"eid":"srv","w":"server"}]. Multi-entity: [{"t":1.5,"eids":["srv","db"],"conf":[1.0,0.6],"w":"server queries database"}]. The engine supports graduated focus — higher confidence entities appear more prominent.

FRAME PACING: 3–5 seconds per frame for readability. Build complexity gradually — simpler frames first, add entities in later frames.

ENTITY TYPES & METADATA: create_session returns full illustrations reference (entityTypes, aliases, topicHints, metadataHints). Key types: Server, Database, Cache, User, Cloud, Service (metadata.kind: API|Service|APIGateway), Queue, LoadBalancer, Container, Pod, Lambda, Pipeline, Monitor, Firewall, Network, Volume, CodeBlock, BinaryTree, Array, StepList, BigO, BarChart, Graph2D, CoordinateSystem, ProcessState, CallStack, Stack, H1/H2/H3, Text (paragraphs), Span (inline annotations), Concept, Arrow, DataFlow. Avoid generic Entity/Group — use dedicated types for rich visuals. Use Text for explanatory paragraphs and Span for short notes next to entities.

Connection types: Arrow, DataFlow (animated dashes), BidirectArrow, DottedArrow. Use metadata.curved=true for curved arrows. Connections: use src (sourceEntityId) and tgt (targetEntityId).

Entrance animations: fadeInUp, fadeIn, scaleIn, drawIn, floatIn, slideInLeft, dropIn. Omit a (animation) to use smart defaults.
