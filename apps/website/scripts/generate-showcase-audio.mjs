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

  // Main script (5 frames) — Why Preplai exists (brand story)
  'morning/0': 'AI agents have taken over. In the last few months, they went from experiments to running real work — researching, monitoring, analyzing, and reporting — around the clock, for millions of teams.',
  'morning/1': 'But here\'s the problem: every agent dumps its results as a wall of text. Markdown reports, JSON blobs, Slack messages. Your agent does 45 minutes of brilliant work — then you skim the output for 5 seconds and forget it.',
  'morning/2': 'Preplai is the visual layer for AI agents. Instead of text, your agents report to you visually — animated, narrated, cinematic walkthroughs you can actually watch. We retain 95% from visuals. Only 10% from text.',
  'morning/3': 'This is what it looks like. Your agent ran overnight — tracked revenue, flagged issues, spotted trends. Instead of reading a 6-page report, you watch this 90-second visual walkthrough over coffee.',
  'morning/4': 'Preplai — the visual layer for AI agents. Your agents do the work. You watch the results. Don\'t read it. Just watch it.',

  // Engineer script (5 frames) — Agent-generated incident report
  'engineer/0': 'Your monitoring agent detected a production outage at 2:14 AM and auto-generated this incident report. API Gateway returning 503s, latency spiked to 12 seconds.',
  'engineer/1': 'The agent traced the root cause: a deploy at 2:12 AM introduced a database connection leak in the auth service. Connection pool exhausted in 2 minutes.',
  'engineer/2': 'The agent mapped the cascade: auth failures caused the gateway to retry, amplifying load 4x across all downstream services. No circuit breaker in place.',
  'engineer/3': 'Resolution: team rolled back the deploy at 2:31 AM. Connection pool recovered. Full service restored by 2:34 AM. Total downtime: 20 minutes.',
  'engineer/4': 'The agent recommends four follow-ups: circuit breakers, pool alerts, canary deploys, and an ORM review. Share this link — skip the 20-page postmortem doc.',

  // Founder script (5 frames) — Competitor research agent report
  'founder/0': 'Your research agent analyzed 5 competitors overnight — pricing, features, market position, and customer reviews. Here\'s the visual report.',
  'founder/1': 'The agent mapped each competitor\'s strengths and gaps. Two clear patterns: everyone has strong onboarding, but nobody solves the reporting problem. That\'s your opening.',
  'founder/2': 'Pricing analysis: the market clusters around two price points. There\'s white space at the mid-tier — higher value than the free tools, lower friction than the enterprise ones.',
  'founder/3': 'The agent parsed 2,400 customer reviews. Top complaint across all competitors: outputs are static and hard to share. Users want visual, shareable results — exactly your thesis.',
  'founder/4': 'The agent\'s recommendation: enter at $25/month, lead with the visual output moat, target teams already using AI agents. Full report — watched in 90 seconds, not read in 40 pages.',

  // Product script (5 frames) — Weekly growth digest
  'product/0': 'Your analytics agent compiled this week\'s growth digest. Key metrics, experiment results, and user behavior patterns — all in one visual report.',
  'product/1': 'Acquisition funnel this week: 8,200 visitors, 1,847 signups, 1,145 activated. The drop-off between signup and activation is the biggest leak — 38% lost.',
  'product/2': 'Two experiments completed this week. The new onboarding flow increased activation by 15%. The pricing page test was inconclusive — not enough traffic yet.',
  'product/3': 'Feature adoption: the new dashboard launched 2 weeks ago and is already used by 45% of active users. Export feature underperforming at 12% — worth investigating.',
  'product/4': 'The agent\'s growth recommendations: ship the new onboarding, investigate export adoption, and plan an enterprise push based on dashboard traction. Shared in 90 seconds.',
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
  // Main (Why Preplai Exists)
  'morning/0': { bot1: 'Research Agent', bot2: 'Monitoring Agent', bot3: 'Analytics Agent', bot4: 'Support Agent', metric1: 'Agent Market', metric2: 'MCP Downloads', metric3: 'Enterprise Adoption' },
  'morning/1': { bot1: 'Agent', doc1: 'Text Report', user1: 'You', metric1: 'Agent Work', metric2: 'Attention', metric3: 'Retention' },
  'morning/2': { bot1: 'Agent', preplai: 'Preplai', user1: 'You', metric1: 'Visual Retention', metric2: 'Text Retention' },
  'morning/3': { metric1: 'Revenue', metric2: 'Users', metric3: 'Uptime', bar1: 'Revenue Trend', step1: 'Action Items' },
  'morning/4': { h2: 'Watch', bot1: 'Research', bot2: 'Monitoring', bot3: 'Analytics', bot4: 'Support' },
  // Engineer
  'engineer/0': { h1: 'Incident Report', gw: 'API Gateway', alert1: '503 Errors', metric1: 'Latency', timeline1: 'Incident Timeline' },
  'engineer/1': { h1: 'Root Cause', deploy1: 'Deploy', db1: 'Users DB', metric1: 'Pool', svc1: 'Auth Service' },
  'engineer/2': { gw: 'Gateway', svc1: 'Auth', svc2: 'Orders', svc3: 'Payments', cb1: 'Circuit Breaker' },
  'engineer/3': { rb1: 'Rollback', svc1: 'Auth Service', db1: 'Users DB', metric1: 'MTTR' },
  'engineer/4': { step1: 'Recommendations', metric1: 'Downtime', metric2: 'Users Affected' },
  // Founder
  'founder/0': { metric1: 'Competitors', metric2: 'Sources Analyzed', metric3: 'Reviews Parsed', pie1: 'Market Share' },
  'founder/1': { tbl1: 'Feature Comparison' },
  'founder/2': { bar1: 'Monthly Pricing', metric1: 'Avg Price' },
  'founder/3': { tbl1: 'Top Complaints' },
  'founder/4': { step1: 'Strategic Moves', metric1: 'TAM', metric2: 'Entry Window' },
  // Product
  'product/0': { metric1: 'WAU', metric2: 'Signups', metric3: 'Activation', metric4: 'Churn', bar1: 'Weekly Active Users' },
  'product/1': { pipe1: 'Funnel', metric1: 'Visit Signup', metric2: 'Signup Active' },
  'product/2': { tbl1: 'Tests This Week' },
  'product/3': { bar1: 'Feature Usage', metric1: 'Dashboard', metric2: 'Export' },
  'product/4': { step1: 'Priorities', metric1: 'Projected WAU', metric2: 'Target Activation' },
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
