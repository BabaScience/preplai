#!/usr/bin/env npx tsx
/**
 * Golden Dataset Eval Runner — Multi-Model
 *
 * Evaluates LLM-generated visual scripts against quality baselines.
 * Supports multiple LLM providers (Anthropic, OpenAI).
 *
 * Usage:
 *   pnpm run eval:golden                                    # Run with claude-sonnet (default)
 *   pnpm run eval:golden -- --model gpt-4o                  # Run with GPT-4o
 *   pnpm run eval:golden -- --model all                     # Run all models, compare
 *   pnpm run eval:golden -- --update                        # Update baselines
 *   pnpm run eval:golden -- --prompt cs-binary-search       # Run single prompt
 *   pnpm run eval:golden -- --category cs-student           # Run one category
 *   pnpm run eval:golden -- --judge                         # Enable LLM-as-judge scoring
 *   pnpm run eval:golden -- --judge --judge-model gpt-4o    # Use GPT-4o as judge
 *   pnpm run eval:golden -- --model gpt-4o --prompt cs-binary-search
 *
 * Environment:
 *   ANTHROPIC_API_KEY  — required for claude-* models
 *   OPENAI_API_KEY     — required for gpt-* models
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { scoreVisualScript } from '../../packages/mcp-server/dist/quality-scorer.js';
import { judgeVisualScript, combineScores } from '../../packages/mcp-server/dist/llm-judge.js';
import type { LlmJudgeReport } from '../../packages/mcp-server/dist/llm-judge.js';

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
  model: string;
  quality: QualityReport;
  passed: boolean;
  regressions: string[];
  entityTypesFound: string[];
  missingExpectedTypes: string[];
  frameCount: number;
  judgeReport?: LlmJudgeReport;
  combinedScore?: number;
  error?: string;
}

// ── LLM Provider abstraction ─────────────────────────────────────────

type LLMProvider = (systemPrompt: string, userPrompt: string) => Promise<string>;

function createAnthropicProvider(model: string): LLMProvider {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable required for Anthropic models');
  }
  const client = new Anthropic();
  return async (systemPrompt, userPrompt) => {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text : '';
  };
}

function createOpenAIProvider(model: string): LLMProvider {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable required for OpenAI models');
  }
  const client = new OpenAI();
  return async (systemPrompt, userPrompt) => {
    const response = await client.chat.completions.create({
      model,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  };
}

// ── Model registry ───────────────────────────────────────────────────

interface ModelConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  displayName: string;
}

const MODELS: Record<string, ModelConfig> = {
  'claude-sonnet': {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
    displayName: 'Claude Sonnet',
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
    displayName: 'GPT-4o',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
  },
};

function createProvider(config: ModelConfig): LLMProvider {
  switch (config.provider) {
    case 'anthropic':
      return createAnthropicProvider(config.model);
    case 'openai':
      return createOpenAIProvider(config.model);
    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
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

import { diagnoseJsonError, formatDiagnosticConsole } from '../../packages/mcp-server/src/json-diagnostic.js';

function parseVisualScript(text: string): any {
  const trimmed = text.trim();
  const stripped = trimmed
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped);
  } catch (err) {
    // Try extracting just the JSON object
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerErr) {
        const diagnostic = diagnoseJsonError(match[0], innerErr);
        throw new Error(
          `Malformed JSON in visual script.\n${formatDiagnosticConsole(diagnostic)}`
        );
      }
    }

    const diagnostic = diagnoseJsonError(stripped, err);
    throw new Error(
      `Could not parse JSON from LLM response.\n${formatDiagnosticConsole(diagnostic)}`
    );
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

// ── Baselines (per model) ────────────────────────────────────────────

function baselinesDir(modelKey: string): string {
  return path.join(BASELINES_DIR, modelKey);
}

function loadBaseline(modelKey: string, promptId: string): Baseline | null {
  const filePath = path.join(baselinesDir(modelKey), `${promptId}.json`);
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function saveBaseline(modelKey: string, promptId: string, report: QualityReport): void {
  const dir = baselinesDir(modelKey);
  fs.mkdirSync(dir, { recursive: true });
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
    path.join(dir, `${promptId}.json`),
    JSON.stringify(baseline, null, 2) + '\n',
  );
}

// ── Detect regressions against baseline ──────────────────────────────

const REGRESSION_THRESHOLD = 5;

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
  provider: LLMProvider,
  modelKey: string,
  prompt: GoldenPrompt,
  updateBaselines: boolean,
  judgeProvider?: LLMProvider,
  judgeModelName?: string,
): Promise<EvalResult> {
  try {
    const text = await provider(SYSTEM_PROMPT, prompt.prompt);
    const compact = parseVisualScript(text);
    const script = expandCompactScript(compact);

    const report = scoreVisualScript(script) as QualityReport;
    const entityTypes = extractEntityTypes(script);
    const missingTypes = prompt.expectedEntityTypes.filter(
      (t) => !entityTypes.includes(t),
    );

    const baseline = loadBaseline(modelKey, prompt.id);
    const regressions = baseline ? detectRegressions(report, baseline) : [];

    // ── LLM Judge (optional) ──────────────────────────────────────
    let judgeReport: LlmJudgeReport | undefined;
    let combinedScore: number | undefined;

    if (judgeProvider && judgeModelName) {
      try {
        judgeReport = await judgeVisualScript({
          prompt: prompt.prompt,
          visualScript: script,
          provider: judgeProvider,
          model: judgeModelName,
        });
        combinedScore = combineScores(report.overall, judgeReport.overall);
      } catch (judgeErr: any) {
        console.log(`\n      ⚠️  Judge failed: ${judgeErr.message}`);
      }
    }

    const passed =
      report.overall >= prompt.minQuality &&
      report.frameCount >= prompt.minFrames &&
      regressions.length === 0;

    if (updateBaselines) {
      saveBaseline(modelKey, prompt.id, report);
    }

    return {
      promptId: prompt.id,
      category: prompt.category,
      model: modelKey,
      quality: report,
      passed,
      regressions,
      entityTypesFound: entityTypes,
      missingExpectedTypes: missingTypes,
      frameCount: report.frameCount,
      judgeReport,
      combinedScore,
    };
  } catch (err: any) {
    return {
      promptId: prompt.id,
      category: prompt.category,
      model: modelKey,
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

// ── Run eval for a single model ──────────────────────────────────────

interface ModelSummary {
  modelKey: string;
  displayName: string;
  results: EvalResult[];
  passed: number;
  failed: number;
  avgQuality: number;
  avgJudge?: number;
  avgCombined?: number;
}

async function evalModel(
  modelKey: string,
  config: ModelConfig,
  filteredPrompts: GoldenPrompt[],
  updateBaselines: boolean,
  judgeProvider?: LLMProvider,
  judgeModelName?: string,
): Promise<ModelSummary> {
  let provider: LLMProvider;
  try {
    provider = createProvider(config);
  } catch (err: any) {
    console.log(`\n  ⚠️  Skipping ${config.displayName}: ${err.message}\n`);
    return {
      modelKey,
      displayName: config.displayName,
      results: [],
      passed: 0,
      failed: 0,
      avgQuality: 0,
    };
  }

  console.log(`\n  ── ${config.displayName} (${modelKey}) ──\n`);

  const results: EvalResult[] = [];
  let passed = 0;
  let failed = 0;

  for (const prompt of filteredPrompts) {
    process.stdout.write(`  ⏳ ${prompt.id.padEnd(30)}`);
    const result = await evalPrompt(provider, modelKey, prompt, updateBaselines, judgeProvider, judgeModelName);
    results.push(result);

    const judgeStr = result.judgeReport
      ? `  judge=${result.judgeReport.overall}/10  combined=${result.combinedScore}/100`
      : '';

    if (result.error) {
      console.log(`❌ ERROR: ${result.error}`);
      failed++;
    } else if (result.passed) {
      console.log(`✅ ${result.quality.overall}/100  (${result.frameCount} frames, ${result.quality.totalEntities} entities)${judgeStr}`);
      passed++;
    } else {
      console.log(`❌ ${result.quality.overall}/100  min=${prompt.minQuality}${judgeStr}`);
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

  const avgQuality = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.quality.overall, 0) / results.length)
    : 0;

  // Judge averages (only if any results have judge reports)
  const judgedResults = results.filter((r) => r.judgeReport);
  const avgJudge = judgedResults.length > 0
    ? Number((judgedResults.reduce((s, r) => s + r.judgeReport!.overall, 0) / judgedResults.length).toFixed(1))
    : undefined;
  const avgCombined = judgedResults.length > 0
    ? Math.round(judgedResults.reduce((s, r) => s + (r.combinedScore ?? 0), 0) / judgedResults.length)
    : undefined;

  return { modelKey, displayName: config.displayName, results, passed, failed, avgQuality, avgJudge, avgCombined };
}

// ── CLI ──────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const updateBaselines = args.includes('--update') || args.includes('--update-baselines');
  const useJudge = args.includes('--judge');
  const singlePrompt = args.find((_, i) => args[i - 1] === '--prompt');
  const categoryFilter = args.find((_, i) => args[i - 1] === '--category');
  const modelFlag = args.find((_, i) => args[i - 1] === '--model') ?? 'claude-sonnet';
  const judgeModelFlag = args.find((_, i) => args[i - 1] === '--judge-model') ?? 'claude-sonnet';

  // Determine which models to run
  let modelKeys: string[];
  if (modelFlag === 'all') {
    modelKeys = Object.keys(MODELS);
  } else if (MODELS[modelFlag]) {
    modelKeys = [modelFlag];
  } else {
    console.error(`❌ Unknown model: "${modelFlag}". Available: ${Object.keys(MODELS).join(', ')}, all`);
    process.exit(1);
  }

  // Create judge provider if --judge flag is set
  let judgeProvider: LLMProvider | undefined;
  let judgeModelName: string | undefined;

  if (useJudge) {
    const judgeConfig = MODELS[judgeModelFlag];
    if (!judgeConfig) {
      console.error(`❌ Unknown judge model: "${judgeModelFlag}". Available: ${Object.keys(MODELS).join(', ')}`);
      process.exit(1);
    }
    try {
      judgeProvider = createProvider(judgeConfig);
      judgeModelName = judgeConfig.model;
      console.log(`\n  🧑‍⚖️  LLM Judge enabled: ${judgeConfig.displayName}`);
    } catch (err: any) {
      console.error(`❌ Could not create judge provider: ${err.message}`);
      process.exit(1);
    }
  }

  // Filter prompts
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
  console.log(`  Models: ${modelKeys.join(', ')}  |  Prompts: ${filteredPrompts.length}  |  Update baselines: ${updateBaselines}  |  Judge: ${useJudge ? judgeModelFlag : 'off'}`);

  // Run eval for each model
  const summaries: ModelSummary[] = [];
  for (const modelKey of modelKeys) {
    const summary = await evalModel(modelKey, MODELS[modelKey], filteredPrompts, updateBaselines, judgeProvider, judgeModelName);
    summaries.push(summary);
  }

  // ── Category breakdown (per model) ────────────────────────────────

  for (const summary of summaries) {
    if (summary.results.length === 0) continue;

    console.log(`\n═══════════════════════════════════════════════════════════`);
    console.log(`  CATEGORY BREAKDOWN — ${summary.displayName}`);
    console.log(`═══════════════════════════════════════════════════════════\n`);

    const categories = [...new Set(summary.results.map((r) => r.category))];
    for (const cat of categories) {
      const catResults = summary.results.filter((r) => r.category === cat);
      const catPassed = catResults.filter((r) => r.passed).length;
      const avgQuality = Math.round(
        catResults.reduce((s, r) => s + r.quality.overall, 0) / catResults.length,
      );
      const icon = catPassed === catResults.length ? '✅' : '⚠️';
      console.log(`  ${icon} ${cat.padEnd(20)} ${catPassed}/${catResults.length} passed  avg=${avgQuality}/100`);
    }
  }

  // ── Multi-model comparison table ──────────────────────────────────

  if (summaries.length > 1) {
    const hasJudge = summaries.some((s) => s.avgJudge !== undefined);
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  MODEL COMPARISON');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (hasJudge) {
      console.log(`  ${'MODEL'.padEnd(20)} ${'PASSED'.padEnd(10)} ${'HEURISTIC'.padEnd(12)} ${'JUDGE'.padEnd(10)} ${'COMBINED'.padEnd(12)} STATUS`);
      console.log(`  ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(12)} ${'─'.repeat(10)} ${'─'.repeat(12)} ${'─'.repeat(8)}`);
      for (const s of summaries) {
        if (s.results.length === 0) {
          console.log(`  ${s.displayName.padEnd(20)} ${'skipped'.padEnd(10)} ${'—'.padEnd(12)} ${'—'.padEnd(10)} ${'—'.padEnd(12)} ⚠️`);
        } else {
          const passStr = `${s.passed}/${s.results.length}`;
          const heuristicStr = `${s.avgQuality}/100`;
          const judgeStr = s.avgJudge !== undefined ? `${s.avgJudge}/10` : '—';
          const combinedStr = s.avgCombined !== undefined ? `${s.avgCombined}/100` : '—';
          const icon = s.failed === 0 ? '✅' : '❌';
          console.log(`  ${s.displayName.padEnd(20)} ${passStr.padEnd(10)} ${heuristicStr.padEnd(12)} ${judgeStr.padEnd(10)} ${combinedStr.padEnd(12)} ${icon}`);
        }
      }
    } else {
      console.log(`  ${'MODEL'.padEnd(20)} ${'PASSED'.padEnd(10)} ${'AVG SCORE'.padEnd(12)} STATUS`);
      console.log(`  ${'─'.repeat(20)} ${'─'.repeat(10)} ${'─'.repeat(12)} ${'─'.repeat(8)}`);
      for (const s of summaries) {
        if (s.results.length === 0) {
          console.log(`  ${s.displayName.padEnd(20)} ${'skipped'.padEnd(10)} ${'—'.padEnd(12)} ⚠️`);
        } else {
          const passStr = `${s.passed}/${s.results.length}`;
          const scoreStr = `${s.avgQuality}/100`;
          const icon = s.failed === 0 ? '✅' : '❌';
          console.log(`  ${s.displayName.padEnd(20)} ${passStr.padEnd(10)} ${scoreStr.padEnd(12)} ${icon}`);
        }
      }
    }
  }

  // ── Overall summary ───────────────────────────────────────────────

  const totalPassed = summaries.reduce((s, m) => s + m.passed, 0);
  const totalResults = summaries.reduce((s, m) => s + m.results.length, 0);
  const totalFailed = summaries.reduce((s, m) => s + m.failed, 0);

  // ── Judge dimension breakdown (if enabled) ──────────────────────
  if (useJudge) {
    for (const summary of summaries) {
      const judged = summary.results.filter((r) => r.judgeReport);
      if (judged.length === 0) continue;

      console.log(`\n═══════════════════════════════════════════════════════════`);
      console.log(`  LLM JUDGE BREAKDOWN — ${summary.displayName}`);
      console.log(`═══════════════════════════════════════════════════════════\n`);

      const avgCA = (judged.reduce((s, r) => s + r.judgeReport!.contentAccuracy.score, 0) / judged.length).toFixed(1);
      const avgCo = (judged.reduce((s, r) => s + r.judgeReport!.coherence.score, 0) / judged.length).toFixed(1);
      const avgEA = (judged.reduce((s, r) => s + r.judgeReport!.entityAppropriateness.score, 0) / judged.length).toFixed(1);

      console.log(`  Content Accuracy:        ${avgCA}/10`);
      console.log(`  Coherence:               ${avgCo}/10`);
      console.log(`  Entity Appropriateness:  ${avgEA}/10`);
      console.log(`  Overall Judge:           ${summary.avgJudge}/10`);
      console.log(`  Combined (H40+J60):      ${summary.avgCombined}/100`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  OVERALL');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`  Passed: ${totalPassed}/${totalResults}`);
  console.log(`  Failed: ${totalFailed}/${totalResults}`);

  if (updateBaselines) {
    console.log(`\n  📝 Baselines updated in ${BASELINES_DIR}`);
  }

  console.log('');

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
