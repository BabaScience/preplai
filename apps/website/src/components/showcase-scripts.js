/**
 * showcase-scripts.js — Demo VisualScripts for the four persona showcases.
 *
 * Each script has 5 frames x 5s = ~25s loop.
 * One script per persona: Engineers, PMs, Consultants, Financial/Legal.
 *
 * Entity positions are clustered per frame (~40-60% canvas width) to enable
 * cinematic camera pans/zooms between frames via SceneController viewBox animation.
 * No hardcoded colors — entities inherit from the active palette.
 */

// ── 1. Engineers & SRE: Incident Postmortem ──────────────────────────
export const ENGINEER_SCRIPT = {
  frames: [
    {
      // Frame 1: Center cluster — zoom into the incident
      narrationSegment: 'At 2:14 AM, the API Gateway starts returning 503 errors. Latency spikes from 45ms to 12 seconds. PagerDuty fires.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Incident Postmortem', size: 2 },
        { id: 'gw', type: 'APIGateway', position: { x: 50, y: 38 }, label: 'API Gateway', size: 2.5, highlight: true },
        { id: 'alert1', type: 'Alert', position: { x: 70, y: 32 }, label: '503 Errors', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 30, y: 32 }, label: 'Latency', size: 2, metadata: { value: '12.3s', trend: 'up' } },
        { id: 'timeline1', type: 'Timeline', position: { x: 50, y: 62 }, label: 'Incident Timeline', size: 2.5, metadata: { events: ['2:14 AM — 503s begin', '2:15 AM — PagerDuty fires', '2:18 AM — Team responds'] } },
      ],
    },
    {
      // Frame 2: Right cluster — pan to root cause
      narrationSegment: 'Root cause: a deploy at 2:12 AM introduced a database connection leak. The connection pool exhausted within 2 minutes.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 55, y: 12 }, label: 'Root Cause Analysis', size: 2 },
        { id: 'deploy1', type: 'Deployment', position: { x: 35, y: 38 }, label: 'Deploy v2.4.1', size: 2 },
        { id: 'svc1', type: 'Server', position: { x: 52, y: 38 }, label: 'Auth Service', size: 2, highlight: true },
        { id: 'db1', type: 'Database', position: { x: 70, y: 38 }, label: 'Users DB', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'deploy1', targetEntityId: 'svc1', label: '2:12 AM' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'db1', label: 'conn leak', style: 'dashed' },
        { id: 'metric1', type: 'Metric', position: { x: 70, y: 60 }, label: 'Pool', size: 2, metadata: { value: '0 free', trend: 'down' } },
        { id: 'label1', type: 'Label', position: { x: 52, y: 65 }, label: 'New ORM version didn\'t close connections on error paths.' },
      ],
    },
    {
      // Frame 3: Left cluster — cascade failure
      narrationSegment: 'The connection leak cascaded downstream. Auth failures caused the gateway to retry, amplifying load 4x across all services.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Cascade Failure', size: 2 },
        { id: 'gw', type: 'APIGateway', position: { x: 28, y: 40 }, label: 'Gateway', size: 2 },
        { id: 'svc1', type: 'Server', position: { x: 48, y: 28 }, label: 'Auth', size: 1.8 },
        { id: 'svc2', type: 'Server', position: { x: 48, y: 48 }, label: 'Orders', size: 1.8 },
        { id: 'svc3', type: 'Server', position: { x: 48, y: 68 }, label: 'Payments', size: 1.8 },
        { id: 'cb1', type: 'CircuitBreaker', position: { x: 68, y: 40 }, label: 'No Circuit Breaker', size: 2.5, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'gw', targetEntityId: 'svc1', label: 'retry 4x' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'gw', targetEntityId: 'svc2', label: 'retry 4x' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'gw', targetEntityId: 'svc3', label: 'retry 4x' },
      ],
    },
    {
      // Frame 4: Center-right — resolution
      narrationSegment: 'Resolution: team rolled back the deploy at 2:31 AM. Connection pool recovered. Full service restored by 2:34 AM.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 52, y: 12 }, label: 'Resolution', size: 2 },
        { id: 'rb1', type: 'Rollback', position: { x: 35, y: 38 }, label: 'Rollback v2.4.0', size: 2, highlight: true },
        { id: 'svc1', type: 'Server', position: { x: 55, y: 38 }, label: 'Auth Service', size: 2 },
        { id: 'db1', type: 'Database', position: { x: 72, y: 38 }, label: 'Users DB', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'rb1', targetEntityId: 'svc1', label: 'restore' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'svc1', targetEntityId: 'db1', label: 'healthy' },
        { id: 'metric1', type: 'Metric', position: { x: 55, y: 62 }, label: 'MTTR', size: 2, metadata: { value: '20 min', trend: 'down' } },
        { id: 'timeline1', type: 'Timeline', position: { x: 55, y: 78 }, label: '', size: 2, metadata: { events: ['2:31 AM — rollback', '2:34 AM — recovered'] } },
      ],
    },
    {
      // Frame 5: Left cluster — action items
      narrationSegment: 'Action items: add circuit breakers, connection pool alerts at 80%, and mandatory canary deploys. Total downtime: 20 minutes.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Action Items', size: 2 },
        { id: 'step1', type: 'StepList', position: { x: 38, y: 42 }, label: 'Follow-ups', size: 3, highlight: true, metadata: { steps: ['Add circuit breakers to gateway', 'Alert on pool usage > 80%', 'Canary deploys for all services', 'ORM upgrade review process'] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'Downtime', size: 2, metadata: { value: '20 min', trend: 'down' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'Users Affected', size: 2, metadata: { value: '2,847', trend: 'down' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 72 }, label: 'Share this walkthrough — skip the 20-page doc.', size: 1.5 },
      ],
    },
  ],
};

