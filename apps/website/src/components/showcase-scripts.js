/**
 * showcase-scripts.js — Demo VisualScripts for the four persona showcases.
 *
 * Each script has 5 frames x 5s = ~25s loop.
 * Personas: Universal (Morning Brief), Engineers, Founders, Product & Growth.
 *
 * Entity positions are clustered per frame (~40-60% canvas width) to enable
 * cinematic camera pans/zooms between frames via SceneController viewBox animation.
 * No hardcoded colors — entities inherit from the active palette.
 */

// ── 1. Main: Why Preplai Exists ──────────────────────────────────────
// The brand story showcase — tells the origin of Preplai in 5 frames.
// Arc: agents took over → output is broken → Preplai is the visual layer → demo → payoff
export const MAIN_SCRIPT = {
  frames: [
    {
      // Frame 1: The agent revolution
      narrationSegment: 'AI agents have taken over. In the last few months, they went from experiments to running real work — researching, monitoring, analyzing, and reporting — around the clock, for millions of teams.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'The Agent Revolution', size: 2 },
        { id: 'bot1', type: 'Composable', position: { x: 22, y: 35 }, label: 'Research Agent', size: 2.2, metadata: { shape: 'hexagon', icon: 'search' } },
        { id: 'bot2', type: 'Composable', position: { x: 40, y: 35 }, label: 'Monitoring Agent', size: 2.2, metadata: { shape: 'hexagon', icon: 'activity' } },
        { id: 'bot3', type: 'Composable', position: { x: 58, y: 35 }, label: 'Analytics Agent', size: 2.2, metadata: { shape: 'hexagon', icon: 'bar-chart' } },
        { id: 'bot4', type: 'Composable', position: { x: 76, y: 35 }, label: 'Support Agent', size: 2.2, metadata: { shape: 'hexagon', icon: 'message-circle' } },
        { id: 'metric1', type: 'Metric', position: { x: 30, y: 62 }, label: 'AI Agent Market', size: 2.5, highlight: true, metadata: { value: '$10.9B', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 55, y: 62 }, label: 'MCP Downloads', size: 2.5, metadata: { value: '97M/mo', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 78, y: 62 }, label: 'Enterprise Adoption', size: 2.5, metadata: { value: '72%', trend: 'up' } },
      ],
    },
    {
      // Frame 2: The output problem
      narrationSegment: 'But here\'s the problem: every agent dumps its results as a wall of text. Markdown reports, JSON blobs, Slack messages. Your agent does 45 minutes of brilliant work — then you skim the output for 5 seconds and forget it.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'The Output Problem', size: 2 },
        { id: 'bot1', type: 'Composable', position: { x: 25, y: 38 }, label: 'AI Agent', size: 2.5, highlight: true, metadata: { shape: 'hexagon', icon: 'bot' } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'bot1', targetEntityId: 'doc1', label: '2,000 words' },
        { id: 'doc1', type: 'Composable', position: { x: 50, y: 38 }, label: 'Text Report', size: 2.5, metadata: { shape: 'rectangle', icon: 'file-text' } },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'doc1', targetEntityId: 'user1', label: '5 sec skim', style: 'dashed' },
        { id: 'user1', type: 'User', position: { x: 75, y: 38 }, label: 'You', size: 2.5 },
        { id: 'metric1', type: 'Metric', position: { x: 30, y: 65 }, label: 'Agent Work', size: 2, metadata: { value: '45 min', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 50, y: 65 }, label: 'Your Attention', size: 2, metadata: { value: '5 sec', trend: 'down' } },
        { id: 'metric3', type: 'Metric', position: { x: 70, y: 65 }, label: 'Text Retention', size: 2, metadata: { value: '10%', trend: 'down' } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 82 }, label: 'The bottleneck isn\'t intelligence — it\'s the output format.', size: 1.5 },
      ],
    },
    {
      // Frame 3: Preplai is the visual layer
      narrationSegment: 'Preplai is the visual layer for AI agents. Instead of text, your agents report to you visually — animated, narrated, cinematic walkthroughs you can actually watch. We retain 95% from visuals. Only 10% from text.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 10 }, label: 'The Visual Layer for AI Agents', size: 2 },
        { id: 'bot1', type: 'Composable', position: { x: 20, y: 38 }, label: 'AI Agent', size: 2.5, metadata: { shape: 'hexagon', icon: 'bot' } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'bot1', targetEntityId: 'preplai', label: 'MCP' },
        { id: 'preplai', type: 'Composable', position: { x: 48, y: 38 }, label: 'Preplai', size: 3, highlight: true, metadata: { shape: 'diamond', icon: 'play' } },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'preplai', targetEntityId: 'user1', label: 'visual report' },
        { id: 'user1', type: 'User', position: { x: 78, y: 38 }, label: 'You', size: 2.5 },
        { id: 'metric1', type: 'Metric', position: { x: 35, y: 65 }, label: 'Visual Retention', size: 2.5, metadata: { value: '95%', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 65, y: 65 }, label: 'Text Retention', size: 2.5, metadata: { value: '10%', trend: 'down' } },
        { id: 'label1', type: 'Label', position: { x: 50, y: 82 }, label: 'Your agents do the work. You watch the results.' },
      ],
    },
    {
      // Frame 4: What this looks like — real agent visual report
      narrationSegment: 'This is what it looks like. Your agent ran overnight — tracked revenue, flagged issues, spotted trends. Instead of reading a 6-page report, you watch this 90-second visual walkthrough over coffee.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 10 }, label: 'Your Agent\'s Visual Report', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 25, y: 30 }, label: 'Revenue', size: 2.5, highlight: true, metadata: { value: '$47.2K', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 50, y: 30 }, label: 'Users', size: 2.5, metadata: { value: '12,841', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 75, y: 30 }, label: 'Uptime', size: 2.5, metadata: { value: '99.97%', trend: 'stable' } },
        { id: 'bar1', type: 'BarChart', position: { x: 35, y: 55 }, label: 'Revenue Trend', size: 2.5, metadata: { bars: [{ label: 'Mon', value: 38 }, { label: 'Tue', value: 41 }, { label: 'Wed', value: 44 }, { label: 'Thu', value: 39 }, { label: 'Fri', value: 52 }, { label: 'Sat', value: 45 }, { label: 'Sun', value: 47 }] } },
        { id: 'step1', type: 'StepList', position: { x: 70, y: 55 }, label: 'Action Items', size: 2.2, metadata: { steps: ['Fix enterprise churn', 'Expand mobile test', 'Review competitor report'] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 80 }, label: '90 seconds over coffee. Full picture. Zero reading.', size: 1.3 },
      ],
    },
    {
      // Frame 5: The payoff — don't read it, watch it
      narrationSegment: 'Preplai — the visual layer for AI agents. Your agents do the work. You watch the results. Don\'t read it. Just watch it.',
      entities: [
        { id: 'h1', type: 'H1', position: { x: 50, y: 20 }, label: 'Don\'t read it.', size: 2.5 },
        { id: 'h2', type: 'H1', position: { x: 50, y: 38 }, label: 'Just watch it.', size: 3, highlight: true },
        { id: 'bot1', type: 'Composable', position: { x: 25, y: 62 }, label: 'Research', size: 1.8, metadata: { shape: 'hexagon', icon: 'search' } },
        { id: 'bot2', type: 'Composable', position: { x: 40, y: 62 }, label: 'Monitoring', size: 1.8, metadata: { shape: 'hexagon', icon: 'activity' } },
        { id: 'bot3', type: 'Composable', position: { x: 55, y: 62 }, label: 'Analytics', size: 1.8, metadata: { shape: 'hexagon', icon: 'bar-chart' } },
        { id: 'bot4', type: 'Composable', position: { x: 70, y: 62 }, label: 'Support', size: 1.8, metadata: { shape: 'hexagon', icon: 'message-circle' } },
        { id: 'label1', type: 'Label', position: { x: 48, y: 80 }, label: 'The visual layer for AI agents — preplai.com' },
      ],
    },
  ],
};

