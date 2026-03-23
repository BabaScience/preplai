import { useState, useCallback, useRef, useEffect } from 'react';
import { registry } from '@preplai/illustrations';
import { ENTITY_DEFAULTS, isConnectionType } from '@preplai/shared';
import { METADATA_DEFAULTS, ENTITY_FIELD_DEFAULTS, COMPOSABLE_SHOWCASE } from './entity-defaults';
import ScenePreview from './ScenePreview';

/* ── Multi-frame morph demo preset ────────────────────────────────── */
const MORPH_DEMO_FRAMES = [
  {
    label: 'Healthy System',
    entities: [
      { id: 'title', type: 'H1', position: { x: 50, y: 8 }, label: 'System Architecture', size: 2.5 },
      { id: 'main', type: 'Server', position: { x: 30, y: 45 }, label: 'API Server', size: 3, metadata: { status: 'healthy', badge: { text: 'v2.1' } } },
      { id: 'store', type: 'Database', position: { x: 70, y: 45 }, label: 'PostgreSQL', size: 3, metadata: { status: 'healthy' } },
      { id: 'flow', type: 'Arrow', position: { x: 50, y: 45 }, sourceEntityId: 'main', targetEntityId: 'store', label: 'SQL Queries', metadata: { animated: true } },
    ],
    narration: 'Frame 1: Everything is healthy',
  },
  {
    label: 'Incident',
    entities: [
      { id: 'title', type: 'H1', position: { x: 50, y: 8 }, label: 'Incident in Progress', size: 2.5 },
      { id: 'main', type: 'Container', position: { x: 30, y: 45 }, label: 'Containerized', size: 3, metadata: { status: 'error', badge: { text: '503', color: '#ef4444' }, emphasis: 'critical' } },
      { id: 'store', type: 'Database', position: { x: 70, y: 45 }, label: 'PostgreSQL', size: 3, metadata: { status: 'warning', progress: 0.4, badge: { text: 'Migrating' } } },
      { id: 'flow', type: 'Arrow', position: { x: 50, y: 45 }, sourceEntityId: 'main', targetEntityId: 'store', label: 'Failing', metadata: { thickness: 'thick', animated: true } },
    ],
    narration: 'Frame 2: Server morphs to Container, error status, database migrating',
  },
  {
    label: 'Recovery',
    entities: [
      { id: 'title', type: 'H1', position: { x: 50, y: 8 }, label: 'Recovery Complete', size: 2.5 },
      { id: 'main', type: 'Cloud', position: { x: 30, y: 45 }, label: 'Cloud Native', size: 3, metadata: { status: 'healthy', badge: { text: 'v3.0', color: '#10b981' } } },
      { id: 'store', type: 'Database', position: { x: 70, y: 45 }, label: 'PostgreSQL', size: 3, metadata: { status: 'healthy', progress: 1.0, badge: { text: '100%', color: '#10b981' } } },
      { id: 'flow', type: 'DataFlow', position: { x: 50, y: 45 }, sourceEntityId: 'main', targetEntityId: 'store', label: 'Streaming', metadata: { thickness: 'thick' } },
    ],
    narration: 'Frame 3: Container morphs to Cloud, migration complete, all healthy',
  },
];

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
        { type: 'GitCommit', x: 12, y: 45, label: 'Commit' },
        { type: 'Build', x: 30, y: 45, label: 'Build' },
        { type: 'Container', x: 50, y: 45, label: 'Test' },
        { type: 'Deployment', x: 70, y: 45, label: 'Deploy' },
        { type: 'Monitor', x: 88, y: 45, label: 'Monitor' },
        { type: 'DataFlow', source: 0, target: 1 },
        { type: 'DataFlow', source: 1, target: 2 },
        { type: 'DataFlow', source: 2, target: 3 },
        { type: 'DataFlow', source: 3, target: 4 },
      ],
      'Layered Stack': [
        { type: 'User', x: 25, y: 20, label: 'React App' },
        { type: 'Device', x: 50, y: 20, label: 'Mobile App' },
        { type: 'User', x: 75, y: 20, label: 'Admin Panel' },
        { type: 'Server', x: 25, y: 45, label: 'API Server' },
        { type: 'Service', x: 50, y: 45, label: 'Auth Service' },
        { type: 'Queue', x: 75, y: 45, label: 'Message Queue' },
        { type: 'Database', x: 25, y: 70, label: 'PostgreSQL' },
        { type: 'Cache', x: 50, y: 70, label: 'Redis' },
        { type: 'StorageBucket', x: 75, y: 70, label: 'S3 Bucket' },
        { type: 'Arrow', source: 0, target: 3 },
        { type: 'Arrow', source: 1, target: 4 },
        { type: 'Arrow', source: 2, target: 3 },
        { type: 'Arrow', source: 3, target: 6 },
        { type: 'Arrow', source: 4, target: 7 },
        { type: 'Arrow', source: 5, target: 8 },
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
        { type: 'Dashboard', x: 50, y: 12, label: 'KPI Dashboard' },
        { type: 'Metric', x: 20, y: 35, label: 'DAU' },
        { type: 'Metric', x: 50, y: 35, label: 'Conversion' },
        { type: 'Metric', x: 80, y: 35, label: 'Revenue' },
        { type: 'Metric', x: 20, y: 65, label: 'Churn' },
        { type: 'BarChart', x: 50, y: 65, label: 'Growth Trend' },
        { type: 'PieChart', x: 80, y: 65, label: 'Segments' },
        { type: 'Arrow', source: 0, target: 1 },
        { type: 'Arrow', source: 0, target: 2 },
        { type: 'Arrow', source: 0, target: 3 },
      ],
      'Roadmap': [
        { type: 'Timeline', x: 50, y: 22, label: 'Product Roadmap' },
        { type: 'Concept', x: 15, y: 55, label: 'Q1: Foundation' },
        { type: 'Concept', x: 35, y: 55, label: 'Q2: Growth' },
        { type: 'Concept', x: 55, y: 55, label: 'Q3: Scale' },
        { type: 'Concept', x: 75, y: 55, label: 'Q4: Expand' },
        { type: 'Arrow', source: 1, target: 2 },
        { type: 'Arrow', source: 2, target: 3 },
        { type: 'Arrow', source: 3, target: 4 },
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
      'Quadrant / SWOT': [
        { type: 'Concept', x: 50, y: 8, label: 'SWOT Analysis' },
        { type: 'Composable: Strategy', x: 28, y: 30, label: 'Strengths' },
        { type: 'Composable: Strategy', x: 72, y: 30, label: 'Weaknesses' },
        { type: 'Composable: Strategy', x: 28, y: 65, label: 'Opportunities' },
        { type: 'Composable: Strategy', x: 72, y: 65, label: 'Threats' },
        { type: 'DottedArrow', source: 1, target: 2 },
        { type: 'DottedArrow', source: 3, target: 4 },
        { type: 'DottedArrow', source: 1, target: 3 },
        { type: 'DottedArrow', source: 2, target: 4 },
      ],
      'Process Flow': [
        { type: 'Composable: Strategy', x: 15, y: 45, label: 'Submit' },
        { type: 'Composable: Compliance', x: 35, y: 45, label: 'Review' },
        { type: 'Decision', x: 55, y: 45, label: 'Approved?' },
        { type: 'Composable: Strategy', x: 78, y: 28, label: 'Proceed' },
        { type: 'Alert', x: 78, y: 62, label: 'Revise' },
        { type: 'DataFlow', source: 0, target: 1 },
        { type: 'DataFlow', source: 1, target: 2 },
        { type: 'Arrow', source: 2, target: 3, label: 'Yes' },
        { type: 'Arrow', source: 2, target: 4, label: 'No' },
        { type: 'DottedArrow', source: 4, target: 0, label: 'Retry' },
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
      'Waterfall': [
        { type: 'Composable: Fund Vehicle', x: 50, y: 15, label: 'Total Capital' },
        { type: 'Composable: Portfolio', x: 35, y: 30, label: 'Management Fee' },
        { type: 'Composable: Portfolio', x: 65, y: 30, label: 'Fund Expenses' },
        { type: 'Composable: Asset', x: 22, y: 45, label: 'Preferred Return' },
        { type: 'Composable: Asset', x: 50, y: 45, label: 'GP Catch-Up' },
        { type: 'Composable: Asset', x: 78, y: 45, label: 'Carried Interest' },
        { type: 'Composable: Asset', x: 15, y: 62, label: 'LP Share 80%' },
        { type: 'Composable: Asset', x: 42, y: 62, label: 'GP Share 20%' },
        { type: 'Composable: Asset', x: 68, y: 62, label: 'Clawback Reserve' },
        { type: 'Composable: Asset', x: 88, y: 62, label: 'Tax Reserve' },
        { type: 'DataFlow', source: 0, target: 1 },
        { type: 'DataFlow', source: 0, target: 2 },
        { type: 'DataFlow', source: 1, target: 3 },
        { type: 'DataFlow', source: 1, target: 4 },
        { type: 'DataFlow', source: 2, target: 5 },
        { type: 'DataFlow', source: 3, target: 6 },
        { type: 'DataFlow', source: 4, target: 7 },
        { type: 'DataFlow', source: 5, target: 8 },
        { type: 'DataFlow', source: 5, target: 9 },
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
const THEMES = ['light', 'cinema'];
const PALETTES = ['default', 'ocean', 'sunset', 'forest', 'mono'];

export default function SceneComposer() {
  const [frames, setFrames] = useState([{ entities: [], narration: '' }]);
  const [currentFrameIdx, setCurrentFrameIdx] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [theme, setTheme] = useState('light');
  const [palette, setPalette] = useState('sunset');
  const [isPlaying, setIsPlaying] = useState(false);
  const searchRef = useRef(null);
  const previewRef = useRef(null);
  const playTimerRef = useRef(null);

  // Current frame's entities (convenience accessor)
  const entities = frames[currentFrameIdx]?.entities ?? [];
  const setEntities = useCallback((updater) => {
    setFrames((prev) => prev.map((f, i) =>
      i === currentFrameIdx
        ? { ...f, entities: typeof updater === 'function' ? updater(f.entities) : updater }
        : f,
    ));
  }, [currentFrameIdx]);

  const isMultiFrame = frames.length > 1;

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

  /** Merge a single key into entity.metadata without replacing other fields */
  const updateMetadata = useCallback((id, key, value) => {
    setEntities((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const meta = { ...(e.metadata ?? {}) };
        if (value === undefined || value === null || value === '' || value === 'none' || value === 'normal') {
          delete meta[key];
        } else {
          meta[key] = value;
        }
        return { ...e, metadata: Object.keys(meta).length > 0 ? meta : undefined };
      }),
    );
  }, []);

  const clearScene = useCallback(() => {
    setFrames([{ entities: [], narration: '' }]);
    setCurrentFrameIdx(0);
    setSelectedId(null);
    setIsPlaying(false);
    nextId = 1;
  }, []);

  const loadPreset = useCallback((name) => {
    nextId = 1;
    setIsPlaying(false);

    // Special: Morph Demo loads multi-frame preset
    if (name === 'Morph Demo') {
      setFrames(MORPH_DEMO_FRAMES.map((f) => ({
        entities: f.entities,
        narration: f.narration,
      })));
      setCurrentFrameIdx(0);
      setSelectedId(MORPH_DEMO_FRAMES[0].entities[0]?.id ?? null);
      return;
    }

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

    setFrames([{ entities: created, narration: '' }]);
    setCurrentFrameIdx(0);
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
    const script = {
      sceneId: 'composer-export',
      totalDuration: frames.length * 5000,
      frames: frames.map((f, i) => ({
        id: `frame-${i + 1}`,
        startTime: i * 5000,
        endTime: (i + 1) * 5000,
        entities: f.entities,
        narrationSegment: f.narration || '',
        description: '',
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(script, null, 2));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1500);
  }, [frames]);

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

  /* ── Frame management ─────────── */

  const addFrame = useCallback(() => {
    // Duplicate current frame so user can modify the copy
    const current = frames[currentFrameIdx];
    const copy = { entities: JSON.parse(JSON.stringify(current?.entities ?? [])), narration: '' };
    setFrames((prev) => [...prev, copy]);
    setCurrentFrameIdx(frames.length);
  }, [frames, currentFrameIdx]);

  const deleteFrame = useCallback(() => {
    if (frames.length <= 1) return;
    setFrames((prev) => prev.filter((_, i) => i !== currentFrameIdx));
    setCurrentFrameIdx((prev) => Math.max(0, prev - 1));
  }, [frames.length, currentFrameIdx]);

  const goToFrame = useCallback((idx) => {
    setCurrentFrameIdx(idx);
    setSelectedId(null);
  }, []);

  // Auto-play through frames
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    playTimerRef.current = setInterval(() => {
      setCurrentFrameIdx((prev) => {
        const next = prev + 1;
        if (next >= frames.length) {
          setIsPlaying(false);
          return 0;
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(playTimerRef.current);
  }, [isPlaying, frames.length]);

  const selected = entities.find((e) => e.id === selectedId);

  return (
    <div className="scene-layout">
      {/* Left panel: entity palette + scene list */}
      <div className="dev-panel dev-panel-left dev-panel-left-inner">
        <h2 className="dev-heading">Scene Composer</h2>

        {/* ── Frame Timeline ────────────────────────────────── */}
        <div className="dev-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="dev-label" style={{ margin: 0 }}>
              Frames ({frames.length})
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {frames.length > 1 && (
                <button
                  type="button"
                  className="scene-preset-btn"
                  style={{ fontSize: '11px', padding: '2px 8px' }}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? '⏸ Stop' : '▶ Play'}
                </button>
              )}
              <button
                type="button"
                className="scene-preset-btn"
                style={{ fontSize: '11px', padding: '2px 8px' }}
                onClick={addFrame}
              >
                + Frame
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {frames.map((f, i) => (
              <button
                key={i}
                type="button"
                className="scene-preset-btn"
                style={{
                  minWidth: '32px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: currentFrameIdx === i ? 700 : 400,
                  background: currentFrameIdx === i ? 'var(--color-accent, #C9A84C)' : 'transparent',
                  color: currentFrameIdx === i ? '#fff' : 'inherit',
                  borderColor: currentFrameIdx === i ? 'var(--color-accent, #C9A84C)' : undefined,
                }}
                onClick={() => goToFrame(i)}
              >
                {i + 1}
              </button>
            ))}
            {frames.length > 1 && (
              <button
                type="button"
                className="dev-btn-ghost"
                style={{ fontSize: '11px', padding: '2px 6px', color: 'var(--color-error, #ef4444)' }}
                onClick={deleteFrame}
                title="Delete current frame"
              >
                ×
              </button>
            )}
          </div>
          {isMultiFrame && (
            <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
              Same entity IDs across frames = cinematic morphing
            </p>
          )}
        </div>

        {/* Morph Demo */}
        <div className="dev-section">
          <label className="dev-label">Demos</label>
          <button
            type="button"
            className="scene-preset-btn"
            style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: '#fff', border: 'none', fontWeight: 600 }}
            onClick={() => loadPreset('Morph Demo')}
          >
            Morph Demo (3 frames)
          </button>
        </div>

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

        {/* Theme & Palette */}
        <div className="dev-section">
          <label className="dev-label">Theme</label>
          <div className="scene-toggle-row">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className="scene-toggle-btn"
                data-active={theme === t}
                onClick={() => setTheme(t)}
              >
                {t === 'cinema' ? '🌙 Cinema' : '☀️ Light'}
              </button>
            ))}
          </div>
          <label className="dev-label" style={{ marginTop: 'var(--space-2)' }}>Palette</label>
          <div className="scene-toggle-row">
            {PALETTES.map((p) => (
              <button
                key={p}
                type="button"
                className="scene-toggle-btn"
                data-active={palette === p}
                onClick={() => setPalette(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

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
          ref={previewRef}
          entities={entities}
          selectedId={selectedId}
          onSelectEntity={setSelectedId}
          theme={theme}
          palette={palette}
          useController={isMultiFrame}
          frames={isMultiFrame ? frames : null}
          currentFrameIdx={currentFrameIdx}
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

            {/* ── Enhanced Metadata Controls ─────────────────────── */}
            {!isConnectionType(selected.type) && (
              <>
                {/* Status */}
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Status</label>
                  <select
                    className="dev-input"
                    value={selected.metadata?.status ?? 'none'}
                    onChange={(e) => updateMetadata(selected.id, 'status', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="healthy">Healthy</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                    <option value="inactive">Inactive</option>
                    <option value="loading">Loading</option>
                  </select>
                </div>

                {/* Progress */}
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Progress</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={selected.metadata?.progress ?? 0}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        updateMetadata(selected.id, 'progress', v > 0 ? v : undefined);
                      }}
                      className="dev-input"
                      style={{ flex: 1 }}
                    />
                    <span className="dev-value" style={{ minWidth: 36 }}>
                      {selected.metadata?.progress != null ? `${Math.round(selected.metadata.progress * 100)}%` : 'Off'}
                    </span>
                  </div>
                </div>

                {/* Emphasis */}
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Emphasis</label>
                  <select
                    className="dev-input"
                    value={selected.metadata?.emphasis ?? 'normal'}
                    onChange={(e) => updateMetadata(selected.id, 'emphasis', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Badge */}
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Badge</label>
                  <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                    <input
                      type="text"
                      className="dev-input"
                      placeholder="Badge text..."
                      value={selected.metadata?.badge?.text ?? ''}
                      onChange={(e) => {
                        const text = e.target.value;
                        if (!text) {
                          updateMetadata(selected.id, 'badge', undefined);
                        } else {
                          updateMetadata(selected.id, 'badge', {
                            text,
                            position: selected.metadata?.badge?.position ?? 'top-right',
                          });
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <select
                      className="dev-input"
                      style={{ width: 'auto', minWidth: 80 }}
                      value={selected.metadata?.badge?.position ?? 'top-right'}
                      onChange={(e) => {
                        if (!selected.metadata?.badge?.text) return;
                        updateMetadata(selected.id, 'badge', {
                          ...selected.metadata.badge,
                          position: e.target.value,
                        });
                      }}
                    >
                      <option value="top-right">Top-Right</option>
                      <option value="top-left">Top-Left</option>
                      <option value="bottom-right">Bottom-Right</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* ── Connection Enhancements ─────────────────────────── */}
            {isConnectionType(selected.type) && (
              <>
                {/* Thickness */}
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label">Thickness</label>
                  <select
                    className="dev-input"
                    value={selected.metadata?.thickness ?? 'normal'}
                    onChange={(e) => updateMetadata(selected.id, 'thickness', e.target.value === 'normal' ? undefined : e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="thin">Thin</option>
                    <option value="thick">Thick</option>
                  </select>
                </div>

                {/* Animated */}
                <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <label className="dev-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <input
                      type="checkbox"
                      checked={selected.metadata?.animated === true}
                      onChange={(e) => updateMetadata(selected.id, 'animated', e.target.checked || undefined)}
                    />
                    Animated flow
                  </label>
                </div>

                {/* Bidirectional */}
                {selected.type === 'Arrow' && (
                  <div className="dev-input-group" style={{ marginBottom: 'var(--space-3)' }}>
                    <label className="dev-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <input
                        type="checkbox"
                        checked={selected.metadata?.bidirectional === true}
                        onChange={(e) => updateMetadata(selected.id, 'bidirectional', e.target.checked || undefined)}
                      />
                      Bidirectional
                    </label>
                  </div>
                )}
              </>
            )}

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
