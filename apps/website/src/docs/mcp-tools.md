# MCP Tools Reference

**Summary:** preplai exposes 5 MCP (Model Context Protocol) tools that **any AI agent** can call to create and manage cinema-quality presentations. Claude, ChatGPT, or any MCP client — one API, five tools.

**Workflow:** `create_session` → `add_scene` (repeat) → `get_session_url` → share the player URL. That's it. `create_session` returns everything you need to start — preferences, illustrations reference, and session details — in a single call.

All tools require authentication via `X-Preplai-API-Key` or `Authorization: Bearer <token>`.

**Definitions:**
- **Session:** A presentation container. Created by `create_session`. Has a unique `session_id` and `player_url`.
- **Scene:** A visual unit (frames + entities). Added via `add_scene`.
- **Frame:** A single view in a scene with entities, timing, and narration.
- **VisualScript:** JSON schema defining a scene (see [VisualScript Schema](/docs/visualscript)).

## Themes and Palettes

Presentations use a **theme** (visual style) and **palette** (color scheme). These are set in the user's [dashboard Settings](/dashboard/settings) and applied automatically to all `player_url` responses. The agent can override the theme via the `style` parameter in `create_session`.

**Themes:**
| Theme | Description |
|-------|-------------|
| `light` | Warm beige, frosted glass UI (default) |
| `cinema` | Rich gradients, ambient effects, drop shadows |

**Palettes:**
| Palette | Description |
|--------|-------------|
| `default` | Cyan, violet, gold — vibrant and versatile |
| `ocean` | Blue, green, teal — calm and professional |
| `sunset` | Orange, red, amber — warm and energetic |
| `forest` | Green, teal — natural and grounded |
| `mono` | Slate grays — minimal and neutral |

