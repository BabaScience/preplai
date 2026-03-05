# MCP for Presentations: A Developer Guide

**Summary:** The Model Context Protocol (MCP) is an open standard that lets AI agents call external tools. preplai exposes an MCP server with 8 tools — create_session, add_scene, get_session_url, and more. Any MCP-compatible agent (Claude, ChatGPT, or custom) can create cinema-quality presentations through a single API.

**Key terms:** MCP, Model Context Protocol, AI agent, preplai, create_session, add_scene

---

## What is MCP?

**MCP (Model Context Protocol)** is a protocol for connecting AI models to external tools and data sources. Instead of each AI vendor building custom integrations, MCP provides a standard way for agents to:

- Discover available tools
- Call tools with structured parameters
- Receive structured responses

Think of it as "plugins for AI" — one protocol, many tools. preplai is one of those tools.

---

## How preplai uses MCP

preplai exposes an MCP server at `https://player.preplai.com/mcp`. The server advertises 8 tools:

| Tool | What it does |
|------|--------------|
| `create_session` | Create a new presentation, get session_id and player_url |
| `add_scene` | Append a visual scene (frames + entities) |
| `update_scene` | Replace a scene's visual script |
| `add_narration` | Add subtitle text to a frame |
| `get_session_url` | Get the shareable player URL |
| `list_sessions` | List all sessions |
| `delete_session` | Delete a session |
| `remove_scene` | Remove frames from a session |

Any agent that speaks MCP can call these tools. Claude Desktop, Claude Web, ChatGPT Desktop, ChatGPT Web — or a custom agent you build.

---

## Why MCP for presentations?

**Before MCP:** Each AI vendor would need a custom "presentation plugin." Fragmented, duplicated effort.

**With MCP:** One presentation API (preplai), many agents. Claude, ChatGPT, and future agents all use the same tools. Developers get one integration surface.

**For users:** Ask any MCP-connected agent to create a presentation. Same quality, same workflow, regardless of which agent you use.

---

## Getting started

1. [Get an access token](https://preplai.com/signup) at preplai.com
2. Connect your AI agent — see [Claude](/docs/claude-desktop) or [ChatGPT](/docs/chatgpt) setup
3. Ask the agent to create a presentation

For the full tool reference, see the [MCP Tools Reference](/docs/mcp-tools).
