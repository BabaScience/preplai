# Preplai Mission

> **"The agent understands. The engine shows. The user learns."**

Preplai is the **most advanced cinematic illustration engine for AI agents**. We give any AI — ChatGPT, Claude, Cursor, autonomous agents — the power to *show* anything visually, with animated, voice-synced, interactive cinema. Not slides. Not PDFs. Not logs. Cinema.

---

## The Problem

AI is brilliant at doing — but terrible at *showing what it did*.

**The black box problem is real.** 90% of AI agents may never leave the demo stage because nobody can see what they actually do. When something goes wrong, the question everyone asks is always the same: *"What did the agent actually do?"* — and nobody can answer.

Today, the options are:
- **Logs** — Walls of text. "Logging is slowly bankrupting me." 40% of sprint time goes to investigating failures, not building features.
- **Observability tools** (LangSmith, LangFuse) — "They didn't significantly save us time." Expensive, complex, and still don't answer the basic question.
- **Dashboards** — Metrics without meaning. "Almost all metrics, about 99%, will likely go unnoticed."

None of these are *human-readable*. None of them *show* you what happened. They give you data, not understanding.

## The Solution

Preplai is an MCP server that any AI agent can connect to. The agent becomes the *director* — it emits structured scene data. Preplai's engine becomes the *stage* — rendering cinematic, animated, voice-synced illustrations in real time. The human becomes the *audience* — watching, learning, understanding.

**Cinema, not logs. Accountability, not just observability.**

---

## MVP Target Users

### 1. CS Students

**Pain:** They use ChatGPT, Claude, or other LLMs to learn computer science. They ask "explain how quicksort works" and get paragraphs of text. They have to build the mental model themselves.

**Fix:** The LLM connects our MCP and *presents* the explanation. Arrays animate as elements swap. Trees grow as nodes insert. Data flows through pipelines. The student watches a cinematic walkthrough instead of reading a textbook.

**Where:** ChatGPT/Claude MCP marketplace, CS study communities, university tool lists.

### 2. Programmers

**Pain:** They use AI coding assistants — Cursor, Copilot, Claude Code. "Your AI can write code but it can't see what happens when it runs." They say "refactor this module" and the AI does it, but they don't understand *what* the AI did. "I often find disagreeing with the solution and end up rewriting the code myself."

**Fix:** The coding assistant uses our MCP to *show* what it built. "Here's the architecture I created" — with servers, databases, auth flows animated step by step. The programmer understands the system, not just the code.

**Where:** Cursor/Claude Code MCP integrations, developer tool directories.

### 3. AI Agent Owners

**Pain:** This is the deepest pain. "I kept asking 'what did the agent actually do?' after incidents. Nobody could answer." Autonomous agents execute complex workflows. Their owners "scrutinize logs in an effort to reconstruct the actions of an autonomous system with production credentials." Observability tools don't help — "accountability, not just observability" is what they need.

**Fix:** The agent uses our MCP to *present* its work as cinema. "Here's what I did and why" — with process flows, decision trees, data transformations animated step by step. An auditable visual record of every decision. Zero-config: agent calls MCP, presentation appears.

**Where:** AI agent frameworks, MCP registries, agent builder communities.

---

## Core Principles

1. **Cinema, not logs** — Every presentation is animated, immersive, voice-synced. Entities persist across frames, the camera moves, depth-of-field focuses attention. Not slides, not dashboards, not terminal output.
2. **Human-readable, not machine-readable** — A non-engineer should be able to watch and understand what an agent did. No log parsing, no trace analysis.
3. **Code over content** — Illustrations are programmatic SVG components, not static files. Every type = one render function. This scales infinitely.
4. **Agent as director** — The agent emits structured JSON; the engine renders. No design tools, no templates, no human intervention.
5. **Universal agent API** — Any AI agent can create presentations via MCP. One protocol, every agent.

---

## Voice of Customer Reference

See [docs/voice-of-customer.md](./docs/voice-of-customer.md) for the full VoC research with 60+ attributed quotes from Reddit, Hacker News, and LinkedIn.

---

## For AI Agents

- **[AGENTS.md](./AGENTS.md)** — Full onboarding: architecture, paths, invariants, docs map
- **[Claude.md](./Claude.md)** — Design & illustration focus for Claude Code
