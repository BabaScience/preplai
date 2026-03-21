import { useState, useCallback, useRef } from 'react';
import { registry } from '@preplai/illustrations';
import { ENTITY_DEFAULTS, isConnectionType } from '@preplai/shared';
import { METADATA_DEFAULTS, ENTITY_FIELD_DEFAULTS, COMPOSABLE_SHOWCASE } from './entity-defaults';
import ScenePreview from './ScenePreview';

/* ── Available types ────────────────────────────────────────────────── */
const EXCLUDED_TYPES = new Set([
  'Label', 'GraphDS', 'GraphTraversal', 'NumberLine',
  'ProcessBlock', 'Proof', 'QueryPlan', 'Register', 'Registry', 'StateNode',
]);
const COMPOSABLE_VARIANTS = Object.keys(COMPOSABLE_SHOWCASE);
const ENTITY_TYPES = [
  ...Object.keys(registry).filter((t) => !EXCLUDED_TYPES.has(t)).sort(),
  ...COMPOSABLE_VARIANTS,
];

/* ── Helpers ─────────────────────────────────────────────────────────── */
let nextId = 1;

function makeEntity(type, posX = 50, posY = 50) {
  const id = `scene-${nextId++}`;
  const showcase = COMPOSABLE_SHOWCASE[type];

  if (showcase) {
    return {
      ...ENTITY_DEFAULTS,
      id,
      type: 'Composable',
      position: { x: posX, y: posY },
      label: showcase.label,
      size: 2.5,
      metadata: JSON.parse(JSON.stringify(showcase.metadata)),
    };
  }

  const base = {
    ...ENTITY_DEFAULTS,
    id,
    type,
    position: { x: posX, y: posY },
    label: type,
    size: 2.5,
    ...ENTITY_FIELD_DEFAULTS[type],
  };

  if (METADATA_DEFAULTS[type]) {
    base.metadata = JSON.parse(JSON.stringify(METADATA_DEFAULTS[type]));
  }

  return base;
}

/* ── Preset scene templates, grouped by target user ──────────────────── */

