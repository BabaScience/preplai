#!/usr/bin/env node
/**
 * generate-showcase-audio.mjs
 *
 * Pre-generates ElevenLabs TTS audio for all landing page showcase frames.
 * Outputs MP3 files + metadata JSON to public/audio/showcase/.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node apps/website/scripts/generate-showcase-audio.mjs
 *
 * Or with dotenv from the project root:
 *   node --env-file=.env apps/website/scripts/generate-showcase-audio.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/audio/showcase');

// ── ElevenLabs Config ─────────────────────────────────────────────────
const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_SHOWCASE_VOICE_ID || 'tMvyQtpCVQ0DkixuYm6J';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';

if (!API_KEY) {
  console.error('Error: ELEVENLABS_API_KEY environment variable is required');
  process.exit(1);
}

// ── All narration segments (hero + 4 showcase scripts) ────────────────
// Key format: "scriptName/frameIndex" → narration text
const NARRATIONS = {
  // Hero player (5 frames)
  'hero/0': 'Every great outcome starts with an idea. You ask your AI to turn it into something people can see.',
  'hero/1': 'Your AI researches, analyzes, and structures the information — building a clear narrative from complex data.',
  'hero/2': 'Preplai transforms AI output into animated visuals — charts, diagrams, flows, and metrics — narrated frame by frame.',
  'hero/3': 'The result: a cinematic walkthrough anyone can watch — your team, your client, your board. No slides, no jargon.',
  'hero/4': "From idea to impact — in 2 minutes. Don't read it. Just watch it.",

  // Engineer script (5 frames)
  'engineer/0': 'At 2:14 AM, the API Gateway starts returning 503 errors. Latency spikes from 45ms to 12 seconds. PagerDuty fires.',
  'engineer/1': 'Root cause: a deploy at 2:12 AM introduced a database connection leak. The connection pool exhausted within 2 minutes.',
  'engineer/2': 'The connection leak cascaded downstream. Auth failures caused the gateway to retry, amplifying load 4x across all services.',
  'engineer/3': 'Resolution: team rolled back the deploy at 2:31 AM. Connection pool recovered. Full service restored by 2:34 AM.',
  'engineer/4': 'Action items: add circuit breakers, connection pool alerts at 80%, and mandatory canary deploys. Total downtime: 20 minutes.',

  // PM script (5 frames)
  'pm/0': 'The executive team wants to understand how our new recommendation engine works. Instead of slides, let\'s walk through it visually.',
  'pm/1': 'Three data signals feed the engine: browsing history, purchase patterns, and items similar customers liked. Each signal has a weight.',
  'pm/2': 'The engine scores every product and ranks them. The top 12 populate the "For You" section. Scores refresh every 4 hours.',
  'pm/3': 'Impact so far: conversion rate up 23%, average order value up 18%. The engine pays for itself within the first month.',
  'pm/4': 'Next quarter: real-time scoring, cross-sell in checkout, and email personalization. Share this walkthrough with the board.',

  // Consultant script (5 frames)
  'consultant/0': 'The EV charging market is projected to reach $190 billion by 2030. Here\'s the competitive landscape your client needs to understand.',
  'consultant/1': 'Three dominant players control 68% of the market. ChargePoint leads with 31%, followed by Tesla Supercharger at 22% and EVgo at 15%.',
  'consultant/2': 'Our recommended strategy: target underserved suburban corridors where existing coverage is sparse and demand is growing 40% year over year.',
  'consultant/3': 'Revenue projections based on 200 stations: $48M Year 1, scaling to $120M by Year 3 as utilization increases from 15% to 40%.',
  'consultant/4': 'Key risks to monitor: regulatory changes in three states, potential grid capacity constraints, and competitive response from Tesla\'s expansion plan.',

  // Finance script (5 frames)
  'finance/0': 'Portfolio Review for Q1 2026. Total portfolio value: $2.4M across equities, fixed income, alternatives, and cash.',
  'finance/1': 'Current allocation: US equities 42%, international 18%, fixed income 25%, alternatives 10%, cash 5%. Benchmark-aligned with slight US overweight.',
  'finance/2': 'Performance by asset class: US equities drove most of the gains, but international markets underperformed. Fixed income provided stability.',
  'finance/3': 'Risk analysis: Sharpe ratio at 1.2, above benchmark. Maximum drawdown contained to negative 12%. Volatility within target range.',
  'finance/4': 'Rebalancing plan: trim US equities by 7%, add to fixed income and international. This reduces drawdown risk while maintaining growth exposure.',
};

// ── ElevenLabs API Call ───────────────────────────────────────────────

async function generateSpeech(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      output_format: 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown');
    throw new Error(`ElevenLabs API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (!data.audio_base64) {
    throw new Error('ElevenLabs response missing audio_base64');
  }

  const audioBuffer = Buffer.from(data.audio_base64, 'base64');
  const wordTimestamps = aggregateWordTimestamps(data.alignment);
  const duration = computeDuration(data.alignment);

  return { audioBuffer, duration, wordTimestamps };
}

// ── Word Timestamp Aggregation (same as elevenlabs.ts) ────────────────

function aggregateWordTimestamps(alignment) {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;
  if (!characters?.length) return [];

  const words = [];
  let currentWord = '';
  let wordStart = -1;
  let wordEnd = -1;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const isSpace = char === ' ' || char === '\n' || char === '\t';

    if (isSpace) {
      if (currentWord.length > 0) {
        words.push({ word: currentWord, startTime: wordStart, endTime: wordEnd });
        currentWord = '';
        wordStart = -1;
        wordEnd = -1;
      }
    } else {
      if (currentWord.length === 0) {
        wordStart = character_start_times_seconds[i] ?? 0;
      }
      currentWord += char;
      wordEnd = character_end_times_seconds[i] ?? 0;
    }
  }

  if (currentWord.length > 0) {
    words.push({ word: currentWord, startTime: wordStart, endTime: wordEnd });
  }

  return words;
}

function computeDuration(alignment) {
  const endTimes = alignment.character_end_times_seconds;
  if (!endTimes?.length) return 0;
  return endTimes[endTimes.length - 1] ?? 0;
}

// ── Focus Cue Generation (string matching) ────────────────────────────

// Entity ID → label map per script/frame. Focus cues emit entity IDs (not labels)
// so that SceneController.shiftFocus() can match DOM elements by id attribute.
const ENTITY_MAP = {
  // Hero player
  'hero/0': { user1: 'You', idea: 'The Idea', nn1: 'Your AI' },
  'hero/1': { nn1: 'Your AI', pipe1: 'Build the Story', db1: 'Your Data', db2: 'Context' },
  'hero/2': { pipe1: 'Preplai Engine', pie1: 'Market Share', bar1: 'Performance', metric1: 'Impact', timeline1: 'Milestones' },
  'hero/3': { user1: 'Your Team', user2: 'Your Client', user3: 'Your Board', monitor1: 'Preplai Player', metric1: 'Retention', metric2: 'Time Saved' },
  'hero/4': { idea: 'Idea', pipe1: 'From Idea to Impact', monitor1: 'Watch It' },
  // Engineer
  'engineer/0': { h1: 'Incident Postmortem', gw: 'API Gateway', alert1: '503 Errors', metric1: 'Latency', timeline1: 'Incident Timeline' },
  'engineer/1': { h1: 'Root Cause', deploy1: 'Deploy', db1: 'Users DB', metric1: 'Pool', svc1: 'Auth Service' },
  'engineer/2': { gw: 'Gateway', svc1: 'Auth', svc2: 'Orders', svc3: 'Payments', cb1: 'Circuit Breaker' },
  'engineer/3': { rb1: 'Rollback', svc1: 'Auth Service', db1: 'Users DB', metric1: 'MTTR' },
  'engineer/4': { step1: 'Follow-ups', metric1: 'Downtime', metric2: 'Users Affected' },
  // PM
  'pm/0': { user1: 'Customer', nn1: 'Rec Engine', svc1: 'Product Catalog' },
  'pm/1': { db1: 'Browse History', db2: 'Purchase Data', db3: 'Similar Users', nn1: 'Rec Engine' },
  'pm/2': { nn1: 'Rec Engine', pipe1: 'Ranking Pipeline', metric1: 'Refresh Rate', metric2: 'Products Scored' },
  'pm/3': { metric1: 'Conversion Rate', metric2: 'Avg Order Value', metric3: 'Revenue Lift', bar1: 'Monthly Revenue' },
  'pm/4': { step1: 'Upcoming Features', metric1: 'Target CVR', metric2: 'Target AOV' },
  // Consultant
  'consultant/0': { pie1: 'Market Share', metric1: 'Market Size', metric2: 'CAGR' },
  'consultant/1': { tbl1: 'Competitor Matrix' },
  'consultant/2': { pipe1: 'Go-to-Market Phases', step1: 'Phase 1', step2: 'Phase 2' },
  'consultant/3': { bar1: 'Revenue Forecast', metric1: 'Breakeven', metric2: 'IRR', metric3: 'Stations Needed' },
  'consultant/4': { tbl1: 'Risk Matrix' },
  // Finance
  'finance/0': { pie1: 'Current Allocation', metric1: 'Total Value', metric2: 'YTD Return' },
  'finance/1': { bar1: 'YTD Returns by Class' },
  'finance/2': { metric1: 'Sharpe Ratio', metric2: 'Max Drawdown', metric3: 'Volatility', tbl1: 'Current vs Target' },
  'finance/3': { step1: 'Proposed Trades', metric1: 'New Sharpe', metric2: 'New Drawdown' },
  'finance/4': { metric1: 'Portfolio Value', metric2: 'Projected Return', metric3: 'Risk Score', pie1: 'New Allocation' },
};

function generateStringMatchCues(wordTimestamps, entityMap) {
  if (!wordTimestamps?.length || !entityMap) return [];

  // Build lookup: normalized label word → entity ID
  const wordToId = new Map();
  for (const [id, label] of Object.entries(entityMap)) {
    const normalized = label.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    // Add full label → id
    wordToId.set(normalized, id);
    // Add individual words (3+ chars) → id
    for (const word of normalized.split(/\s+/)) {
      if (word.length >= 3) {
        wordToId.set(word, id);
      }
    }
  }

  const cues = [];
  const lastCueTime = new Map(); // entityId → last cue time

  for (const wt of wordTimestamps) {
    const normalized = wt.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length < 3) continue;

    const matchedId = wordToId.get(normalized);
    if (!matchedId) continue;

    // Minimum 2s gap between same entity cues
    const lastTime = lastCueTime.get(matchedId) ?? -10;
    if (wt.startTime - lastTime < 2) continue;

    cues.push({
      time: wt.startTime,
      entityIds: [matchedId],
      confidences: [1.0],
      word: wt.word,
    });
    lastCueTime.set(matchedId, wt.startTime);
  }

  return cues;
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🎙️  Generating ElevenLabs audio for landing page showcases...\n');

  // Ensure output directory exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const metadata = {};
  const keys = Object.keys(NARRATIONS);
  let completed = 0;

  for (const key of keys) {
    const text = NARRATIONS[key];
    const [scriptName, frameIndex] = key.split('/');

    // Create subdirectory
    const scriptDir = path.join(OUT_DIR, scriptName);
    fs.mkdirSync(scriptDir, { recursive: true });

    const mp3Path = path.join(scriptDir, `${frameIndex}.mp3`);

    // Skip if already generated
    if (fs.existsSync(mp3Path)) {
      console.log(`  ⏭️  ${key} — already exists, skipping`);
      // Read existing metadata if available
      if (metadata[key]) continue;
      // Still need metadata, so we'll regenerate
    }

    try {
      console.log(`  🔊 ${key} — generating...`);
      const result = await generateSpeech(text);

      // Write MP3 file
      fs.writeFileSync(mp3Path, result.audioBuffer);

      // Generate focus cues (using entity IDs, not labels)
      const entityMap = ENTITY_MAP[key] || {};
      const focusCues = generateStringMatchCues(result.wordTimestamps, entityMap);

      // Store metadata
      metadata[key] = {
        url: `/audio/showcase/${scriptName}/${frameIndex}.mp3`,
        duration: result.duration,
        focusCues,
        wordTimestamps: result.wordTimestamps,
      };

      completed++;
      console.log(`  ✅ ${key} — ${result.duration.toFixed(1)}s, ${(result.audioBuffer.length / 1024).toFixed(0)}KB, ${focusCues.length} focus cues`);

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error(`  ❌ ${key} — ${err.message}`);
      // Continue with other frames
    }
  }

  // Write metadata JSON
  const metadataPath = path.join(OUT_DIR, 'metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log(`\n✅ Done! Generated ${completed} audio files.`);
  console.log(`📁 Output: ${OUT_DIR}`);
  console.log(`📋 Metadata: ${metadataPath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
