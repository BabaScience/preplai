# ChatGPT Integration

**Summary:** This document explains how to connect preplai to ChatGPT Web (chat.openai.com) and ChatGPT Desktop. preplai works with any AI agent — ChatGPT is one popular integration. Once connected, ChatGPT can create cinema-quality presentations using preplai's MCP tools. Connectors created on ChatGPT Web sync to ChatGPT Desktop and mobile apps.

**Key terms:** ChatGPT, MCP, ChatGPT Apps, Connectors, chat.openai.com, developer mode

## Overview

preplai works with **any MCP-compatible AI agent**. ChatGPT uses the **ChatGPT Apps** (formerly Connectors) platform. You create a connector that points to preplai's MCP endpoint. Once connected, ChatGPT can use preplai's tools (`create_session`, `add_scene`, etc.) to build presentations.

**ChatGPT Web and Desktop:** Connectors created on ChatGPT Web are automatically available on ChatGPT Desktop and mobile apps. You only need to set up the connector once.

---

## Prerequisites

1. **ChatGPT account** with access to Apps (Business, Enterprise, Education, or Plus with developer mode)
2. **preplai OAuth client** — Create one at [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors)
3. **preplai MCP endpoint** — `https://player.preplai.com/mcp` (hosted)

---

## ChatGPT Web (chat.openai.com)

### 1. Enable Developer Mode

1. Go to [chat.openai.com](https://chat.openai.com)
2. Open **Settings → Apps & Connectors → Advanced settings** (bottom of the page)
3. Toggle **Developer mode** on (if your organization allows it)

### 2. Create the preplai Connector

1. In **Settings → Apps & Connectors**, click **Create**
2. Provide the connector metadata:
   - **Connector name:** `preplai` (or "preplai Presentations")
   - **Description:** `Create cinema-quality visual presentations. Use preplai to build animated, voice-synced presentations with scenes, entities, and shareable player URLs.`
   - **Connector URL:** `https://player.preplai.com/mcp`
3. In **Advanced settings**, paste your **OAuth Client ID** and **OAuth Client Secret** from [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors)
4. Click **Create** — if the connection succeeds, you'll see the list of preplai tools
5. Click **Connect** to complete the OAuth flow and authorize preplai

### 3. Use preplai in ChatGPT

1. Start a new chat
2. Click the **+** button near the message composer, then **More**
3. Select **preplai** from your connectors
4. Prompt ChatGPT, e.g.:
   - *"Create a presentation about our system architecture"*
   - *"Build a visual explanation of binary search tree insertion"*

ChatGPT will use preplai's MCP tools to create sessions, add scenes, and return a shareable player URL.

---

## ChatGPT Desktop

ChatGPT Desktop uses the same connector system as ChatGPT Web. Once you've created and connected the preplai connector on [chat.openai.com](https://chat.openai.com):

1. **Sync:** Connectors are synced to your ChatGPT Desktop app automatically
2. **Use:** Open ChatGPT Desktop, start a chat, and select preplai from the connector list (same as on web)

No separate configuration is needed for ChatGPT Desktop. If the connector doesn't appear, ensure you're signed into the same account on both web and desktop.

---

## Local Development (Optional)

For testing with a local preplai MCP server, expose it over HTTPS using [ngrok](https://ngrok.com/) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/):

```bash
# Example with ngrok
ngrok http 5005
```

Use the generated HTTPS URL (e.g. `https://abc123.ngrok.app/mcp`) as the Connector URL when creating the connector. Replace with your production URL (`https://player.preplai.com/mcp`) when done testing.

---

## Refreshing the Connector

When preplai updates its tools or descriptions:

1. In **Settings → Apps & Connectors**, click into your preplai connector
2. Click **Refresh** to pull the latest tool list
3. Try a few prompts to verify the updated flows

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connector creation fails | Ensure your MCP server is reachable over HTTPS. For hosted preplai, use `https://player.preplai.com/mcp` |
| OAuth fails | Verify your OAuth Client ID and Secret from [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors) |
| Tools not appearing | Check that developer mode is enabled; refresh the connector |
| Desktop doesn't show connector | Sign into the same account; connectors sync from web |
