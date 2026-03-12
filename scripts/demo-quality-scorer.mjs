#!/usr/bin/env node
/**
 * Demo: Quality Scorer in action — scores 3 presentations of different quality.
 * Run: node scripts/demo-quality-scorer.mjs
 */
import { scoreVisualScript } from '../packages/mcp-server/dist/quality-scorer.js';

function printReport(title, script) {
  const report = scoreVisualScript(script);
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ${title}`);
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Overall Score:  ${report.overall}/100`);
  console.log(`  Frames: ${report.frameCount}  |  Total Entities: ${report.totalEntities}\n`);
  console.log('  Dimensions:');
  for (const [name, dim] of Object.entries(report.dimensions)) {
    const filled = Math.round(dim.score / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    console.log(`    ${name.padEnd(22)} ${bar} ${String(dim.score).padStart(3)}/100`);
    console.log(`      └─ ${dim.details}`);
  }
  return report;
}

// ═══════════════════════════════════════════════════════════════════════
// 1. GOOD: API Architecture with caching — follows all best practices
// ═══════════════════════════════════════════════════════════════════════
const good = printReport('GOOD: API Architecture with Caching (3 frames)', {
  sceneId: 'demo-good', totalDuration: 15000,
  frames: [
    {
      id: 'f1', startTime: 0, endTime: 5000, description: 'Initial',
      narrationSegment: 'The API server queries PostgreSQL directly. Each request adds 50ms latency.',
      entities: [
        { id: 'h1', type: 'H1', position: { x: 50, y: 6 }, label: 'API Architecture' },
        { id: 'srv', type: 'Server', position: { x: 25, y: 45 }, label: 'API Server' },
        { id: 'db', type: 'Database', position: { x: 50, y: 45 }, label: 'PostgreSQL', highlight: true },
        { id: 'user', type: 'User', position: { x: 25, y: 20 }, label: 'Client' },
        { id: 'queue', type: 'Queue', position: { x: 75, y: 45 }, label: 'Job Queue' },
        { id: 'a1', type: 'Arrow', position: { x: 37, y: 45 }, sourceEntityId: 'srv', targetEntityId: 'db' },
        { id: 'l1', type: 'Label', position: { x: 50, y: 85 }, label: 'Direct DB access' },
      ],
    },
    {
      id: 'f2', startTime: 5000, endTime: 10000, description: 'Add cache',
      narrationSegment: 'Adding Redis as a caching layer. Frequently accessed data is served in under 1ms.',
      entities: [
        { id: 'h1', type: 'H1', position: { x: 50, y: 6 }, label: 'API Architecture' },
        { id: 'srv', type: 'Server', position: { x: 20, y: 45 }, label: 'API Server' },
        { id: 'cache', type: 'Cache', position: { x: 45, y: 45 }, label: 'Redis', highlight: true },
        { id: 'db', type: 'Database', position: { x: 70, y: 45 }, label: 'PostgreSQL' },
        { id: 'user', type: 'User', position: { x: 20, y: 20 }, label: 'Client' },
        { id: 'queue', type: 'Queue', position: { x: 70, y: 20 }, label: 'Job Queue' },
        { id: 'a1', type: 'Arrow', position: { x: 32, y: 45 }, sourceEntityId: 'srv', targetEntityId: 'cache' },
        { id: 'a2', type: 'Arrow', position: { x: 57, y: 45 }, sourceEntityId: 'cache', targetEntityId: 'db' },
        { id: 'l1', type: 'Label', position: { x: 50, y: 85 }, label: 'Cache reduces load 90%' },
      ],
    },
    {
      id: 'f3', startTime: 10000, endTime: 15000, description: 'Monitoring',
      narrationSegment: 'The complete system includes Prometheus monitoring tracking cache hit rates and response times.',
      entities: [
        { id: 'h1', type: 'H1', position: { x: 50, y: 6 }, label: 'API Architecture' },
        { id: 'srv', type: 'Server', position: { x: 20, y: 45 }, label: 'API Server' },
        { id: 'cache', type: 'Cache', position: { x: 45, y: 45 }, label: 'Redis' },
        { id: 'db', type: 'Database', position: { x: 70, y: 45 }, label: 'PostgreSQL' },
        { id: 'user', type: 'User', position: { x: 20, y: 20 }, label: 'Client' },
        { id: 'monitor', type: 'Monitor', position: { x: 70, y: 20 }, label: 'Prometheus', highlight: true },
        { id: 'a1', type: 'Arrow', position: { x: 32, y: 45 }, sourceEntityId: 'srv', targetEntityId: 'cache' },
        { id: 'a2', type: 'Arrow', position: { x: 57, y: 45 }, sourceEntityId: 'cache', targetEntityId: 'db' },
        { id: 'l1', type: 'Label', position: { x: 50, y: 85 }, label: 'Full observability' },
      ],
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════
// 2. BAD: sparse → overcrowded, no narration, no persistence, corner-clustered
// ═══════════════════════════════════════════════════════════════════════
const bad = printReport('BAD: Sparse → Overcrowded, No Narration, Corner-Clustered', {
  sceneId: 'demo-bad', totalDuration: 10000,
  frames: [
    {
      id: 'f1', startTime: 0, endTime: 5000, description: 'Sparse',
      narrationSegment: '',
      entities: [
        { id: 'x', type: 'Server', position: { x: 5, y: 5 }, label: 'Lonely Server' },
      ],
    },
    {
      id: 'f2', startTime: 5000, endTime: 10000, description: 'Overcrowded',
      narrationSegment: '   ',
      entities: [
        { id: 'a', type: 'User', position: { x: 10, y: 10 } },
        { id: 'b', type: 'Database', position: { x: 11, y: 10 } },
        { id: 'c', type: 'Cache', position: { x: 12, y: 10 } },
        { id: 'd', type: 'Server', position: { x: 13, y: 10 } },
        { id: 'e', type: 'Cloud', position: { x: 14, y: 10 } },
        { id: 'f', type: 'Queue', position: { x: 15, y: 10 } },
        { id: 'g', type: 'Monitor', position: { x: 16, y: 10 } },
        { id: 'h', type: 'Lambda', position: { x: 17, y: 10 } },
        { id: 'i', type: 'Network', position: { x: 18, y: 10 } },
        { id: 'j', type: 'Firewall', position: { x: 19, y: 10 } },
        { id: 'k', type: 'Container', position: { x: 20, y: 10 } },
        { id: 'l', type: 'Pod', position: { x: 21, y: 10 } },
      ],
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════
// 3. MEDIOCRE: good layout + narration, but zero entity persistence
// ═══════════════════════════════════════════════════════════════════════
const med = printReport('MEDIOCRE: Good Layout, Zero Entity Persistence', {
  sceneId: 'demo-med', totalDuration: 10000,
  frames: [
    {
      id: 'f1', startTime: 0, endTime: 5000, description: 'Auth',
      narrationSegment: 'Here we see the login flow with OAuth tokens and TLS certificates.',
      entities: [
        { id: 'auth', type: 'AuthFlow', position: { x: 30, y: 40 }, label: 'OAuth 2.0' },
        { id: 'token', type: 'Token', position: { x: 50, y: 40 }, label: 'JWT' },
        { id: 'user', type: 'User', position: { x: 70, y: 40 }, label: 'User' },
        { id: 'cert', type: 'Certificate', position: { x: 50, y: 70 }, label: 'TLS Cert' },
      ],
    },
    {
      id: 'f2', startTime: 5000, endTime: 10000, description: 'Data',
      narrationSegment: 'Now the data flows through the ETL pipeline into S3 storage via Kafka.',
      entities: [
        { id: 'pipe', type: 'Pipeline', position: { x: 25, y: 50 }, label: 'ETL Pipeline' },
        { id: 'stream', type: 'Stream', position: { x: 50, y: 50 }, label: 'Kafka' },
        { id: 'bucket', type: 'StorageBucket', position: { x: 75, y: 50 }, label: 'S3 Bucket' },
        { id: 'schema', type: 'Schema', position: { x: 50, y: 25 }, label: 'Data Schema' },
        { id: 'monitor', type: 'Monitor', position: { x: 50, y: 75 }, label: 'Datadog' },
      ],
    },
  ],
});

// ═══════════════════════════════════════════════════════════════════════
// Summary comparison
// ═══════════════════════════════════════════════════════════════════════
console.log('\n\n═══════════════════════════════════════════════════════════');
console.log('  COMPARISON SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`  Good presentation:     ${good.overall}/100  ✅`);
console.log(`  Mediocre presentation: ${med.overall}/100  ⚠️`);
console.log(`  Bad presentation:      ${bad.overall}/100  ❌\n`);
