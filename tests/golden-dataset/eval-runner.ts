#!/usr/bin/env npx tsx
/**
 * Golden Dataset Eval Runner
 *
 * Evaluates LLM-generated visual scripts against quality baselines.
 * Requires ANTHROPIC_API_KEY environment variable.
 *
 * Usage:
 *   pnpm run eval:golden                    # Run eval, compare to baselines
 *   pnpm run eval:golden -- --update        # Update baselines with current scores
 *   pnpm run eval:golden -- --prompt cs-binary-search  # Run single prompt
 *   pnpm run eval:golden -- --category cs-student      # Run one category
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import { scoreVisualScript } from '../../packages/mcp-server/dist/quality-scorer.js';

// ── Types ────────────────────────────────────────────────────────────

interface GoldenPrompt {
  id: string;
  category: string;
  prompt: string;
  minQuality: number;
  expectedEntityTypes: string[];
  minFrames: number;
}

interface DimensionScore {
  score: number;
  details: string;
}

interface QualityReport {
  overall: number;
  dimensions: Record<string, DimensionScore>;
  frameCount: number;
  totalEntities: number;
  timestamp: string;
}

interface Baseline {
  overall: number;
  dimensions: Record<string, number>;
  frameCount: number;
  totalEntities: number;
  timestamp: string;
}

interface EvalResult {
  promptId: string;
  category: string;
  quality: QualityReport;
  passed: boolean;
  regressions: string[];
  entityTypesFound: string[];
  missingExpectedTypes: string[];
  frameCount: number;
  error?: string;
}

// ── Paths ────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_PATH = path.join(__dirname, 'prompts.json');
const BASELINES_DIR = path.join(__dirname, 'baselines');
const TOOL_DESC_DIR = path.join(__dirname, '../../packages/mcp-server/src/tool-descriptions');

// ── Load resources ───────────────────────────────────────────────────

const prompts: GoldenPrompt[] = JSON.parse(fs.readFileSync(PROMPTS_PATH, 'utf-8'));
const addSceneDesc = fs.readFileSync(path.join(TOOL_DESC_DIR, 'add-scene.v1.md'), 'utf-8').trim();

// ── Entity type list (subset for the system prompt) ──────────────────

const ENTITY_TYPES = [
  'Server', 'Database', 'Cache', 'User', 'Cloud', 'Service', 'Queue',
  'LoadBalancer', 'Container', 'Pod', 'Lambda', 'Pipeline', 'Monitor',
  'Firewall', 'Network', 'Volume', 'CodeBlock', 'BinaryTree', 'Array',
  'StepList', 'BigO', 'BarChart', 'Graph2D', 'CoordinateSystem',
  'ProcessState', 'CallStack', 'Stack', 'H1', 'H2', 'H3', 'Concept',
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow', 'Label',
  'Metric', 'Comparison', 'HashTable', 'LinkedList', 'Callout',
  'Definition', 'Table', 'Timeline', 'Deployment', 'Build',
  'GitBranch', 'PullRequest', 'Rollback', 'CDN', 'StorageBucket',
  'Alert', 'Trace', 'Dashboard', 'Schema', 'Token', 'AuthFlow',
  'Event', 'Stream', 'Subnet', 'NeuralNetwork', 'FSM', 'RecursionTree',
  'MemoryLayout', 'GanttChart', 'PieChart', 'Histogram', 'BarChart',
  'ErrorState', 'Task', 'Cycle', 'FlowDiagram',
];

// ── System prompt for the LLM ────────────────────────────────────────

const SYSTEM_PROMPT = `You are a visual presentation engine. When given a topic, generate a JSON payload for the add_scene tool.

TOOL DESCRIPTION:
${addSceneDesc}

AVAILABLE ENTITY TYPES: ${ENTITY_TYPES.join(', ')}

INSTRUCTIONS:
- Generate a valid add_scene visual_script JSON object
- Use the COMPACT format with short keys (sid, td, f, e, n, p, l, m, src, tgt)
- Use "eval-session" as the session_id (sid)
- Include 3-5 frames with 5-7 entities each
- Use entity persistence (same id across frames)
- Include narration for every frame
- Respond with ONLY the JSON object, no markdown fences, no explanation

OUTPUT FORMAT: Raw JSON object starting with { and ending with }`;

// ── Parse visual script from LLM response ────────────────────────────

function parseVisualScript(text: string): any {
  // Try direct JSON parse
  const trimmed = text.trim();

  // Strip markdown code fences if present
  const stripped = trimmed
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch {
    // Try to extract JSON object from the text
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Could not parse JSON from LLM response: ${stripped.slice(0, 200)}...`);
  }
}

/**
 * Expand compact short-key format to full VisualScript.
 * The quality scorer expects full key names.
 */