// ── 2. Software Engineers: Incident Postmortem ────────────────────────
// Agent-generated incident report — the agent analyzed the outage, not you.
export const ENGINEER_SCRIPT = {
  frames: [
    {
      // Frame 1: Center cluster — zoom into the incident
      narrationSegment: 'Your monitoring agent detected a production outage at 2:14 AM and auto-generated this incident report. API Gateway returning 503s, latency spiked to 12 seconds.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Incident Report — Auto-generated', size: 2 },
        { id: 'gw', type: 'APIGateway', position: { x: 50, y: 38 }, label: 'API Gateway', size: 2.5, highlight: true },
        { id: 'alert1', type: 'Alert', position: { x: 70, y: 32 }, label: '503 Errors', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 30, y: 32 }, label: 'Latency', size: 2, metadata: { value: '12.3s', trend: 'up' } },
        { id: 'timeline1', type: 'Timeline', position: { x: 50, y: 62 }, label: 'Incident Timeline', size: 2.5, metadata: { events: ['2:14 AM — 503s begin', '2:15 AM — PagerDuty fires', '2:18 AM — Team responds'] } },
      ],
    },
    {
      // Frame 2: Right cluster — pan to root cause
      narrationSegment: 'The agent traced the root cause: a deploy at 2:12 AM introduced a database connection leak in the auth service. Connection pool exhausted in 2 minutes.',
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
      narrationSegment: 'The agent mapped the cascade: auth failures caused the gateway to retry, amplifying load 4x across all downstream services. No circuit breaker in place.',
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
      narrationSegment: 'Resolution: team rolled back the deploy at 2:31 AM. Connection pool recovered. Full service restored by 2:34 AM. Total downtime: 20 minutes.',
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
      narrationSegment: 'The agent recommends four follow-ups: circuit breakers, pool alerts, canary deploys, and an ORM review. Share this link — skip the 20-page postmortem doc.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Action Items', size: 2 },
        { id: 'step1', type: 'StepList', position: { x: 38, y: 42 }, label: 'Agent Recommendations', size: 3, highlight: true, metadata: { steps: ['Add circuit breakers to gateway', 'Alert on pool usage > 80%', 'Canary deploys for all services', 'ORM upgrade review process'] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'Downtime', size: 2, metadata: { value: '20 min', trend: 'down' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'Users Affected', size: 2, metadata: { value: '2,847', trend: 'down' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 72 }, label: 'Agent-generated. 2 minutes to watch. Skip the 20-page doc.', size: 1.5 },
      ],
    },
  ],
};

