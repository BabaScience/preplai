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

  // Main script (5 frames) — Why Preplai exists (told from the agent's perspective)
  'morning/0': 'Your AI agents already run your work. They research, monitor, analyze, and report — around the clock, while you sleep. They went from experiments to real workflows for millions of teams.',
  'morning/1': 'But here\'s the problem: every time they finish a job, they hand you a wall of text. Two thousand words. Markdown reports, JSON blobs. They do 45 minutes of brilliant work — and you skim it for 5 seconds and forget it.',
  'morning/2': 'Preplai changes that. Now your agents report to you visually — animated, narrated walkthroughs you can actually watch. You retain 95% of what you see. Only 10% of what you read. This is how they were meant to communicate.',
  'morning/3': 'Here\'s your morning brief. Your agent tracked revenue overnight — up 12%. Flagged a churn spike in enterprise. Spotted three trends. Instead of a 6-page report, you watch this 90-second walkthrough over coffee.',
  'morning/4': 'Your agents do the work. You watch the results. Preplai — the visual layer for AI agents. Don\'t read it. Just watch it.',

  // Engineer script (5 frames) — Agent-generated incident report (agent's perspective)
  'engineer/0': 'I detected a production outage at 2:14 AM and generated this incident report. Your API Gateway started returning 503 errors. Latency spiked to 12 seconds. Here\'s what happened.',
  'engineer/1': 'I traced the root cause: a deploy at 2:12 AM introduced a database connection leak in the auth service. The connection pool was exhausted in just 2 minutes.',
  'engineer/2': 'I mapped the cascade: auth failures caused the gateway to retry, amplifying load 4 times across all downstream services. There was no circuit breaker in place.',
  'engineer/3': 'Your team rolled back the deploy at 2:31 AM. Connection pool recovered. Full service restored by 2:34 AM. Total downtime: 20 minutes.',
  'engineer/4': 'I recommend four follow-ups: add circuit breakers, set pool usage alerts, enable canary deploys, and review the ORM upgrade. Share this link — skip the 20-page postmortem.',

  // Founder script (5 frames) — Competitor research agent report (agent's perspective)
  'founder/0': 'I analyzed 5 competitors overnight — their pricing, features, market position, and 2,400 customer reviews. Here\'s your visual report.',
  'founder/1': 'I mapped each competitor\'s strengths and gaps. Two clear patterns: everyone has strong onboarding, but nobody solves the reporting problem. That\'s your opening.',
  'founder/2': 'Pricing analysis: the market clusters around two price points. There\'s white space at the mid-tier — higher value than free tools, lower friction than enterprise.',
  'founder/3': 'I parsed 2,400 customer reviews. Top complaint across all competitors: outputs are static and hard to share. Users want visual, shareable results — exactly your thesis.',
  'founder/4': 'My recommendation: enter at $25 per month, lead with the visual output moat, target teams already using AI agents. Full report — watched in 90 seconds, not read in 40 pages.',

  // Product script (5 frames) — Weekly growth digest (agent's perspective)
  'product/0': 'I compiled this week\'s growth digest. Key metrics, experiment results, and user behavior patterns — all in one visual report for the team.',
  'product/1': 'This week\'s acquisition funnel: 8,200 visitors, 1,847 signups, 1,145 activated. The drop-off between signup and activation is your biggest leak — 38% lost.',
  'product/2': 'Two experiments completed this week. The new onboarding flow increased activation by 15% with 97% confidence. The pricing page test was inconclusive — not enough traffic yet.',
  'product/3': 'Feature adoption update: the new dashboard launched 2 weeks ago and is already used by 45% of active users. Export feature is underperforming at 12% — worth investigating.',
  'product/4': 'My growth recommendations: ship the new onboarding, investigate export adoption, and plan an enterprise push based on dashboard traction. Your whole team watches this in 90 seconds.',
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
  // Main (Why Preplai Exists) — trigger words match narration text
  'morning/0': { nn1: 'Agents AI', bot1: 'Research', bot2: 'Monitor', bot3: 'Analyze', bot4: 'Report' },
  'morning/1': { bot1: 'Brilliant Agent', doc1: 'Text Wall Words', user1: 'Skim You', metric1: 'Minutes Work', metric2: 'Seconds Attention', metric3: 'Forget Retention' },
  'morning/2': { bot1: 'Agents', preplai: 'Preplai Visually', user1: 'Watch You', metric1: 'Retain Visual See', metric2: 'Read Text' },
  'morning/3': { metric1: 'Revenue Tracked', metric2: 'Users', metric3: 'Uptime', bar1: 'Trends Overnight', step1: 'Action Items Report', alert1: 'Churn Spike' },
  'morning/4': { h2: 'Watch Results', bot1: 'Agents', bot2: 'Work', bot3: 'Visual', bot4: 'Layer', monitor1: 'Preplai' },
  // Engineer — trigger words match agent-perspective narration
  'engineer/0': { h1: 'Incident Report', gw: 'API Gateway', alert1: '503 Errors', metric1: 'Latency Spiked', timeline1: 'Outage Timeline' },
  'engineer/1': { h1: 'Root Cause', deploy1: 'Deploy', db1: 'Database Connection', metric1: 'Pool Exhausted', svc1: 'Auth Service' },
  'engineer/2': { gw: 'Gateway Retry', svc1: 'Auth Failures', svc2: 'Orders Downstream', svc3: 'Payments Services', cb1: 'Circuit Breaker' },
  'engineer/3': { rb1: 'Rollback Rolled', svc1: 'Auth Service', db1: 'Connection Pool', metric1: 'Downtime Minutes' },
  'engineer/4': { step1: 'Recommend Follow', metric1: 'Circuit Breakers', metric2: 'Canary Deploys' },
  // Founder — trigger words match agent-perspective narration
  'founder/0': { metric1: 'Competitors Analyzed', metric2: 'Pricing Features', metric3: 'Reviews Customer', pie1: 'Market Position' },
  'founder/1': { tbl1: 'Strengths Gaps Onboarding Reporting' },
  'founder/2': { bar1: 'Pricing Price Points', metric1: 'White Space Mid' },
  'founder/3': { tbl1: 'Complaints Static Share Visual' },
  'founder/4': { step1: 'Recommendation Enter Lead Target', metric1: 'Month Dollar', metric2: 'Teams Agents' },
  // Product — trigger words match agent-perspective narration
  'product/0': { metric1: 'WAU Metrics', metric2: 'Signups', metric3: 'Activation', metric4: 'Churn', bar1: 'Weekly Active Users' },
  'product/1': { pipe1: 'Funnel Acquisition', metric1: 'Visitors Signup', metric2: 'Activation Drop' },
  'product/2': { tbl1: 'Experiments Onboarding Pricing Test' },
  'product/3': { bar1: 'Feature Adoption Usage', metric1: 'Dashboard', metric2: 'Export Underperforming' },
  'product/4': { step1: 'Recommendations Ship Investigate Enterprise', metric1: 'Onboarding', metric2: 'Traction' },
};