function expandCompactScript(compact: any): any {
  const keyMap: Record<string, string> = {
    sid: 'sceneId', td: 'totalDuration', f: 'frames',
    e: 'entities', n: 'narrationSegment', d: 'description',
    p: 'position', l: 'label', m: 'metadata',
    src: 'sourceEntityId', tgt: 'targetEntityId',
    a: 'animation', sz: 'size', c: 'color',
    hl: 'highlight', tc: 'textContent', par: 'parentEntityId',
    fc: 'focusCues', tr: 'transitions',
  };

  function expandObj(obj: any): any {
    if (Array.isArray(obj)) return obj.map(expandObj);
    if (obj === null || typeof obj !== 'object') return obj;
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      const newKey = keyMap[k] ?? k;
      if (newKey === 'position' && Array.isArray(v) && v.length === 2) {
        result[newKey] = { x: v[0], y: v[1] };
      } else {
        result[newKey] = expandObj(v);
      }
    }
    return result;
  }

  const expanded = expandObj(compact);

  // Ensure frames have required fields
  if (expanded.frames) {
    let time = 0;
    const frameDuration = expanded.totalDuration
      ? Math.floor(expanded.totalDuration / expanded.frames.length)
      : 5000;

    expanded.frames = expanded.frames.map((f: any, i: number) => ({
      id: f.id ?? `f${i + 1}`,
      startTime: f.startTime ?? time,
      endTime: f.endTime ?? (time += frameDuration),
      description: f.description ?? `Frame ${i + 1}`,
      narrationSegment: f.narrationSegment ?? '',
      entities: f.entities ?? [],
      ...f,
    }));
  }

  return expanded;
}

// ── Load baseline for a prompt ───────────────────────────────────────

