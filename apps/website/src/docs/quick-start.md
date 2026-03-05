# Quick Start

**Summary:** This guide gets you from zero to your first preplai presentation in 3 steps. preplai is a presentation engine that AI agents use to create live, animated, voice-synced visual experiences via the Model Context Protocol (MCP). Output is cinema-quality, not slides. Works with Claude Desktop, Claude Web, ChatGPT Desktop, and ChatGPT Web.

**Key terms:** preplai, MCP (Model Context Protocol), access token, Claude Desktop, ChatGPT, player URL

## Prerequisites

- An access token from [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys)

## 1. Get Your Access Token

Sign up at [preplai.com](https://preplai.com), then create an access token in the dashboard at [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys).

## 2. Connect Your AI Client

**Claude (Desktop or Web):** See [Claude Desktop & Web](/docs/claude-desktop) for configuration (hosted mode, Streamable HTTP, claude.ai OAuth).

**ChatGPT (Desktop or Web):** See [ChatGPT Desktop & Web](/docs/chatgpt) for configuration via ChatGPT Apps.

## 3. Create Your First Presentation

In Claude or ChatGPT, try:

> Create a presentation about binary search tree insertion

The agent will use preplai's MCP tools to build a session, add scenes, and give you a shareable player URL.

## Access Token Format

- **Prefix:** `plai_` + 40 random hex characters
- **Header:** `X-Preplai-API-Key` or `Authorization: Bearer <token>`
- **Tiers:** Free (5 sessions, 50 scenes/mo) → Pro ($19/mo) → Enterprise (custom)