const PRESET_CATEGORIES = [
  {
    title: 'Engineers & SRE',
    presets: {
      'Architecture': [
        { type: 'User', x: 15, y: 50 },
        { type: 'LoadBalancer', x: 38, y: 50 },
        { type: 'Server', x: 58, y: 30 },
        { type: 'Server', x: 58, y: 70, label: 'Server 2' },
        { type: 'Database', x: 80, y: 50 },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 1, target: 2 },
        { type: 'Arrow', source: 1, target: 3 },
        { type: 'Arrow', source: 2, target: 4 },
        { type: 'Arrow', source: 3, target: 4 },
      ],
      'Microservices': [
        { type: 'ApiGateway', x: 15, y: 50 },
        { type: 'Service', x: 40, y: 25, label: 'Users' },
        { type: 'Service', x: 40, y: 50, label: 'Orders' },
        { type: 'Service', x: 40, y: 75, label: 'Payments' },
        { type: 'Queue', x: 62, y: 50 },
        { type: 'Database', x: 82, y: 25, label: 'Users DB' },
        { type: 'Database', x: 82, y: 50, label: 'Orders DB' },
        { type: 'Database', x: 82, y: 75, label: 'Payments DB' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 5 },
        { type: 'Arrow', source: 2, target: 4 },
        { type: 'Arrow', source: 3, target: 7 },
        { type: 'DataFlow', source: 2, target: 6 },
      ],
      'Incident Response': [
        { type: 'Alert', x: 10, y: 30, label: 'Alert Fired' },
        { type: 'Monitor', x: 30, y: 30, label: 'PagerDuty' },
        { type: 'Server', x: 50, y: 30, label: 'App Server' },
        { type: 'Database', x: 70, y: 30, label: 'Primary DB' },
        { type: 'StepList', x: 50, y: 72, label: 'Response Steps' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 1, target: 2 },
        { type: 'Arrow', source: 2, target: 3 },
      ],
      'CI/CD Pipeline': [
        { type: 'GitCommit', x: 12, y: 50, label: 'Commit' },
        { type: 'Build', x: 30, y: 50, label: 'Build' },
        { type: 'Container', x: 48, y: 50, label: 'Test' },
        { type: 'Deployment', x: 66, y: 50, label: 'Deploy' },
        { type: 'Monitor', x: 84, y: 50, label: 'Monitor' },
        { type: 'DataFlow', source: 0, target: 1 },
        { type: 'DataFlow', source: 1, target: 2 },
        { type: 'DataFlow', source: 2, target: 3 },
        { type: 'DataFlow', source: 3, target: 4 },
      ],
    },
  },
  {
    title: 'Product Managers',
    presets: {
      'User Journey': [
        { type: 'User', x: 10, y: 50, label: 'User' },
        { type: 'UserJourneyStep', x: 28, y: 50, label: 'Discover' },
        { type: 'UserJourneyStep', x: 44, y: 50, label: 'Sign Up' },
        { type: 'UserJourneyStep', x: 60, y: 50, label: 'Onboard' },
        { type: 'UserJourneyStep', x: 76, y: 50, label: 'Activate' },
        { type: 'Metric', x: 90, y: 50, label: 'Retention' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 1, target: 2 },
        { type: 'Arrow', source: 2, target: 3 },
        { type: 'Arrow', source: 3, target: 4 },
        { type: 'Arrow', source: 4, target: 5 },
      ],
      'Feature Breakdown': [
        { type: 'Concept', x: 50, y: 18, label: 'Product' },
        { type: 'ComponentNode', x: 22, y: 45, label: 'Frontend' },
        { type: 'ComponentNode', x: 50, y: 45, label: 'Backend' },
        { type: 'ComponentNode', x: 78, y: 45, label: 'Data' },
        { type: 'Task', x: 14, y: 72, label: 'UI Components' },
        { type: 'Task', x: 36, y: 72, label: 'API Layer' },
        { type: 'Task', x: 58, y: 72, label: 'Auth Service' },
        { type: 'Task', x: 80, y: 72, label: 'Analytics' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 4 },
        { type: 'Arrow', source: 2, target: 5 },
        { type: 'Arrow', source: 2, target: 6 },
        { type: 'Arrow', source: 3, target: 7 },
      ],
      'Product Metrics': [
        { type: 'Dashboard', x: 50, y: 20, label: 'KPI Dashboard' },
        { type: 'Metric', x: 18, y: 50, label: 'DAU' },
        { type: 'Metric', x: 38, y: 50, label: 'Conversion' },
        { type: 'Metric', x: 58, y: 50, label: 'Revenue' },
        { type: 'Metric', x: 78, y: 50, label: 'Churn' },
        { type: 'BarChart', x: 30, y: 78, label: 'Growth Trend' },
        { type: 'PieChart', x: 68, y: 78, label: 'Segments' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 0, target: 4 },
      ],
    },
  },
  {
    title: 'Consultants & Strategy',
    presets: {
      'Market Analysis': [
        { type: 'Composable: Market', x: 50, y: 18, label: 'Market' },
        { type: 'Composable: Strategy', x: 20, y: 45, label: 'Segment A' },
        { type: 'Composable: Strategy', x: 50, y: 45, label: 'Segment B' },
        { type: 'Composable: Strategy', x: 80, y: 45, label: 'Segment C' },
        { type: 'Metric', x: 20, y: 72, label: '$2.4B' },
        { type: 'Metric', x: 50, y: 72, label: '$1.8B' },
        { type: 'Metric', x: 80, y: 72, label: '$900M' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 4 },
        { type: 'Arrow', source: 2, target: 5 },
        { type: 'Arrow', source: 3, target: 6 },
      ],
      'Org Structure': [
        { type: 'Composable: Team Lead', x: 50, y: 15, label: 'CEO' },
        { type: 'Composable: Team Lead', x: 22, y: 40, label: 'CTO' },
        { type: 'Composable: Team Lead', x: 50, y: 40, label: 'CPO' },
        { type: 'Composable: Team Lead', x: 78, y: 40, label: 'CFO' },
        { type: 'Composable: Team Lead', x: 14, y: 65, label: 'Eng Lead' },
        { type: 'Composable: Team Lead', x: 34, y: 65, label: 'DevOps' },
        { type: 'Composable: Team Lead', x: 54, y: 65, label: 'Design' },
        { type: 'Composable: Team Lead', x: 74, y: 65, label: 'Finance' },
        { type: 'Composable: Team Lead', x: 88, y: 65, label: 'Legal' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 4 },
        { type: 'Arrow', source: 1, target: 5 },
        { type: 'Arrow', source: 2, target: 6 },
        { type: 'Arrow', source: 3, target: 7 },
        { type: 'Arrow', source: 3, target: 8 },
      ],
      'Strategy Framework': [
        { type: 'Concept', x: 50, y: 15, label: 'Vision' },
        { type: 'Composable: Strategy', x: 20, y: 40, label: 'Objective 1' },
        { type: 'Composable: Strategy', x: 50, y: 40, label: 'Objective 2' },
        { type: 'Composable: Strategy', x: 80, y: 40, label: 'Objective 3' },
        { type: 'StepList', x: 20, y: 72, label: 'Key Results' },
        { type: 'StepList', x: 50, y: 72, label: 'Key Results' },
        { type: 'StepList', x: 80, y: 72, label: 'Key Results' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 4 },
        { type: 'Arrow', source: 2, target: 5 },
        { type: 'Arrow', source: 3, target: 6 },
      ],
    },
  },
  {
    title: 'Finance & Legal',
    presets: {
      'Fund Structure': [
        { type: 'Composable: Fund Vehicle', x: 50, y: 15, label: 'Fund LP' },
        { type: 'Composable: Portfolio', x: 22, y: 42, label: 'Equity' },
        { type: 'Composable: Portfolio', x: 50, y: 42, label: 'Fixed Income' },
        { type: 'Composable: Portfolio', x: 78, y: 42, label: 'Alternatives' },
        { type: 'Composable: Asset', x: 12, y: 70, label: 'Tech Stocks' },
        { type: 'Composable: Asset', x: 32, y: 70, label: 'Healthcare' },
        { type: 'Composable: Asset', x: 50, y: 70, label: 'Gov Bonds' },
        { type: 'Composable: Asset', x: 68, y: 70, label: 'RE Fund' },
        { type: 'Composable: Asset', x: 86, y: 70, label: 'PE Fund' },
        { type: 'DataFlow', source: 0, target: 1 },
        { type: 'DataFlow', source: 0, target: 2 },
        { type: 'DataFlow', source: 0, target: 3 },
        { type: 'DataFlow', source: 1, target: 4 },
        { type: 'DataFlow', source: 1, target: 5 },
        { type: 'DataFlow', source: 2, target: 6 },
        { type: 'DataFlow', source: 3, target: 7 },
        { type: 'DataFlow', source: 3, target: 8 },
      ],
      'Compliance Flow': [
        { type: 'Composable: Contract', x: 12, y: 50, label: 'Client Agreement' },
        { type: 'Composable: Compliance', x: 32, y: 35, label: 'KYC Check' },
        { type: 'Composable: Regulation', x: 32, y: 65, label: 'AML Screen' },
        { type: 'Decision', x: 52, y: 50, label: 'Approved?' },
        { type: 'Composable: Fund Vehicle', x: 75, y: 35, label: 'Onboard Client' },
        { type: 'Alert', x: 75, y: 65, label: 'Flag for Review' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 1, target: 3 },
        { type: 'Arrow', source: 2, target: 3 },
        { type: 'Arrow', source: 3, target: 4 },
        { type: 'Arrow', source: 3, target: 5 },
      ],
      'Contract Hierarchy': [
        { type: 'Composable: Contract', x: 50, y: 15, label: 'Master Agreement' },
        { type: 'Composable: Contract', x: 25, y: 42, label: 'Service Terms' },
        { type: 'Composable: Contract', x: 50, y: 42, label: 'Data Processing' },
        { type: 'Composable: Contract', x: 75, y: 42, label: 'SLA' },
        { type: 'Composable: Compliance', x: 25, y: 70, label: 'GDPR' },
        { type: 'Composable: Regulation', x: 50, y: 70, label: 'SOC 2' },
        { type: 'Composable: Compliance', x: 75, y: 70, label: 'ISO 27001' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 4 },
        { type: 'Arrow', source: 2, target: 5 },
        { type: 'Arrow', source: 3, target: 6 },
      ],
    },
  },
];

