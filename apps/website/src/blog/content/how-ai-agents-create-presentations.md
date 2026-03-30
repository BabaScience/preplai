# How AI Agents Create Presentations

**Summary:** AI agents like Claude, ChatGPT, or any MCP-compatible client can create cinema-quality presentations in real time. The user asks, the agent calls MCP tools, and a shareable player URL appears in seconds. This post explains how it works and why it matters.

**Key terms:** AI agent, MCP, preplai, create_session, add_scene, player URL

---

## What is an AI presentation?

Unlike traditional slide decks, AI-generated presentations are built **live** as the agent works. The user says "Create a presentation about our Q4 results" — the agent creates a session, adds scenes with visual entities (charts, diagrams, text), and returns a URL. The viewer watches it unfold in real time or replays it later.

**preplai** is the presentation API that powers this. Any AI agent that speaks [MCP (Model Context Protocol)](/docs/mcp-tools) can call preplai's tools to create sessions, add scenes, and get shareable player URLs.

---

## How it works

1. **User asks** — "Create a presentation about binary search tree insertion"
2. **Agent calls MCP tools** — `create_session` → `add_scene` (repeat) → `get_session_url`
3. **preplai renders** — Scenes are rendered as animated SVG on a 1920×1080 dark canvas
4. **User gets a URL** — `https://player.preplai.com/player/abc123` — shareable, no downloads

The agent doesn't export slides. It pushes [VisualScript](/docs/visualscript) JSON — a schema that defines entities (Server, Database, BinaryTree, etc.), frames, and timing. preplai compiles that into cinema-quality visuals.

---

## Why AI agents?

AI agents are good at understanding context, choosing the right visuals, and pacing a narrative. They can:

- Pick entity types that match the topic (e.g. BinaryTree for BST, Server for architecture)
- Build complexity gradually (simpler frames first, add entities in later frames)
- Add narration that matches the user's level (technical vs beginner)

Humans design the schema; agents fill it in. The result is presentations that feel hand-crafted but are generated in seconds.

---

## Try it

Connect [Claude](/docs/claude-desktop) or [ChatGPT](/docs/chatgpt) to preplai, then ask:

> Create a presentation about our system architecture

The agent will use preplai's MCP tools and return a shareable URL. [Get an access token](https://preplai.com/signup) to get started.
