# MCP Tools Reference

**Summary:** preplai exposes 8 MCP (Model Context Protocol) tools that **any AI agent** can call to create and manage cinema-quality presentations. Claude, ChatGPT, or any MCP client — one API, eight tools. Typical flow: `create_session` → `add_scene` (repeat) → `get_session_url` → share the player URL. All tools require authentication via `X-Preplai-API-Key` or `Authorization: Bearer <token>`.

**Definitions:**
- **Session:** A presentation container. Created by `create_session`. Has a unique `session_id` and `player_url`.
- **Scene:** A visual unit (frames + entities). Added via `add_scene` or replaced via `update_scene`.
- **Frame:** A single view in a scene with entities, timing, and narration.
- **VisualScript:** JSON schema defining a scene (see [VisualScript Schema](/docs/visualscript)).

## Tool Overview

| Tool | Description |
|------|-------------|
| `create_session` | Create a new presentation session |
| `add_scene` | Append a visual scene (frames) to a session |
| `update_scene` | Replace the visual script for a scene |
| `add_narration` | Add subtitle/narration text to a frame |
| `get_session_url` | Get the shareable player URL |
| `list_sessions` | List all sessions (most recent first) |
| `delete_session` | Delete a session and all its data |
| `remove_scene` | Remove frames from a session |

---

## create_session

Create a new presentation session. Returns a `session_id` and `player_url`. When running locally, the player URL may be opened automatically in the browser.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | Yes | Clear, descriptive title (e.g. "Binary Search Tree Insertion") |
| `aspect_ratio` | string | No | Default `"16:9"`. Options: `"16:9"`, `"4:3"` |
| `style` | string | No | `"cinema"` (default) or `"minimal"` |

---

## add_scene

Add a visual scene to a presentation session. Scenes are rendered as animated SVG on a 1920×1080 dark canvas.

**Append behavior:** Calling `add_scene` multiple times **appends** new frames. Use `update_scene` to replace an existing scene.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID from `create_session` |
| `visual_script` | object | Yes | Visual script with `sceneId`, `frames`, `totalDuration` |

See [VisualScript Schema](/docs/visualscript) for the full schema and entity types.

---

## update_scene

Replace the visual script for an existing scene. Same format as `add_scene`.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `visual_script` | object | Yes | Replacement visual script |

---

## add_narration

Add narration text to a specific frame. The text appears as a subtitle overlay in the player.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `text` | string | Yes | Narration text (1–2 sentences per frame) |
| `frame_index` | number | No | Frame index (0-based, default 0) |

---

## get_session_url

Get the player URL for a session. Open this URL in a browser to view the presentation.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `include_stats` | boolean | No | Include frame count, duration, etc. |

---

## list_sessions

List all presentation sessions. Returns session IDs, titles, player URLs, and frame counts. Most recent first.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `limit` | number | No | Max sessions to return (default 20, max 100) |

---

## delete_session

Delete a presentation session and all its data (visual script, narrations). **Cannot be undone.**

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID to delete |

---

## remove_scene

Remove frames from a presentation session.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `frame_indices` | number[] | No | Specific frame indices to remove (0-based) |
| `last_n` | number | No | Remove the last N frames |

If neither is specified, all frames are cleared.
