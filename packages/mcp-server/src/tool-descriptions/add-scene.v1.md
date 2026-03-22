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

DEPTH OF FIELD: Set "highlight": true on the entity you're narrating about. The engine dims/blurs everything else (0.35 opacity, blur, 0.88x scale) and enlarges the focused entity (1.15x). Creates cinematic focus pull. Use ONE highlight per frame, matching narration.

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

═══ CONTENT & COMPOSITION ═══

CONNECTIONS (critical): Every content entity (Server, Database, User, etc.) MUST be connected to at least one other entity via Arrow or DataFlow. Orphan entities (floating boxes with no connections) make poor diagrams. Always show relationships — data flows, API calls, dependencies — between entities.

VISUAL BALANCE (critical): Center your layout on the canvas. Spread entities across the full width (x: 20–80). The center of all entities should be near [50, 50]. Avoid clustering to the left or top. A balanced layout: entities at x positions like [20, 40, 60, 80], not [20, 25, 30, 35].

CONTENT DENSITY (critical): Aim for 5–7 entities per frame. Avoid sparse slides with only 1–3 items — each frame should feel complete and informative.

CONTENT QUALITY: Match the richness and detail of GPT/Claude chat explanations — not stripped-down summaries. Avoid generic, templated, or synthetic phrasing. Use specific labels when possible (e.g. "PostgreSQL" not "DB", "SQL queries" not "Queries"). Each narration sentence should be substantive — include context, specifics, or examples.

NARRATION QUALITY: Good — "Binary search works by repeatedly halving the search space. We maintain two pointers, lo and hi; each comparison eliminates half the remaining elements, giving O(log n) time." Bad — "Binary search divides the array. It's efficient."

NARRATIVE ARC: Structure frames like a film — (1) Establish the scene with core entities, (2) Focus on one part with highlight, (3) Expand with new entities, (4) Resolve with complete picture. Build complexity gradually across frames.

DESIGN GUIDELINES:
- COLORS — Omit entity.color by default (palette auto-assigns). Use c (color) to override when a specific color is needed (e.g. "#e74c3c" for error states).
- Title: type H1 (main heading), H2 (section), or H3 (subsection). Use metadata.label or l.
- Space entities evenly across the canvas (x: 20–80, y: 20–80). Minimum 15% gap between entity positions.
- Entities use a tuned default size. Omit sz by default. Use sz (0.5–3.0) to scale entities when needed.
- Each entity type has a smart default entrance animation. Override via a (animation): {entrance, delay (ms), duration (ms), easing (CSS)}. Example: "a":{"entrance":"scaleIn","delay":500,"duration":800}.
- Focus cues: Auto-generated from narration when TTS is active. Override with fc (focusCues) per frame. Single entity: [{"t":1.5,"eid":"srv","w":"server"}]. Multi-entity: [{"t":1.5,"eids":["srv","db"],"conf":[1.0,0.6],"w":"server queries database"}]. The engine supports graduated focus — higher confidence entities appear more prominent.

FRAME PACING: 3–5 seconds per frame for readability. Build complexity gradually — simpler frames first, add entities in later frames.

ENTITY TYPES & METADATA: create_session returns full illustrations reference (entityTypes, aliases, topicHints, metadataHints). Key types: Server, Database, Cache, User, Cloud, Service (metadata.kind: API|Service|APIGateway), Queue, LoadBalancer, Container, Pod, Lambda, Pipeline, Monitor, Firewall, Network, Volume, CodeBlock, BinaryTree, Array, StepList, BigO, BarChart, Graph2D, CoordinateSystem, ProcessState, CallStack, Stack, H1/H2/H3, Concept, Arrow, DataFlow. Avoid generic Entity/Group — use dedicated types for rich visuals.

Connection types: Arrow, DataFlow (animated dashes), BidirectArrow, DottedArrow. Use metadata.curved=true for curved arrows. Connections: use src (sourceEntityId) and tgt (targetEntityId).

Entrance animations: fadeInUp, fadeIn, scaleIn, drawIn, floatIn, slideInLeft, dropIn. Omit a (animation) to use smart defaults.
