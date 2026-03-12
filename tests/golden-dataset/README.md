# Golden Dataset — Prompt Regression Testing

Evaluates whether changes to tool descriptions degrade the quality of LLM-generated presentations. Supports multiple LLM providers for cross-model benchmarking.

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
├── baselines/            # Auto-generated quality score baselines (per model)
│   ├── claude-sonnet/    # Baselines for Claude Sonnet
│   ├── gpt-4o/           # Baselines for GPT-4o
│   └── gpt-4o-mini/      # Baselines for GPT-4o Mini
├── eval-runner.ts        # Main eval script
└── README.md
```

## Usage

```bash
# Run with Claude Sonnet (default)
ANTHROPIC_API_KEY=... pnpm run eval:golden

# Run with GPT-4o
OPENAI_API_KEY=... pnpm run eval:golden -- --model gpt-4o

# Run with GPT-4o Mini
OPENAI_API_KEY=... pnpm run eval:golden -- --model gpt-4o-mini

# Run ALL models and compare
ANTHROPIC_API_KEY=... OPENAI_API_KEY=... pnpm run eval:golden -- --model all

# Update baselines for a specific model
OPENAI_API_KEY=... pnpm run eval:golden -- --model gpt-4o --update

# Run a single prompt
pnpm run eval:golden -- --prompt cs-binary-search

# Run one category
pnpm run eval:golden -- --category programmer

# Combine flags
pnpm run eval:golden -- --model gpt-4o --category cs-student --update
```

## Supported Models

| Key | Provider | Model | API Key Env |
|-----|----------|-------|-------------|
| `claude-sonnet` | Anthropic | claude-sonnet-4-20250514 | `ANTHROPIC_API_KEY` |
| `gpt-4o` | OpenAI | gpt-4o | `OPENAI_API_KEY` |
| `gpt-4o-mini` | OpenAI | gpt-4o-mini | `OPENAI_API_KEY` |

Use `--model all` to run all models and get a comparison table.

## Prompt Categories

| Category | Count | Focus |
|----------|-------|-------|
| `cs-student` | 10 | Data structures, algorithms, CS fundamentals |
| `programmer` | 10 | Architecture, DevOps, system design |
| `agent-owner` | 10 | Reports, dashboards, infrastructure |

## How It Works

1. For each prompt, the eval runner sends it to the selected LLM with the current `add_scene` tool description
2. The LLM generates a visual script JSON payload
3. The payload is scored using `scoreVisualScript()` (same 6-dimension scorer used in production)
4. Results are compared against:
   - Per-prompt `minQuality` threshold
   - Per-prompt `minFrames` requirement
   - Stored baselines for that model (if they exist) — regressions >5% trigger failure
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

## Adding New Models

Edit the `MODELS` registry in `eval-runner.ts`:

```typescript
const MODELS = {
  'my-model': {
    provider: 'openai',  // or 'anthropic'
    model: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
  },
};
```

## Adding Reference Payloads

Create `references/<prompt-id>.json` with a hand-crafted VisualScript. Use the full (non-compact) format with `position: { x, y }` objects. These serve as documentation of ideal output.

## CI

The eval runs automatically on PRs that modify:
- `packages/mcp-server/src/tool-descriptions/**`
- `packages/mcp-server/src/mcp-tools.ts`
- `tests/golden-dataset/prompts.json`

Requires `ANTHROPIC_API_KEY` GitHub secret. Optionally uses `OPENAI_API_KEY` for multi-model eval. Skipped on forks.
