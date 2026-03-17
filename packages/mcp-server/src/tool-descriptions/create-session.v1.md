Create a new cinematic presentation session. Returns a session_id and a player_url.

SESSION REUSE — CRITICAL: If you already have a session_id from a previous create_session call in this conversation, do NOT call create_session again. Use add_scene with mode:"append" to add more content to the existing session. This tool automatically detects and returns existing active sessions — if you get reused_existing_session:true in the response, use that session_id with add_scene. Only pass force_new:true if the user explicitly asks for a completely separate/new presentation on a different topic.

PREREQUISITE — MANDATORY: NEVER call this tool until you have asked the user at least one clarifying question. Even vague requests ("make me a simple presentation", "the simplest example possible") require you to ask first — e.g. "What topic would you like this to cover?" or "What do you want to understand better?" Gather topic, purpose, depth, and style before proceeding. Do NOT call immediately when the user says "create a presentation" without context.

THEMES: "light" (warm beige, light mode — default) or "cinema" (rich gradients, dark). PALETTES: "default", "ocean", "sunset", "forest", "mono". The user's dashboard preference is used unless you pass style. Omit entity.color in add_scene by default — the player uses the palette automatically. Player URL: open in browser for user to watch.

RETURNS: session_id, player_url, embed_url (for iframe embedding), preferences (theme, palette), AND illustrations reference (entityTypes, aliases, shortKeys, topicHints, metadataHints). Use the illustrations data to choose the right entity types for add_scene.

LANGUAGE: For non-English presentations, set lang in the visual_script passed to add_scene. Supported: "en" (default), "fr", "it". TTS generates voice in the matching language.

WORKFLOW: 1) create_session → 2) add_scene (one or more calls to build frames) → 3) get_session_url (renders the inline player). Do NOT skip step 3 — add_scene only saves data, get_session_url displays it. On follow-up requests ("explain deeper", "add more slides", "expand on X"), use add_scene with the existing session_id — do NOT create a new session.

CALLBACK: When running locally, the player URL is auto-opened. For remote clients, share the player_url.
