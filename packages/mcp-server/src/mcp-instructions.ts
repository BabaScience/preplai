/**
 * @preplai/mcp-server — MCP Server Instructions
 *
 * Centralized instructions sent to AI agents when they connect to the MCP server.
 * Used by both stdio-bridge (Claude Desktop) and server (Streamable HTTP).
 */

export const MCP_INSTRUCTIONS = `BEFORE calling create_session: Ask the user 2-3 clarifying questions about:
- Topic and scope (what exactly to cover)
- Audience (technical vs non-technical, beginner vs expert)
- Depth (overview vs deep dive)
- Style preference (cinema vs minimal, if any)

Only proceed to get_preferences and create_session once you have enough context. Do NOT jump straight to tool calls when the user says "create a presentation" without details.

When creating a new presentation: (1) get_preferences FIRST, (2) get_illustrations for full type list, (3) create_session, (4) add_scene (repeat), (5) get_session_url. For add_scene you MUST use COMPACT format: short keys (sid, td, f, e, p, n, l, src, tgt), position as [x,y], aliases (BT, ARR, CST, CB, etc.), omit color. Example: {"sid":"<session_id>","td":5000,"f":[{"e":[{"id":"x","type":"Label","p":[50,6],"l":"Title","sz":2}],"n":"Narration"}]}`;