// ── 2. Product Managers: Feature Explanation ─────────────────────────
export const PM_SCRIPT = {
  frames: [
    {
      // Frame 1: Center — introduce the engine
      narrationSegment: 'The executive team wants to understand how our new recommendation engine works. Instead of slides, let\'s walk through it visually.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Recommendation Engine', size: 2 },
        { id: 'user1', type: 'User', position: { x: 32, y: 42 }, label: 'Customer', size: 2.5 },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 52, y: 42 }, label: 'Rec Engine', size: 3, highlight: true },
        { id: 'svc1', type: 'Server', position: { x: 72, y: 42 }, label: 'Product Catalog', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user1', targetEntityId: 'nn1', label: 'browses' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'svc1', label: 'matches' },
        { id: 'label1', type: 'Label', position: { x: 52, y: 68 }, label: 'Our AI analyzes browsing patterns to surface the right products at the right time.' },
      ],
    },
    {
      // Frame 2: Left cluster — data signals
      narrationSegment: 'Three data signals feed the engine: browsing history, purchase patterns, and items similar customers liked. Each signal has a weight.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Data Signals', size: 2 },
        { id: 'db1', type: 'Database', position: { x: 28, y: 30 }, label: 'Browse History', size: 2 },
        { id: 'db2', type: 'Database', position: { x: 28, y: 48 }, label: 'Purchase Data', size: 2 },
        { id: 'db3', type: 'Database', position: { x: 28, y: 66 }, label: 'Similar Users', size: 2 },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 55, y: 45 }, label: 'Rec Engine', size: 3, highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'db1', targetEntityId: 'nn1', label: '40%' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'db2', targetEntityId: 'nn1', label: '35%' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'db3', targetEntityId: 'nn1', label: '25%' },
        { id: 'callout1', type: 'Callout', position: { x: 70, y: 45 }, label: 'Weights adjust automatically based on conversion data', size: 1.5 },
      ],
    },
    {
      // Frame 3: Right cluster — scoring pipeline
      narrationSegment: 'The engine scores every product and ranks them. The top 12 populate the "For You" section. Scores refresh every 4 hours.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 55, y: 12 }, label: 'Scoring & Ranking', size: 2 },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 35, y: 42 }, label: 'Rec Engine', size: 2 },
        { id: 'pipe1', type: 'Pipeline', position: { x: 58, y: 35 }, label: 'Ranking Pipeline', size: 3, highlight: true, metadata: { stages: ['Score', 'Rank', 'Filter', 'Serve'] } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'pipe1', label: 'candidates' },
        { id: 'metric1', type: 'Metric', position: { x: 50, y: 62 }, label: 'Refresh Rate', size: 2, metadata: { value: '4 hrs', trend: 'stable' } },
        { id: 'metric2', type: 'Metric', position: { x: 70, y: 62 }, label: 'Products Scored', size: 2, metadata: { value: '50K', trend: 'up' } },
      ],
    },
    {
      // Frame 4: Center — business impact metrics
      narrationSegment: 'Impact so far: conversion rate up 23%, average order value up 18%. The engine pays for itself within the first month.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Business Impact', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 32, y: 32 }, label: 'Conversion Rate', size: 2.5, highlight: true, metadata: { value: '+23%', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 52, y: 32 }, label: 'Avg Order Value', size: 2.5, metadata: { value: '+18%', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 72, y: 32 }, label: 'Revenue Lift', size: 2.5, metadata: { value: '$1.2M', trend: 'up' } },
        { id: 'bar1', type: 'BarChart', position: { x: 50, y: 58 }, label: 'Monthly Revenue', size: 3, metadata: { bars: [{ label: 'Jan', value: 80 }, { label: 'Feb', value: 92 }, { label: 'Mar', value: 110 }, { label: 'Apr', value: 135 }, { label: 'May', value: 148 }] } },
      ],
    },
    {
      // Frame 5: Left cluster — roadmap
      narrationSegment: 'Next quarter: real-time scoring, cross-sell in checkout, and email personalization. Share this walkthrough with the board.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Q3 Roadmap', size: 2 },
        { id: 'step1', type: 'StepList', position: { x: 38, y: 42 }, label: 'Upcoming Features', size: 3, highlight: true, metadata: { steps: ['Real-time scoring (sub-second)', 'Cross-sell in checkout flow', 'Email personalization engine', 'A/B testing framework'] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'Target CVR', size: 2, metadata: { value: '+35%', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'Target AOV', size: 2, metadata: { value: '+25%', trend: 'up' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 72 }, label: '30 seconds to align the board — not 30 minutes.', size: 1.5 },
      ],
    },
  ],
};

