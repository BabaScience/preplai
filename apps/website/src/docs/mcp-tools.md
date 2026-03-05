# MCP Tools Reference

**Summary:** preplai exposes 9 MCP (Model Context Protocol) tools that **any AI agent** can call to create and manage cinema-quality presentations. Claude, ChatGPT, or any MCP client — one API, nine tools.

**Required workflow:** When creating a new presentation, call `get_preferences` **first** (before `create_session`). This returns the user's theme, palette, and entity colors. Use that data when creating the session and when building `add_scene` visual_script. Flow: `get_preferences` → `create_session` → `add_scene` (repeat) → `get_session_url` → share the player URL.

All tools require authentication via `X-Preplai-API-Key` or `Authorization: Bearer <token>`.

**Definitions:**
- **Session:** A presentation container. Created by `create_session`. Has a unique `session_id` and `player_url`.
- **Scene:** A visual unit (frames + entities). Added via `add_scene` or replaced via `update_scene`.
- **Frame:** A single view in a scene with entities, timing, and narration.
- **VisualScript:** JSON schema defining a scene (see [VisualScript Schema](/docs/visualscript)).

## Themes and Palettes

Presentations use a **theme** (visual style) and **palette** (color scheme). These are set in the user's [dashboard Settings](/dashboard/settings) and applied automatically to all `player_url` responses. The agent can override the theme via the `style` parameter in `create_session`.

**Themes:**
| Theme | Description |
|-------|-------------|
| `cinema` | Rich gradients, ambient effects, drop shadows (default) |
| `minimal` | Flat, algorithm-viz style, clean and technical |

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
| `VALIDATION_ERROR` | Invalid `visual_script` or other input | Fix the listed field errors and retry. For `add_scene`/`update_scene`, ensure `frames`, `entities`, and entity metadata match the [VisualScript schema](/docs/visualscript). |
| `LIMIT_EXCEEDED` | Session or scene limit reached | Tell the user to upgrade at [preplai.com/pricing](https://preplai.com/pricing) or delete unused sessions via `delete_session` or `list_sessions`. |
| `FORBIDDEN` | Session owned by a different API key | Only the key that created the session can modify it. Use `list_sessions` to find sessions for the current key, or create a new session. |
| `INTERNAL_ERROR` | Server or database failure | Retry once. If it persists, inform the user and suggest trying again later. For `get_preferences`, proceed with default colors so the presentation can still be created. |

**Agent guidance:** When you receive an error, read `error.suggestion` and act on it. Do not retry the same failing call indefinitely; switch strategy (e.g. create a new session, use defaults) when appropriate.

## Tool Overview

| Tool | Description |
|------|-------------|
| `get_preferences` | **Call first.** Get user's theme, palette, and entity colors |
| `create_session` | Create a new presentation session (call after get_preferences) |
| `add_scene` | Append a visual scene (frames) to a session |
| `update_scene` | Replace the visual script for a scene |
| `add_narration` | Add subtitle/narration text to a frame |
| `get_session_url` | Get the shareable player URL |
| `list_sessions` | List all sessions (most recent first) |
| `delete_session` | Delete a session and all its data |
| `remove_scene` | Remove frames from a session |

---

## create_session

Create a new presentation session. **Call `get_preferences` first** to get the user's theme and palette, then create the session. Pass `style` to override the theme (e.g. `"minimal"` for algorithm visualizations) if desired. Returns `session_id`, `player_url`, and `preferences` (theme, palette, colors). Use `preferences.colors` when building `add_scene` visual_script. When running locally, the player URL is automatically opened in the browser (see [Callbacks](#callbacks)).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `title` | string | Yes | Clear, descriptive title (e.g. "Binary Search Tree Insertion") |
| `aspect_ratio` | string | No | Default `"16:9"`. Options: `"16:9"`, `"4:3"` |
| `style` | string | No | Override theme: `"cinema"` or `"minimal"`. Omit to use the user's dashboard preference. Palette is always from the dashboard. |

**Response includes:** `preferences: { theme, palette, colors }` — use `colors` for entity colors in add_scene.

---

## get_preferences

**Call this FIRST** when creating a new presentation — before `create_session`. Returns the user's theme, palette, and entity colors. Use the returned data to decide how to create the session and to set `entity.color` in `add_scene` (e.g. Server → `colors.server`, Database → `colors.database`, User → `colors.user`).

**When to call:**
- **Required:** Before `create_session` when starting a new presentation.
- Before `add_scene` if adding to an existing session and you don't have preferences.

**Parameters:** None.

**Returns:** `{ theme, palette, colors }` where `colors` is `{ server, database, cloud, user, concept, label, codeblock, generic, accent }`.

**If it fails:** On `UNAUTHORIZED`, ensure the client has a valid API key. On `INTERNAL_ERROR`, retry once; if it persists, proceed with default colors (e.g. `#22d3ee` for server, `#a78bfa` for database) so the presentation can still be created.

---

## add_scene

Add a visual scene to a presentation session. Scenes are rendered as animated SVG on a 1920×1080 dark canvas.

**Append behavior:** Calling `add_scene` multiple times **appends** new frames. Use `update_scene` to replace an existing scene.

**Colors:** Use `preferences.colors` from `create_session` or call `get_preferences` to get the user's palette. Map entity types to colors: Server/Service → `colors.server`, Database/HashTable → `colors.database`, Cloud → `colors.cloud`, User → `colors.user`, Concept → `colors.concept`, Label → `colors.label`, CodeBlock → `colors.codeblock`, others → `colors.generic`.

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

Get the player URL for a session. **Always returns `preferences` (theme, palette, colors)** — use `preferences.colors` for `entity.color` in `add_scene` if you didn't get them from `create_session`. The URL includes the user's theme and palette. Open this URL in a browser to view the presentation.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session_id` | string | Yes | Session ID |
| `include_stats` | boolean | No | Include frame count, duration, etc. |

**Returns:** `player_url`, `embed_url`, `preferences: { theme, palette, colors }`, and optionally `frame_count`, `total_duration_ms` when `include_stats` is true.

---

## list_sessions

List all presentation sessions. Returns session IDs, titles, player URLs (with theme and palette), and frame counts. Most recent first.

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
