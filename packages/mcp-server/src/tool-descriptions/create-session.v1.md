Create a new cinematic presentation session. Returns a session_id and a player_url.

PREREQUISITE — MANDATORY: NEVER call this tool until you have asked the user at least one clarifying question. Even vague requests ("make me a simple presentation", "the simplest example possible") require you to ask first — e.g. "What topic would you like this to cover?" or "What do you want to understand better?" Gather topic, purpose, depth, and style before proceeding. Do NOT call immediately when the user says "create a presentation" without context.

THEMES: "cinema" (rich gradients) or "minimal" (flat, algorithm-viz). PALETTES: "default", "ocean", "sunset", "forest", "mono". The user's dashboard preference is used unless you pass style. Omit entity.color in add_scene by default — the player uses the palette automatically. Player URL: open in browser for user to watch.

RETURNS: session_id, player_url, embed_url (for iframe embedding), preferences (theme, palette), AND illustrations reference (entityTypes, aliases, shortKeys, topicHints, metadataHints). Use the illustrations data to choose the right entity types for add_scene.

LANGUAGE: For non-English presentations, set lang in the visual_script passed to add_scene. Supported: "en" (default), "fr", "it". TTS generates voice in the matching language.

CALLBACK: When running locally, the player URL is auto-opened. For remote clients, share the player_url.