// ── 3. Consultants & Strategists: Market Analysis ───────────────────
export const CONSULTANT_SCRIPT = {
  frames: [
    {
      // Frame 1: Center-left — market overview
      narrationSegment: 'Your client wants to enter the European EV charging market. AI researched the landscape — here\'s the visual walkthrough.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 48, y: 12 }, label: 'EV Charging Market Entry', size: 2 },
        { id: 'pie1', type: 'PieChart', position: { x: 38, y: 42 }, label: 'Market Share', size: 3, highlight: true, metadata: { slices: [{ label: 'ChargePoint', value: 28 }, { label: 'Tesla', value: 22 }, { label: 'ABB', value: 18 }, { label: 'Others', value: 32 }] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'Market Size', size: 2.5, metadata: { value: '$18.2B', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'CAGR', size: 2.5, metadata: { value: '29.1%', trend: 'up' } },
        { id: 'label1', type: 'Label', position: { x: 50, y: 72 }, label: 'Fragmented market with 32% held by smaller players — significant entry opportunity.' },
      ],
    },
    {
      // Frame 2: Center — competitive matrix
      narrationSegment: 'Competitive landscape: three tiers of players. Tier 1 has brand but slow expansion. Tier 2 has tech but no distribution. The gap is in urban fast-charging.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Competitive Landscape', size: 2 },
        { id: 'tbl1', type: 'Table', position: { x: 50, y: 40 }, label: 'Competitor Matrix', size: 3.5, highlight: true, metadata: { headers: ['Player', 'Strengths', 'Gap'], rows: [['ChargePoint', 'Network size', 'Speed'], ['Tesla', 'Brand loyalty', 'Non-Tesla access'], ['ABB', 'Hardware', 'Software UX']] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 70 }, label: 'Opportunity: urban fast-charging with superior UX', size: 1.5 },
      ],
    },
    {
      // Frame 3: Right cluster — strategy
      narrationSegment: 'Recommended strategy: partner with urban real estate, deploy 150kW fast chargers, and differentiate on app experience and wait-time prediction.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 52, y: 12 }, label: 'Recommended Strategy', size: 2 },
        { id: 'pipe1', type: 'Pipeline', position: { x: 52, y: 28 }, label: 'Go-to-Market Phases', size: 3, highlight: true, metadata: { stages: ['Partner', 'Deploy', 'Differentiate', 'Scale'] } },
        { id: 'step1', type: 'StepList', position: { x: 35, y: 58 }, label: 'Phase 1: Partner', size: 2.5, metadata: { steps: ['Urban RE partnerships', 'Mall & garage deals', '3 pilot cities'] } },
        { id: 'step2', type: 'StepList', position: { x: 68, y: 58 }, label: 'Phase 2: Deploy', size: 2.5, metadata: { steps: ['150kW fast chargers', 'Mobile-first UX', 'Wait-time prediction'] } },
      ],
    },
    {
      // Frame 4: Left cluster — financials
      narrationSegment: 'Financial projections: breakeven in 18 months with 200 stations. Year 3 revenue projected at 42 million euros.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Financial Projections', size: 2 },
        { id: 'bar1', type: 'BarChart', position: { x: 40, y: 42 }, label: 'Revenue Forecast (€M)', size: 3.5, highlight: true, metadata: { bars: [{ label: 'Y1', value: 8 }, { label: 'Y2', value: 22 }, { label: 'Y3', value: 42 }, { label: 'Y4', value: 68 }, { label: 'Y5', value: 95 }] } },
        { id: 'metric1', type: 'Metric', position: { x: 70, y: 28 }, label: 'Breakeven', size: 2, metadata: { value: '18 mo', trend: 'down' } },
        { id: 'metric2', type: 'Metric', position: { x: 70, y: 48 }, label: 'IRR', size: 2, metadata: { value: '34%', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 70, y: 68 }, label: 'Stations Needed', size: 2, metadata: { value: '200', trend: 'stable' } },
      ],
    },
    {
      // Frame 5: Center — risks
      narrationSegment: 'Key risks: regulatory fragmentation, grid capacity, and competition from automaker networks. Mitigations mapped to each.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Risks & Mitigations', size: 2 },
        { id: 'tbl1', type: 'Table', position: { x: 50, y: 38 }, label: 'Risk Matrix', size: 3.5, highlight: true, metadata: { headers: ['Risk', 'Impact', 'Mitigation'], rows: [['Regulatory', 'High', 'Multi-country legal team'], ['Grid capacity', 'Medium', 'Battery buffer systems'], ['Competition', 'Medium', 'UX moat + speed']] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 70 }, label: 'Share this analysis — your client watches a 2-minute walkthrough, not a 40-page deck.', size: 1.5 },
      ],
    },
  ],
};

