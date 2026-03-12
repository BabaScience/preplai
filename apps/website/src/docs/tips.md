# Tips & Tricks

Get the most out of your presentations with themes, palettes, and better prompts.

---

## Themes

preplai has two visual themes. Set your default in [dashboard settings](https://preplai.com/dashboard/settings).

| Theme | Best for | Look |
|-------|----------|------|
| **Cinema** | Presentations, demos, storytelling | Rich gradients, ambient glow, drop shadows — feels cinematic |
| **Minimal** | Algorithm visualizations, technical docs | Flat, clean, no shadows — feels like a whiteboard |

You can also ask the AI to switch: *"Use minimal theme for this presentation"*

---

## Color Palettes

Palettes control the color scheme of your presentations. Set your default in the [dashboard](https://preplai.com/dashboard/settings).

| Palette | Colors | Good for |
|---------|--------|----------|
| **Default** | Cyan, violet, gold | General purpose — vibrant and versatile |
| **Ocean** | Blue, green, teal | Professional, calm presentations |
| **Sunset** | Orange, red, amber | Warm, energetic topics |
| **Forest** | Green, teal | Natural, grounded feel |
| **Mono** | Slate grays | Minimal, neutral — great with the minimal theme |

You don't need to specify colors in your prompts. The palette applies automatically to every entity.

---

## Writing Better Prompts

### Be specific about what you want

| Instead of... | Try... |
|---------------|--------|
| "Explain caching" | "Show how Redis caching works between an API server and PostgreSQL" |
| "Show architecture" | "Show a microservices architecture with API gateway, 3 services, and a message queue" |
| "Explain sorting" | "Walk me through quicksort step by step on the array [8, 3, 1, 5, 2]" |

### Ask for more frames

By default, the AI creates 3–5 frames. Want more detail?

> "Create a **detailed** presentation about Kubernetes with **at least 8 frames**"

### Use real names

The AI creates better visuals when you use specific technologies:

- "PostgreSQL" instead of "a database"
- "Redis" instead of "a cache"
- "Kafka" instead of "a message queue"
- "nginx" instead of "a load balancer"

### Ask for comparisons

> "Compare monolithic vs microservices architecture"

This creates side-by-side frames that highlight the differences.

### Iterate and refine

After the first presentation, you can ask:

- *"Add a frame about error handling"*
- *"Make the narration more detailed"*
- *"Add more frames about the database layer"*

The AI will append new frames to the existing presentation.

---

## Sharing

Every presentation has a **player URL** you can share with anyone. The link works without login — just send it and they can watch.

The URL looks like: `https://player.preplai.com/player/abc123...`

---

## Limits

| Plan | Sessions | Frames per session |
|------|----------|-------------------|
| Free | 5 | 50 |
| Pro | Unlimited | Unlimited |

Running out of sessions? Delete old ones by asking: *"List my sessions"* then *"Delete session [id]"*

Or manage them in the [dashboard](https://preplai.com/dashboard).