// ── 3. Founders & Business Owners: Competitor Research ────────────────
// AI research agent finished analyzing the market — visual report for the founder.
export const FOUNDER_SCRIPT = {
  frames: [
    {
      // Frame 1: Center — agent completed research
      narrationSegment: 'Your research agent analyzed 5 competitors overnight — pricing, features, market position, and customer reviews. Here\'s the visual report.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Competitor Research — Agent Report', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 28, y: 32 }, label: 'Competitors', size: 2.5, metadata: { value: '5', trend: 'stable' } },
        { id: 'metric2', type: 'Metric', position: { x: 50, y: 32 }, label: 'Sources Analyzed', size: 2.5, highlight: true, metadata: { value: '127', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 72, y: 32 }, label: 'Reviews Parsed', size: 2.5, metadata: { value: '2,400+', trend: 'up' } },
        { id: 'pie1', type: 'PieChart', position: { x: 40, y: 58 }, label: 'Market Share', size: 2.8, metadata: { slices: [{ label: 'Leader A', value: 32 }, { label: 'Leader B', value: 24 }, { label: 'Growing C', value: 18 }, { label: 'Others', value: 26 }] } },
        { id: 'label1', type: 'Label', position: { x: 68, y: 58 }, label: '26% of market held by fragmented players — entry window is open.' },
      ],
    },
    {
      // Frame 2: Center — competitive matrix
      narrationSegment: 'The agent mapped each competitor\'s strengths and gaps. Two clear patterns: everyone has strong onboarding, but nobody solves the reporting problem. That\'s your opening.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Competitive Matrix', size: 2 },
        { id: 'tbl1', type: 'Table', position: { x: 50, y: 40 }, label: 'Feature Comparison', size: 3.5, highlight: true, metadata: { headers: ['Competitor', 'Strength', 'Weakness'], rows: [['Leader A', 'Market reach', 'Slow innovation'], ['Leader B', 'UX & design', 'Enterprise gaps'], ['Growing C', 'AI features', 'Small team'], ['Niche D', 'Pricing', 'Limited features'], ['Startup E', 'Speed', 'No brand']] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 72 }, label: 'Gap: none solve reporting and visual output — your differentiator', size: 1.5 },
      ],
    },
    {
      // Frame 3: Right cluster — pricing landscape
      narrationSegment: 'Pricing analysis: the market clusters around two price points. There\'s white space at the mid-tier — higher value than the free tools, lower friction than the enterprise ones.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 55, y: 12 }, label: 'Pricing Landscape', size: 2 },
        { id: 'bar1', type: 'BarChart', position: { x: 48, y: 40 }, label: 'Monthly Pricing ($)', size: 3.5, highlight: true, metadata: { bars: [{ label: 'Free tier', value: 0 }, { label: 'Leader A', value: 49 }, { label: 'Leader B', value: 29 }, { label: 'Growing C', value: 19 }, { label: 'Niche D', value: 12 }] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 68 }, label: 'White space: $20–35/mo mid-tier with AI-native features', size: 1.5 },
        { id: 'metric1', type: 'Metric', position: { x: 75, y: 40 }, label: 'Avg Price', size: 2, metadata: { value: '$27/mo', trend: 'stable' } },
      ],
    },
    {
      // Frame 4: Left cluster — customer sentiment
      narrationSegment: 'The agent parsed 2,400 customer reviews. Top complaint across all competitors: outputs are static and hard to share. Users want visual, shareable results — exactly your thesis.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Customer Sentiment', size: 2 },
        { id: 'tbl1', type: 'Table', position: { x: 45, y: 38 }, label: 'Top Complaints (All Competitors)', size: 3.5, highlight: true, metadata: { headers: ['Complaint', 'Mentions', 'Severity'], rows: [['Static output', '480+', 'High'], ['Hard to share', '320+', 'High'], ['No narration', '210+', 'Medium'], ['Slow rendering', '190+', 'Medium']] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 70 }, label: 'Validates the thesis: users want visual, shareable, narrated output', size: 1.5 },
      ],
    },
    {
      // Frame 5: Center — agent's strategic recommendation
      narrationSegment: 'The agent\'s recommendation: enter at $25/month, lead with the visual output moat, target teams already using AI agents. Full report — watched in 90 seconds, not read in 40 pages.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Agent Recommendation', size: 2 },
        { id: 'step1', type: 'StepList', position: { x: 38, y: 40 }, label: 'Strategic Moves', size: 3, highlight: true, metadata: { steps: ['Enter at $25/mo — mid-tier white space', 'Lead with visual + narration moat', 'Target AI-heavy teams first (dev, product)', 'Build MCP integration for agent distribution'] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 28 }, label: 'TAM', size: 2, metadata: { value: '$4.5B', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 48 }, label: 'Entry Window', size: 2, metadata: { value: '12-18 mo', trend: 'down' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 70 }, label: 'Your agent did the research. You watched the results. Share this link with your co-founder.', size: 1.3 },
      ],
    },
  ],
};

