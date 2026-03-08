/**
 * @preplai/mcp-server — MCP Server Instructions
 *
 * Centralized instructions sent to AI agents when they connect to the MCP server.
 * Used by both stdio-bridge (Claude Desktop) and server (Streamable HTTP).
 */

export const MCP_INSTRUCTIONS = `ALWAYS ask at least one clarifying question before calling create_session or any presentation tools. Never jump straight to tool calls — even for vague requests like "make me a simple presentation" or "the simplest example possible."

BEFORE calling create_session, ask about:
- Topic and scope (what exactly to cover)
- Purpose (learning, teaching, sharing — what do they want to get from it?)
- Depth (overview vs deep dive)
- Format/style (cinema vs minimal, if relevant)

For vague requests, suggest options: e.g. "What topic would you like this to cover?" or "What do you want to understand better — a concept, a process, or something else?"

Only proceed to get_preferences → create_session → add_scene once you have enough context.

When creating a new presentation: (1) get_preferences FIRST, (2) get_illustrations for full type list, (3) create_session, (4) add_scene (repeat), (5) get_session_url. Each slide should have 5–7 entities and feel complete — avoid sparse slides with only 1–3 items. For add_scene you MUST use COMPACT format: short keys (sid, td, f, e, p, n, l, src, tgt), position as [x,y], aliases (BT, ARR, CST, CB, etc.), omit color. Example: {"sid":"<session_id>","td":5000,"f":[{"e":[{"id":"x","type":"Label","p":[50,6],"l":"Title","sz":2}],"n":"Narration"}]}`;