function generateStringMatchCues(wordTimestamps, entityMap) {
  if (!wordTimestamps?.length || !entityMap) return [];

  // Build lookup: normalized label word → entity ID
  const wordToId = new Map();
  // Also build prefix lookup for stem matching (first 4+ chars)
  const prefixToId = new Map();

  for (const [id, label] of Object.entries(entityMap)) {
    const normalized = label.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    // Add full label → id
    wordToId.set(normalized, id);
    // Add individual words (3+ chars) → id, plus prefix stems (4+ chars)
    for (const word of normalized.split(/\s+/)) {
      if (word.length >= 3) {
        wordToId.set(word, id);
      }
      // Add prefix stem (first 4 chars) for fuzzy matching
      // e.g., "monitor" and "monitoring" both have prefix "moni"
      if (word.length >= 4) {
        const prefix = word.slice(0, Math.min(word.length, 5));
        if (!prefixToId.has(prefix)) {
          prefixToId.set(prefix, id);
        }
      }
    }
  }

  const cues = [];
  const lastCueTime = new Map(); // entityId → last cue time

  for (const wt of wordTimestamps) {
    const normalized = wt.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length < 3) continue;

    // Try exact match first, then prefix match
    let matchedId = wordToId.get(normalized);
    if (!matchedId && normalized.length >= 4) {
      const prefix = normalized.slice(0, Math.min(normalized.length, 5));
      matchedId = prefixToId.get(prefix);
    }
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