The `player_url` includes `?style=` and `?palette=` so the presentation renders with the chosen theme and palette. Users configure their preferences at [preplai.com/dashboard/settings](https://preplai.com/dashboard/settings).

## Callbacks

When running **locally** (stdio or localhost), the MCP server automatically opens the player URL in the default browser after `create_session`. For remote clients (Claude Web, ChatGPT, etc.), the agent should share the `player_url` with the user so they can open it in a new tab.

## Errors and recovery

All tools return JSON with `success: true` and `data` on success, or `success: false` and `error: { code, message, suggestion }` on failure. **Follow the `suggestion` field** to recover. Common codes:

| Code | When | Agent action |
|------|------|--------------|
| `UNAUTHORIZED` | Missing or invalid API key | Ensure client has a valid token. Web: use OAuth. Desktop: create an access token at [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys). Tell the user to connect their account or add an API key. |
| `SESSION_NOT_FOUND` | Invalid or expired `session_id` | Call `create_session` first and use the returned `session_id`. If the user referenced an old session, offer to create a new one. |
| `VALIDATION_ERROR` | Invalid `visual_script` or other input | Fix the listed field errors and retry. For `add_scene`, ensure `frames`, `entities`, and entity metadata match the [VisualScript schema](/docs/visualscript). |
| `LIMIT_EXCEEDED` | Session or scene limit reached | Tell the user to upgrade at [preplai.com/pricing](https://preplai.com/pricing) or delete unused sessions via `manage_sessions`. |
| `FORBIDDEN` | Session owned by a different API key | Only the key that created the session can modify it. Use `manage_sessions` with `action: "list"` to find sessions for the current key, or create a new session. |
| `INTERNAL_ERROR` | Server or database failure | Retry once. If it persists, inform the user and suggest trying again later. |

**Agent guidance:** When you receive an error, read `error.suggestion` and act on it. Do not retry the same failing call indefinitely; switch strategy (e.g. create a new session, use defaults) when appropriate.

## Tool Overview

| Tool | Description |
|------|-------------|
| `create_session` | Create a new presentation session. Returns session details, user preferences, and illustrations reference — all in one call |
| `add_scene` | Add or replace a visual scene (frames) in a session |
| `get_session_url` | Get the shareable player URL for a session |
| `manage_sessions` | List, delete, or remove frames from sessions |
| `add_narration` | Add subtitle/narration text to a frame |

---

## create_session

Create a new presentation session. Returns `session_id`, `player_url`, `preferences` (theme, palette), **and** the full illustrations reference (entity types, aliases, short keys, topic hints, metadata hints) — everything the agent needs to start building scenes.

**No need to call anything first** — this single tool replaces the old `get_preferences` + `get_illustrations` + `create_session` workflow.

Pass `style` to override the theme (e.g. `"cinema"` for dark cinematic mode). Omit `entity.color` in `add_scene` — the player uses the palette automatically. When running locally, the player URL is automatically opened in the browser (see [Callbacks](#callbacks)).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | Yes | Clear, descriptive title (e.g. "Binary Search Tree Insertion") |
| `aspect_ratio` | string | No | Default `"16:9"`. Options: `"16:9"`, `"4:3"` |
| `style` | string | No | Override theme: `"light"` or `"cinema"`. Omit to use the user's dashboard preference. |

**Response includes:**
- `session_id` — unique session identifier
- `player_url` — shareable URL to view the presentation
- `preferences: { theme, palette }` — user's current theme and palette
- `illustrations` — full reference: `entityTypes`, `aliases`, `shortKeys`, `topicHints`, `metadataHints`

---

## add_scene

Add or replace a visual scene in a presentation session. Scenes are rendered as animated SVG on a 1920×1080 dark canvas.

**Modes:**
- `"append"` (default) — Appends new frames to the existing scene. Call multiple times to build up a presentation.
- `"replace"` — Replaces the entire visual script. Use when the agent needs to redo the scene from scratch.

**Colors:** Omit `entity.color`. The player uses the theme palette automatically based on entity type.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID from `create_session` |
| `visual_script` | object | Yes | Visual script with frames, entities, and timing. Use compact format (see below) |
| `mode` | string | No | `"append"` (default) or `"replace"` |

**Compact format:** Use short keys to reduce token usage — `sid` (sceneId), `td` (totalDuration), `f` (frames), `e` (entities), `n` (narrationSegment), `p` (position as `[x, y]`), `l` (label), `m` (metadata), `src` (sourceEntityId), `tgt` (targetEntityId), `a` (animation). See [VisualScript Schema](/docs/visualscript) for the full schema and entity types.

---

## get_session_url

Get the player URL for a session. Returns `player_url`, `embed_url` (for iframes), and `preferences` (theme, palette). The URL includes the user's theme and palette. Open this URL in a browser to view the presentation.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `include_stats` | boolean | No | Include frame count, duration, etc. |

**Returns:** `player_url`, `embed_url`, `preferences: { theme, palette }`, and optionally `frame_count`, `total_duration_ms` when `include_stats` is true.

---

## manage_sessions

Manage presentation sessions — list, delete, or remove frames. One tool, three actions.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | string | Yes | `"list"`, `"delete"`, or `"remove_frames"` |
| `session_id` | string | For `delete` and `remove_frames` | Session ID to act on |
| `limit` | number | No | For `"list"`: max sessions to return (default 20, max 100) |
| `frame_indices` | number[] | No | For `"remove_frames"`: specific frame indices to remove (0-based) |
| `last_n` | number | No | For `"remove_frames"`: remove the last N frames |

**Actions:**

### `"list"`
List all sessions with titles, player URLs, and frame counts. Most recent first. Use `limit` to control how many are returned.

### `"delete"`
Permanently delete a session and all its data (visual script, narrations, audio). **Cannot be undone.** Requires `session_id`.

### `"remove_frames"`
Remove frames from a session. Pass `frame_indices` for specific frames, `last_n` for the last N frames, or neither to clear all frames. Requires `session_id`.

---

## add_narration

Add narration text to a specific frame. The text appears as a subtitle overlay in the player.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `text` | string | Yes | Narration text (2–4 sentences per frame, informative and detailed) |
| `frame_index` | number | No | Frame index (0-based, default 0) |

---

## Migration from previous API

If you're updating from an older integration that used 10 separate tools, here's how they map:

| Old tool | New equivalent |
|----------|---------------|
| `get_preferences` | Built into `create_session` response |
| `get_illustrations` | Built into `create_session` response |
| `create_session` | `create_session` (unchanged, but now returns more data) |
| `add_scene` | `add_scene` with `mode: "append"` (default) |
| `update_scene` | `add_scene` with `mode: "replace"` |
| `add_narration` | `add_narration` (unchanged) |
| `get_session_url` | `get_session_url` (unchanged) |
| `list_sessions` | `manage_sessions` with `action: "list"` |
| `delete_session` | `manage_sessions` with `action: "delete"` |
| `remove_scene` | `manage_sessions` with `action: "remove_frames"` |
