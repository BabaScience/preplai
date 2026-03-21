# Tips & Tricks

Get the most out of your presentations with themes, palettes, and better prompts.

---

## Themes

preplai has two visual themes. Set your default in [dashboard settings](https://preplai.com/dashboard/settings).

| Theme | Best for | Look |
|-------|----------|------|
| **Cinema** | Presentations, demos, storytelling | Rich gradients, ambient glow, drop shadows — feels cinematic |
| **Light** | Clean presentations, client deliverables | Warm beige, clean lines, no shadows — professional and easy to read |

You can also ask the AI agent to switch: *"Use light theme for this presentation"*

---

## Color Palettes

Palettes control the color scheme of your presentations. Set your default in the [dashboard](https://preplai.com/dashboard/settings).

| Palette | Colors | Good for |
|---------|--------|----------|
| **Default** | Cyan, violet, gold | General purpose — vibrant and versatile |
| **Ocean** | Blue, green, teal | Professional, calm presentations |
| **Sunset** | Orange, red, amber | Warm, energetic topics |
| **Forest** | Green, teal | Natural, grounded feel |
| **Mono** | Slate grays | Neutral, minimal — great with the light theme |

You don't need to specify colors in your prompts. The palette applies automatically to every entity.

---

## Writing Better Prompts

### Say "Using Preplai"

Start your prompt with **"Using Preplai, ..."** so the AI agent knows to create a visual presentation. Without it, the agent might respond with plain text instead.

> "**Using Preplai,** explain how our recommendation engine works for the executive team"

### Be specific about what you want

| Instead of... | Try... |
|---------------|--------|
| "Explain caching" | "Show how Redis caching works between an API server and PostgreSQL" |
| "Show our portfolio" | "Walk through a Q1 portfolio review — 60% equities, 25% bonds, show rebalancing plan" |
| "Present market analysis" | "Analyze the European EV charging market — size, major players, entry strategy" |
| "Show architecture" | "Show a microservices architecture with API gateway, 3 services, and a message queue" |

### Set the audience

The AI agent adjusts narration and visual complexity based on who's watching:

> "Explain how our recommendation engine works **for the executive team**"

> "Walk through the incident postmortem **for the engineering standup**"

> "Present the portfolio review **for a client with no finance background**"

### Ask for more frames

By default, the AI agent creates 3–5 frames. Want more detail?

> "Create a **detailed** presentation about our deployment pipeline with **at least 8 frames**"

### Use real names

The AI agent creates better visuals when you use specifics:

- "PostgreSQL" instead of "a database"
- "S&P 500 index fund" instead of "stocks"
- "Kafka" instead of "a message queue"
- "ChargePoint" instead of "a competitor"

### Ask for comparisons

> "Compare our current checkout flow vs the proposed redesign"

> "Compare traditional vs Roth 401(k) contributions over 20 years"

This creates side-by-side frames that highlight the differences.

### Iterate and refine

After the first presentation, you can ask the AI agent:

- *"Add a frame about the risk analysis"*
- *"Make the narration less technical"*
- *"Add a comparison of before vs after"*

The AI agent will append new frames to the existing presentation.

---

## Sharing

Every presentation has a **player URL** you can share with anyone. The link works without login — just send it and they can watch.

The URL looks like: `https://player.preplai.com/player/abc123...`

---

## Limits

| Sessions | Frames per session |
|----------|-------------------|
| 5 | Unlimited |

Running out of sessions? Delete old ones by asking: *"List my sessions"* then *"Delete session [id]"*

Or manage them in the [dashboard](https://preplai.com/dashboard).
