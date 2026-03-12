# Quick Start

In 2 minutes, you'll create your first animated presentation — no slides, no design skills needed. Just tell your AI agent what to present.

## What is preplai?

preplai lets any AI agent — Claude, ChatGPT, Cursor, or others — create **animated, cinema-quality presentations** for you. You type a prompt, the agent builds a visual walkthrough, and you get a link to watch it.

Think of it like this: instead of the agent writing a wall of text, it *shows* you — with animations, illustrations, and narration.

---

## Step 1: Pick Your Connection Method

preplai supports two ways to connect, depending on which AI agent you use:

| Connection method | How it works | Used by |
|-------------------|-------------|---------|
| **API Token** | You create a token and paste it into a config file | Claude Desktop, Cursor, Windsurf, and other desktop MCP clients |
| **OAuth** | You click "Connect" and authorize through your browser | Claude Web (claude.ai), ChatGPT Web, ChatGPT Desktop & mobile |

**Not sure?** If you use an app installed on your computer, you probably need an **API token**. If you use AI in a web browser, you probably need **OAuth**.

---

## Step 2: Set Up Your Connection

### API Token (for desktop apps)

1. Sign up at [preplai.com](https://preplai.com)
2. Go to [Dashboard → Keys](https://preplai.com/dashboard/keys) and create an **access token**
3. Your token looks like: `plai_a1b2c3d4e5f6...`
4. Follow the setup guide for your AI agent:

| I use... | Setup guide |
|----------|-------------|
| **Claude Desktop** | [Connect Claude →](/docs/connect-claude#claude-desktop-app) |
| **Cursor, Windsurf, other MCP clients** | [Connect Claude →](/docs/connect-claude#claude-desktop-app) (same config format) |

### OAuth (for web & mobile)

1. Sign up at [preplai.com](https://preplai.com)
2. Go to [Dashboard → Connectors](https://preplai.com/dashboard/connectors) and create an **OAuth client**
3. You'll get a **Client ID** and **Client Secret**
4. Follow the setup guide for your AI agent:

| I use... | Setup guide |
|----------|-------------|
| **Claude Web** (claude.ai) | [Connect Claude →](/docs/connect-claude#claude-web-claudeai) |
| **ChatGPT** (Web, Desktop, or mobile) | [Connect ChatGPT →](/docs/connect-chatgpt) |

---

## Step 3: Create Your First Presentation

Open your AI agent and try one of these prompts:

> **"Create a presentation about how binary search works"**

> **"Show me a microservices architecture with an API gateway, database, and cache"**

> **"Explain the CI/CD pipeline step by step"**

The AI agent will build your presentation and give you a **player link**. Click it to watch.

---

## What You'll See

Your presentation opens in the **preplai player** — a cinematic viewer with:

- **Animated illustrations** that appear, move, and highlight as the story progresses
- **Narration text** at the bottom explaining each frame
- **Play/pause controls** so you can go at your own pace
- **A shareable link** you can send to anyone

---

## What's Next?

- [**Examples →**](/docs/examples) See what kinds of presentations you can create
- [**Tips →**](/docs/tips) Get better results with themes, palettes, and prompt tips
- [**MCP Tools Reference →**](/docs/mcp-tools) For developers building integrations
