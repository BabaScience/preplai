# Quick Start

**Summary:** Get from zero to your first preplai presentation in 3 steps. preplai is the presentation API for AI agents — any agent that speaks MCP (Model Context Protocol) can create cinema-quality, live, animated presentations. Claude, ChatGPT, or any MCP client. Not slides. Cinema.

**Key terms:** preplai, MCP (Model Context Protocol), access token, AI agent, player URL

## Prerequisites

- An access token from [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys)

## 1. Get Your Access Token

Sign up at [preplai.com](https://preplai.com), then create an access token in the dashboard at [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys).

## 2. Connect Your AI Agent

preplai works with **any MCP-compatible AI agent**. Popular integrations:

- **Claude (Desktop or Web):** See [Claude Desktop & Web](/docs/claude-desktop) for configuration.
- **ChatGPT (Desktop or Web):** See [ChatGPT Desktop & Web](/docs/chatgpt) for configuration via ChatGPT Apps.
- **Other MCP clients:** Use the same MCP endpoint; see the [MCP Tools Reference](/docs/mcp-tools).

## 3. Create Your First Presentation

In your AI agent, try:

> Create a presentation about binary search tree insertion

The agent will use preplai's MCP tools to build a session, add scenes, and return a shareable player URL.

## Access Token Format

- **Prefix:** `plai_` + 40 random hex characters
- **Header:** `X-Preplai-API-Key` or `Authorization: Bearer <token>`