// Flat lookup for loadPreset
const SCENE_PRESETS = {};
for (const cat of PRESET_CATEGORIES) {
  Object.assign(SCENE_PRESETS, cat.presets);
}

/* ── Component ───────────────────────────────────────────────────────── */
export default function SceneComposer() {
  const [entities, setEntities] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const searchRef = useRef(null);

  const filtered = search.trim()
    ? ENTITY_TYPES.filter((t) => t.toLowerCase().includes(search.trim().toLowerCase()))
    : ENTITY_TYPES;

  /* ── Actions ────────────────── */

  const addEntity = useCallback((type) => {
    // Spread entities across the canvas with some randomness
    const count = entities.length;
    const cols = 4;
    const col = count % cols;
    const row = Math.floor(count / cols);
    const x = Math.round(20 + col * 20 + (Math.random() * 6 - 3));
    const y = Math.round(30 + row * 25 + (Math.random() * 6 - 3));
    const ent = makeEntity(type, Math.min(90, Math.max(10, x)), Math.min(85, Math.max(15, y)));
    setEntities((prev) => [...prev, ent]);
    setSelectedId(ent.id);
    setSearch('');
    searchRef.current?.focus();
  }, [entities.length]);

  const removeEntity = useCallback((id) => {
    setEntities((prev) => {
      // Also remove connections referencing this entity
      return prev.filter((e) => {
        if (e.id === id) return false;
        if (e.sourceEntityId === id || e.targetEntityId === id) return false;
        return true;
      });
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const updateEntity = useCallback((id, changes) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...changes } : e)),
    );
  }, []);

  const clearScene = useCallback(() => {
    setEntities([]);
    setSelectedId(null);
    nextId = 1;
  }, []);

  const loadPreset = useCallback((name) => {
    nextId = 1;
    const template = SCENE_PRESETS[name];
    if (!template) return;

    // First pass: create non-connection entities
    const created = [];
    const connectionDefs = [];

    for (const def of template) {
      if (isConnectionType(def.type)) {
        connectionDefs.push(def);
      } else {
        const ent = makeEntity(def.type, def.x, def.y);
        if (def.label) ent.label = def.label;
        created.push(ent);
      }
    }

    // Second pass: create connections with source/target ids
    for (const def of connectionDefs) {
      const srcEnt = created[def.source];
      const tgtEnt = created[def.target];
      if (!srcEnt || !tgtEnt) continue;

      const conn = makeEntity(def.type, 50, 50);
      conn.sourceEntityId = srcEnt.id;
      conn.targetEntityId = tgtEnt.id;
      conn.label = def.label || '';
      created.push(conn);
    }

    setEntities(created);
    setSelectedId(created[0]?.id ?? null);
  }, []);

  const addConnection = useCallback((type) => {
    const nonConns = entities.filter((e) => !isConnectionType(e.type));
    if (nonConns.length < 2) return;

    const conn = makeEntity(type, 50, 50);
    conn.sourceEntityId = nonConns[0].id;
    conn.targetEntityId = nonConns[1].id;
    conn.label = '';
    setEntities((prev) => [...prev, conn]);
    setSelectedId(conn.id);
  }, [entities]);

  const copySceneJson = useCallback(() => {
    const frame = {
      id: 'frame-1',
      startTime: 0,
      endTime: 8000,
      entities: entities,
      narrationSegment: '',
      description: 'Scene composed in debug page',
    };
    navigator.clipboard.writeText(JSON.stringify(frame, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [entities]);

  const handleJsonImport = useCallback(() => {
    setJsonError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      // Accept either a frame (with .entities array) or a raw array
      const arr = Array.isArray(parsed) ? parsed : parsed.entities;
      if (!Array.isArray(arr) || arr.length === 0) {
        setJsonError('Expected an array of entities or a frame with .entities');
        return;
      }
      setEntities(arr);
      setSelectedId(arr[0]?.id ?? null);
      setShowJson(false);
      setJsonInput('');
    } catch (e) {
      setJsonError('Invalid JSON: ' + e.message);
    }
  }, [jsonInput]);

  const selected = entities.find((e) => e.id === selectedId);

  return (
    <div className="scene-layout">
      {/* Left panel: entity palette + scene list */}
      <div className="dev-panel dev-panel-left dev-panel-left-inner">
        <h2 className="dev-heading">Scene Composer</h2>

        {/* Presets by user type */}
        {PRESET_CATEGORIES.map((cat) => (
          <div key={cat.title} className="dev-section">
            <label className="dev-label">{cat.title}</label>
            <div className="scene-preset-grid">
              {Object.keys(cat.presets).map((name) => (
                <button
                  key={name}
                  type="button"
                  className="scene-preset-btn"
                  onClick={() => loadPreset(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Add entity */}
        <div className="dev-section">
          <label className="dev-label">Add entity</label>
          <input
            ref={searchRef}
            type="search"
            placeholder="Search type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="dev-input"
          />
          {search.trim() && (
            <ul className="scene-add-list">
              {filtered.slice(0, 8).map((type) => (
                <li key={type}>
                  <button
                    type="button"
                    className="scene-add-item"
                    onClick={() => addEntity(type)}
                  >
                    + {type}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add connection */}
        {entities.filter((e) => !isConnectionType(e.type)).length >= 2 && (
          <div className="dev-section">
            <label className="dev-label">Add connection</label>
            <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
              {['Arrow', 'DataFlow', 'DependencyLink'].map((ct) => (
                <button
                  key={ct}
                  type="button"
                  className="scene-preset-btn"
                  onClick={() => addConnection(ct)}
                >
                  + {ct}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scene entities */}
        <div className="dev-section" style={{ borderBottom: 'none', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
            <label className="dev-label" style={{ margin: 0 }}>
              Scene ({entities.length})
            </label>
            {entities.length > 0 && (
              <button type="button" className="dev-btn-ghost" onClick={clearScene}>
                Clear
              </button>
            )}
          </div>
          <ul className="scene-entity-list">
            {entities.map((ent) => (
              <li key={ent.id}>
                <div
                  role="button"
                  tabIndex={0}
                  className="scene-entity-row"
                  data-selected={selectedId === ent.id}
                  onClick={() => setSelectedId(ent.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(ent.id);
                    }
                  }}
                >
                  <span className="scene-entity-type">{ent.type}</span>
                  <span className="scene-entity-label">{ent.label || ent.id}</span>
                  <button
                    type="button"
                    className="scene-entity-remove"
                    onClick={(e) => { e.stopPropagation(); removeEntity(ent.id); }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Center: Scene canvas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
        <ScenePreview
          entities={entities}
          selectedId={selectedId}
          onSelectEntity={setSelectedId}
        />
      </div>

      {/* Right: Selected entity editor + scene export */}
      <div
        className="dev-panel"
        style={{ overflowY: 'auto', borderLeft: '1px solid var(--color-border)', width: '100%' }}
      >
        {selected ? (
          <div style={{ padding: 'var(--space-3)' }}>
            <h3 className="dev-heading" style={{ padding: 0, marginBottom: 'var(--space-3)' }}>
              {selected.type}
              <span style={{ fontWeight: 400, opacity: 0.5, marginLeft: 'var(--space-2)', fontSize: 'var(--text-xs)' }}>
                {selected.id}
              </span>
            </h3>

            {/* Position */}
            <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="dev-label">Position X (0–100)</label>
              <input
                type="number"
                className="dev-input"
                min={0}
                max={100}
                value={selected.position?.x ?? 50}
                onChange={(e) =>
                  updateEntity(selected.id, {
                    position: { ...selected.position, x: Number(e.target.value) },
                  })
                }
              />
              <label className="dev-label">Position Y (0–100)</label>
              <input
                type="number"
                className="dev-input"
                min={0}
                max={100}
                value={selected.position?.y ?? 50}
                onChange={(e) =>
                  updateEntity(selected.id, {
                    position: { ...selected.position, y: Number(e.target.value) },
                  })
                }
              />
            </div>

            {/* Size */}
            <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="dev-label">Size</label>
              <input
                type="range"
                min={1}
                max={5}
                step={0.1}
                value={selected.size ?? 2.5}
                onChange={(e) => updateEntity(selected.id, { size: Number(e.target.value) })}
                className="dev-input"
                style={{ width: '100%' }}
              />
              <span className="dev-value">{(selected.size ?? 2.5).toFixed(1)}</span>
            </div>

            {/* Label */}
            <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="dev-label">Label</label>
              <input
                type="text"
                className="dev-input"
                value={selected.label ?? ''}
                onChange={(e) => updateEntity(selected.id, { label: e.target.value })}
              />
            </div>

            {/* Color */}
            <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="dev-label">Color</label>
              <input
                type="text"
                className="dev-input"
                value={selected.color ?? ''}
                placeholder="Auto (from palette)"
                onChange={(e) => updateEntity(selected.id, { color: e.target.value || undefined })}
              />
            </div>

            {/* Connection source/target */}
            {isConnectionType(selected.type) && (
              <>
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Source Entity</label>
                  <select
                    className="dev-input"
                    value={selected.sourceEntityId ?? ''}
                    onChange={(e) => updateEntity(selected.id, { sourceEntityId: e.target.value })}
                  >
                    <option value="">— select —</option>
                    {entities.filter((e) => !isConnectionType(e.type) && e.id !== selected.id).map((e) => (
                      <option key={e.id} value={e.id}>{e.label || e.id} ({e.type})</option>
                    ))}
                  </select>
                </div>
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Target Entity</label>
                  <select
                    className="dev-input"
                    value={selected.targetEntityId ?? ''}
                    onChange={(e) => updateEntity(selected.id, { targetEntityId: e.target.value })}
                  >
                    <option value="">— select —</option>
                    {entities.filter((e) => !isConnectionType(e.type) && e.id !== selected.id).map((e) => (
                      <option key={e.id} value={e.id}>{e.label || e.id} ({e.type})</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <button
              type="button"
              className="scene-preset-btn"
              style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)', marginTop: 'var(--space-2)' }}
              onClick={() => removeEntity(selected.id)}
            >
              Remove from scene
            </button>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
            {entities.length === 0
              ? 'Load a preset or search to add entities'
              : 'Click an entity in the scene or list to edit it'}
          </div>
        )}

        {/* Export section */}
        <div style={{ borderTop: '1px solid var(--color-border)', padding: 'var(--space-3)', marginTop: 'auto' }}>
          <button
            type="button"
            className="scene-export-btn"
            onClick={copySceneJson}
            disabled={entities.length === 0}
          >
            {copyFeedback ? 'Copied!' : 'Copy Frame JSON'}
          </button>
          <button
            type="button"
            className="scene-export-btn scene-export-btn-secondary"
            onClick={() => { setShowJson(!showJson); setJsonInput(''); setJsonError(null); }}
          >
            {showJson ? 'Cancel import' : 'Import JSON'}
          </button>
          {showJson && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <textarea
                className="dev-input"
                rows={6}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='Paste frame JSON or entities array...'
                style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}
              />
              {jsonError && (
                <p style={{ color: 'var(--color-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-1)' }}>
                  {jsonError}
                </p>
              )}
              <button
                type="button"
                className="scene-export-btn"
                onClick={handleJsonImport}
                style={{ marginTop: 'var(--space-1)' }}
              >
                Apply JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
