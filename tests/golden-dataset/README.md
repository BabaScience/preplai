# Golden Dataset — Prompt Regression Testing

Evaluates whether changes to tool descriptions degrade the quality of LLM-generated presentations.

## Structure

```
tests/golden-dataset/
├── prompts.json          # 30 curated prompts (10 per category)
├── references/           # Hand-crafted reference VisualScript payloads
│   ├── cs-binary-search.json
│   ├── dev-microservices.json
│   ├── dev-rest-api.json
│   ├── dev-cicd-pipeline.json
│   └── agent-infra-topology.json
├── baselines/            # Auto-generated quality score baselines
│   └── <prompt-id>.json  # Created by --update flag
├── eval-runner.ts        # Main eval script
└── README.md
```

## Usage

```bash
# Run full eval (requires ANTHROPIC_API_KEY)
pnpm run eval:golden

# Update baselines with current scores
pnpm run eval:golden -- --update

# Run a single prompt
pnpm run eval:golden -- --prompt cs-binary-search

# Run one category
pnpm run eval:golden -- --category programmer
```

## Prompt Categories

| Category | Count | Focus |
|----------|-------|-------|
| `cs-student` | 10 | Data structures, algorithms, CS fundamentals |
| `programmer` | 10 | Architecture, DevOps, system design |
| `agent-owner` | 10 | Reports, dashboards, infrastructure |

## How It Works

1. For each prompt, the eval runner sends it to Claude with the current `add_scene` tool description
2. Claude generates a visual script JSON payload
3. The payload is scored using `scoreVisualScript()` (same 6-dimension scorer used in production)
4. Results are compared against:
   - Per-prompt `minQuality` threshold
   - Per-prompt `minFrames` requirement
   - Stored baselines (if they exist) — regressions >5% trigger failure
5. CI fails if any prompt regresses

## Adding New Prompts

Edit `prompts.json`:

```json
{
  "id": "my-new-prompt",
  "category": "cs-student",
  "prompt": "Your prompt text here",
  "minQuality": 65,
  "expectedEntityTypes": ["Array", "H1"],
  "minFrames": 3
}
```

Then run `pnpm run eval:golden -- --prompt my-new-prompt --update` to establish the baseline.

## Adding Reference Payloads

Create `references/<prompt-id>.json` with a hand-crafted VisualScript. Use the full (non-compact) format with `position: { x, y }` objects. These serve as documentation of ideal output.

## CI

The eval runs automatically on PRs that modify:
- `packages/mcp-server/src/tool-descriptions/**`
- `packages/mcp-server/src/mcp-tools.ts`
- `tests/golden-dataset/prompts.json`

Requires `ANTHROPIC_API_KEY` GitHub secret. Skipped on forks.