function loadBaseline(promptId: string): Baseline | null {
  const filePath = path.join(BASELINES_DIR, `${promptId}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function saveBaseline(promptId: string, report: QualityReport): void {
  fs.mkdirSync(BASELINES_DIR, { recursive: true });
  const baseline: Baseline = {
    overall: report.overall,
    dimensions: Object.fromEntries(
      Object.entries(report.dimensions).map(([k, v]) => [k, v.score]),
    ),
    frameCount: report.frameCount,
    totalEntities: report.totalEntities,
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(BASELINES_DIR, `${promptId}.json`),
    JSON.stringify(baseline, null, 2) + '\n',
  );
}

// ── Detect regressions against baseline ──────────────────────────────

const REGRESSION_THRESHOLD = 5; // percent drop that triggers failure

function detectRegressions(report: QualityReport, baseline: Baseline): string[] {
  const regressions: string[] = [];
  if (baseline.overall - report.overall > REGRESSION_THRESHOLD) {
    regressions.push(`overall: ${baseline.overall} → ${report.overall} (−${baseline.overall - report.overall})`);
  }
  for (const [dim, score] of Object.entries(report.dimensions)) {
    const baseScore = baseline.dimensions[dim];
    if (baseScore !== undefined && baseScore - score.score > REGRESSION_THRESHOLD) {
      regressions.push(`${dim}: ${baseScore} → ${score.score} (−${baseScore - score.score})`);
    }
  }
  return regressions;
}

// ── Extract entity types from a script ───────────────────────────────

function extractEntityTypes(script: any): string[] {
  const types = new Set<string>();
  for (const frame of script.frames ?? []) {
    for (const entity of frame.entities ?? []) {
      if (entity.type) types.add(entity.type);
    }
  }
  return [...types];
}

// ── Run eval for a single prompt ─────────────────────────────────────

async function evalPrompt(
  client: Anthropic,
  prompt: GoldenPrompt,
  updateBaselines: boolean,
): Promise<EvalResult> {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt.prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const compact = parseVisualScript(text);
    const script = expandCompactScript(compact);

    const report = scoreVisualScript(script) as QualityReport;
    const entityTypes = extractEntityTypes(script);
    const missingTypes = prompt.expectedEntityTypes.filter(
      (t) => !entityTypes.includes(t),
    );

    const baseline = loadBaseline(prompt.id);
    const regressions = baseline ? detectRegressions(report, baseline) : [];

    const passed =
      report.overall >= prompt.minQuality &&
      report.frameCount >= prompt.minFrames &&
      regressions.length === 0;

    if (updateBaselines) {
      saveBaseline(prompt.id, report);
    }

    return {
      promptId: prompt.id,
      category: prompt.category,
      quality: report,
      passed,
      regressions,
      entityTypesFound: entityTypes,
      missingExpectedTypes: missingTypes,
      frameCount: report.frameCount,
    };
  } catch (err: any) {
    return {
      promptId: prompt.id,
      category: prompt.category,
      quality: { overall: 0, dimensions: {}, frameCount: 0, totalEntities: 0, timestamp: '' } as any,
      passed: false,
      regressions: [],
      entityTypesFound: [],
      missingExpectedTypes: prompt.expectedEntityTypes,
      frameCount: 0,
      error: err.message,
    };
  }
}

// ── CLI ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const updateBaselines = args.includes('--update') || args.includes('--update-baselines');
  const singlePrompt = args.find((_, i) => args[i - 1] === '--prompt');
  const categoryFilter = args.find((_, i) => args[i - 1] === '--category');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY environment variable required');
    process.exit(1);
  }

  const client = new Anthropic();

  let filteredPrompts = prompts;
  if (singlePrompt) {
    filteredPrompts = prompts.filter((p) => p.id === singlePrompt);
    if (filteredPrompts.length === 0) {
      console.error(`❌ Prompt "${singlePrompt}" not found in prompts.json`);
      process.exit(1);
    }
  } else if (categoryFilter) {
    filteredPrompts = prompts.filter((p) => p.category === categoryFilter);
    if (filteredPrompts.length === 0) {
      console.error(`❌ Category "${categoryFilter}" not found`);
      process.exit(1);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Preplai Golden Dataset Evaluation');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Prompts: ${filteredPrompts.length}  |  Update baselines: ${updateBaselines}\n`);

  const results: EvalResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const prompt of filteredPrompts) {
    process.stdout.write(`  ⏳ ${prompt.id.padEnd(30)}`);
    const result = await evalPrompt(client, prompt, updateBaselines);
    results.push(result);

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      failed++;
    } else if (result.passed) {
      console.log(`✅ ${result.quality.overall}/100  (${result.frameCount} frames, ${result.quality.totalEntities} entities)`);
      passed++;
    } else {
      console.log(`❌ ${result.quality.overall}/100  min=${prompt.minQuality}`);
      if (result.regressions.length > 0) {
        for (const r of result.regressions) {
          console.log(`      ↓ regression: ${r}`);
        }
      }
      if (result.quality.overall < prompt.minQuality) {
        console.log(`      ↓ quality below threshold: ${result.quality.overall} < ${prompt.minQuality}`);
      }
      if (result.frameCount < prompt.minFrames) {
        console.log(`      ↓ too few frames: ${result.frameCount} < ${prompt.minFrames}`);
      }
      failed++;
    }
  }

  // ── Summary by category ──────────────────────────────────────────

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  CATEGORY BREAKDOWN');
  console.log('═══════════════════════════════════════════════════════════\n');

  const categories = [...new Set(results.map((r) => r.category))];
  for (const cat of categories) {
    const catResults = results.filter((r) => r.category === cat);
    const catPassed = catResults.filter((r) => r.passed).length;
    const avgQuality = Math.round(
      catResults.reduce((s, r) => s + r.quality.overall, 0) / catResults.length,
    );
    const icon = catPassed === catResults.length ? '✅' : '⚠️';
    console.log(`  ${icon} ${cat.padEnd(20)} ${catPassed}/${catResults.length} passed  avg=${avgQuality}/100`);
  }

  // ── Overall summary ──────────────────────────────────────────────

  const avgOverall = Math.round(
    results.reduce((s, r) => s + r.quality.overall, 0) / results.length,
  );

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  OVERALL');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Passed: ${passed}/${results.length}`);
  console.log(`  Failed: ${failed}/${results.length}`);
  console.log(`  Average quality: ${avgOverall}/100`);

  if (updateBaselines) {
    console.log(`\n  📝 Baselines updated in ${BASELINES_DIR}`);
  }

  console.log('');

  // Exit with error if any failed (for CI)
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