// ── 4. Product & Growth: Weekly Growth Digest ────────────────────────
// Analytics agent's weekly report on metrics, experiments, and user behavior.
export const PRODUCT_SCRIPT = {
  frames: [
    {
      // Frame 1: Center — weekly metrics overview
      narrationSegment: 'Your analytics agent compiled this week\'s growth digest. Key metrics, experiment results, and user behavior patterns — all in one visual report.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Weekly Growth Digest', size: 2 },
        { id: 'metric1', type: 'Metric', position: { x: 25, y: 32 }, label: 'WAU', size: 2.5, highlight: true, metadata: { value: '34,200', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 43, y: 32 }, label: 'Signups', size: 2.5, metadata: { value: '1,847', trend: 'up' } },
        { id: 'metric3', type: 'Metric', position: { x: 60, y: 32 }, label: 'Activation', size: 2.5, metadata: { value: '62%', trend: 'up' } },
        { id: 'metric4', type: 'Metric', position: { x: 77, y: 32 }, label: 'Churn', size: 2.5, metadata: { value: '3.1%', trend: 'down' } },
        { id: 'bar1', type: 'BarChart', position: { x: 50, y: 58 }, label: 'Weekly Active Users (8 weeks)', size: 3, metadata: { bars: [{ label: 'W1', value: 24 }, { label: 'W2', value: 26 }, { label: 'W3', value: 27 }, { label: 'W4', value: 29 }, { label: 'W5', value: 28 }, { label: 'W6', value: 31 }, { label: 'W7', value: 32 }, { label: 'W8', value: 34 }] } },
      ],
    },
    {
      // Frame 2: Right cluster — acquisition funnel
      narrationSegment: 'Acquisition funnel this week: 8,200 visitors, 1,847 signups, 1,145 activated. The drop-off between signup and activation is the biggest leak — 38% lost.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 55, y: 12 }, label: 'Acquisition Funnel', size: 2 },
        { id: 'pipe1', type: 'Pipeline', position: { x: 52, y: 30 }, label: 'This Week\'s Funnel', size: 3, highlight: true, metadata: { stages: ['Visit (8,200)', 'Signup (1,847)', 'Activate (1,145)', 'Retain (987)'] } },
        { id: 'metric1', type: 'Metric', position: { x: 35, y: 58 }, label: 'Visit → Signup', size: 2, metadata: { value: '22.5%', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 55, y: 58 }, label: 'Signup → Active', size: 2, metadata: { value: '62%', trend: 'stable' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 75 }, label: 'Biggest leak: 38% drop between signup and activation', size: 1.5 },
      ],
    },
    {
      // Frame 3: Left cluster — experiment results
      narrationSegment: 'Two experiments completed this week. The new onboarding flow increased activation by 15%. The pricing page test was inconclusive — not enough traffic yet.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 45, y: 12 }, label: 'Experiment Results', size: 2 },
        { id: 'tbl1', type: 'Table', position: { x: 45, y: 38 }, label: 'A/B Tests This Week', size: 3.5, highlight: true, metadata: { headers: ['Experiment', 'Result', 'Confidence'], rows: [['New onboarding flow', '+15% activation', '97%'], ['Pricing page layout', '+3% conversion', '68%'], ['Email sequence v2', '+22% open rate', '95%']] } },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 68 }, label: 'Ship the onboarding flow. Keep running the pricing test.', size: 1.5 },
      ],
    },
    {
      // Frame 4: Center — feature adoption
      narrationSegment: 'Feature adoption: the new dashboard launched 2 weeks ago and is already used by 45% of active users. Export feature underperforming at 12% — worth investigating.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 50, y: 12 }, label: 'Feature Adoption', size: 2 },
        { id: 'bar1', type: 'BarChart', position: { x: 50, y: 40 }, label: 'Feature Usage (% of Active Users)', size: 3.5, highlight: true, metadata: { bars: [{ label: 'Search', value: 82 }, { label: 'Dashboard', value: 45 }, { label: 'Collab', value: 38 }, { label: 'API', value: 24 }, { label: 'Export', value: 12 }] } },
        { id: 'metric1', type: 'Metric', position: { x: 30, y: 68 }, label: 'Dashboard (new)', size: 2, metadata: { value: '45%', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 70, y: 68 }, label: 'Export', size: 2, metadata: { value: '12%', trend: 'down' } },
      ],
    },
    {
      // Frame 5: Center — agent's growth recommendations
      narrationSegment: 'The agent\'s growth recommendations: ship the new onboarding, investigate export adoption, and plan an enterprise push based on dashboard traction. Shared in 90 seconds.',
      entities: [
        { id: 'h1', type: 'H2', position: { x: 48, y: 12 }, label: 'Growth Recommendations', size: 2 },
        { id: 'step1', type: 'StepList', position: { x: 38, y: 42 }, label: 'This Week\'s Priorities', size: 3, highlight: true, metadata: { steps: ['Ship new onboarding flow (+15% activation, 97% confidence)', 'Investigate export feature — 12% adoption is below target', 'Plan enterprise push — dashboard adoption signals demand', 'Continue pricing page test — need 2 more weeks of traffic'] } },
        { id: 'metric1', type: 'Metric', position: { x: 68, y: 30 }, label: 'Projected WAU', size: 2, metadata: { value: '38K', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 68, y: 52 }, label: 'Target Activation', size: 2, metadata: { value: '70%', trend: 'up' } },
        { id: 'callout1', type: 'Callout', position: { x: 55, y: 72 }, label: 'Agent-generated. Your whole growth team watches this in 90 seconds.', size: 1.3 },
      ],
    },
  ],
};

/**
 * Showcase items config — ordered for maximum impact.
 * First item is the universal hook that every AI user relates to.
 */
export const SHOWCASE_ITEMS = [
  {
    script: MAIN_SCRIPT,
    label: 'Why Preplai Exists',
    description: 'AI agents have taken over — but their output is unreadable. Preplai is the visual layer: your agents report to you visually, not in walls of text. Watch, don\'t read.',
  },
  {
    script: ENGINEER_SCRIPT,
    label: 'Software Engineers',
    description: 'Your monitoring agent detected and analyzed a production outage. Instead of writing a 20-page postmortem, it generated a visual incident report — root cause, cascade, resolution.',
  },
  {
    script: FOUNDER_SCRIPT,
    label: 'Founders & Operators',
    description: 'Your research agent analyzed 5 competitors and 2,400 reviews overnight. Instead of a 40-page text dump, get a visual report — market gaps, pricing, and a strategic recommendation.',
  },
  {
    script: PRODUCT_SCRIPT,
    label: 'Product & Growth',
    description: 'Your analytics agent compiled this week\'s growth digest — funnel metrics, experiment results, feature adoption. The whole team watches it in 90 seconds, not reads it in 30 minutes.',
  },
];