// ── 4. Financial Advisors & Legal: Portfolio Review ──────────────────
export const FINANCE_SCRIPT = {
  frames: [
    {
      // Frame 1: Center-left — portfolio overview
      narrationSegment: 'Your client wants to understand their current portfolio allocation. Instead of a spreadsheet, walk them through it visually.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 48, y: 12 }, label: 'Portfolio Review — Q1 2026', size: 2 },
        { id: 'pie1', type: 'PieChart', position: { x: 38, y: 42 }, label: 'Current Allocation', size: 3.5, highlight: true, metadata: { slices: [{ label: 'US Equities', value: 42 }, { label: 'Int\'l Equities', value: 18 }, { label: 'Fixed Income', value: 25 }, { label: 'Alternatives', value: 10 }, { label: 'Cash', value: 5 }] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'Total Value', size: 2.5, metadata: { value: '$2.4M', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'YTD Return', size: 2.5, metadata: { value: '+8.3%', trend: 'up' } },
        { id: 'label1', type: 'Label', position: { x: 50, y: 72 }, label: 'Portfolio is equity-heavy at 60% — above target allocation of 55%.' },
      ],
    },
    {
      // Frame 2: Center — performance chart
      narrationSegment: 'Performance by asset class: US equities drove most of the gains, but international markets underperformed. Fixed income provided stability.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Performance Breakdown', size: 2 },
        { id: 'bar1', type: 'BarChart', position: { x: 50, y: 40 }, label: 'YTD Returns by Class', size: 3.5, highlight: true, metadata: { bars: [{ label: 'US Eq', value: 14 }, { label: 'Int\'l Eq', value: 3 }, { label: 'Fixed Inc', value: 5 }, { label: 'Alts', value: 9 }, { label: 'Cash', value: 2 }] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 68 }, label: 'US equities up 14% — but concentration risk is growing', size: 1.5 },
      ],
    },
    {
      // Frame 3: Wide — risk metrics + table
      narrationSegment: 'Risk analysis: the portfolio\'s Sharpe ratio is 1.2, but drawdown risk is elevated. We recommend rebalancing toward the target mix.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Risk Analysis', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 30, y: 32 }, label: 'Sharpe Ratio', size: 2.5, highlight: true, metadata: { value: '1.2', trend: 'stable' } },
        { id: 'metric2', type: 'Metric', position: { x: 50, y: 32 }, label: 'Max Drawdown', size: 2.5, metadata: { value: '-12%', trend: 'down' } },
        { id: 'metric3', type: 'Metric', position: { x: 70, y: 32 }, label: 'Volatility', size: 2.5, metadata: { value: '14.2%', trend: 'up' } },
        { id: 'tbl1', type: 'Table', position: { x: 50, y: 58 }, label: 'Current vs Target', size: 3, metadata: { headers: ['Class', 'Current', 'Target'], rows: [['US Equities', '42%', '35%'], ['Int\'l Equities', '18%', '20%'], ['Fixed Income', '25%', '30%'], ['Alternatives', '10%', '10%']] } },
      ],
    },
    {
      // Frame 4: Left cluster — rebalancing plan
      narrationSegment: 'Rebalancing plan: trim US equities by 7%, add to fixed income and international. This reduces drawdown risk while maintaining growth exposure.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Rebalancing Plan', size: 2 },
        { id: 'step1', type: 'StepList', position: { x: 38, y: 42 }, label: 'Proposed Trades', size: 3, highlight: true, metadata: { steps: ['Sell $168K US equities (42% → 35%)', 'Buy $48K international equities (18% → 20%)', 'Buy $120K investment-grade bonds (25% → 30%)', 'Maintain alternatives at 10%'] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'New Sharpe', size: 2, metadata: { value: '1.35', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'New Drawdown', size: 2, metadata: { value: '-8%', trend: 'up' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 72 }, label: 'Better risk-adjusted returns with lower max drawdown', size: 1.3 },
      ],
    },
    {
      // Frame 5: Center — client summary
      narrationSegment: 'Your client sees the full picture in 2 minutes — allocation, performance, risk, and next steps. No jargon, no spreadsheets.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 48, y: 12 }, label: 'Client-Ready Summary', size: 2 },
        { id: 'pie1', type: 'PieChart', position: { x: 35, y: 42 }, label: 'New Allocation', size: 3, metadata: { slices: [{ label: 'US Equities', value: 35 }, { label: 'Int\'l Equities', value: 20 }, { label: 'Fixed Income', value: 30 }, { label: 'Alternatives', value: 10 }, { label: 'Cash', value: 5 }] } },
        { id: 'metric1', type: 'Metric', position: { x: 62, y: 28 }, label: 'Portfolio Value', size: 2, highlight: true, metadata: { value: '$2.4M', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 62, y: 46 }, label: 'Projected Return', size: 2, metadata: { value: '+9.1%', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 62, y: 64 }, label: 'Risk Score', size: 2, metadata: { value: 'Moderate', trend: 'stable' } },
        { id: 'callout1', type: 'Callout', position: { x: 48, y: 80 }, label: 'Your clients watch and understand — no finance degree required.', size: 1.3 },
      ],
    },
  ],
};

/**
 * Showcase items config — one per persona, matching the "Who It's For" section.
 */
export const SHOWCASE_ITEMS = [
  {
    script: ENGINEER_SCRIPT,
    label: 'Engineers & SRE',
    description: 'Your system went down at 2 AM. Instead of a 20-page postmortem doc, watch a 2-minute visual walkthrough of the incident — root cause, cascade, resolution, and action items.',
  },
  {
    script: PM_SCRIPT,
    label: 'Product Managers',
    description: 'The board wants to understand the recommendation engine. Instead of 1,500 words and a slide deck, share an animated walkthrough — 30 seconds to full alignment.',
  },
  {
    script: CONSULTANT_SCRIPT,
    label: 'Consultants & Strategists',
    description: 'Your AI researched the EV charging market. Now turn that analysis into a client-ready visual presentation — market sizing, competitive landscape, and financial projections.',
  },
  {
    script: FINANCE_SCRIPT,
    label: 'Financial Advisors & Legal',
    description: 'Walk your client through their portfolio — allocation, performance, risk, and rebalancing plan. They see the full picture in 2 minutes, no spreadsheets needed.',
  },
];
