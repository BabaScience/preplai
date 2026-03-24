/**
 * @preplai/shared — URL Construction
 *
 * Canonical base URL getters for API, website, and MCP server.
 * Single source of truth — prevents URL drift across packages.
 */

/** Get the API base URL (apps/api). */
export function getApiBase(): string {
  return (
    process.env.API_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://api.preplai.com'
      : 'http://localhost:5001')
  );
}

/** Get the website base URL (apps/website). */
export function getWebsiteBase(): string {
  return (
    process.env.WEBSITE_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://preplai.com'
      : 'http://localhost:5173')
  );
}

/** Get the MCP server / player base URL (packages/mcp-server). */
export function getMcpResource(): string {
  return (
    process.env.MCP_RESOURCE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://player.preplai.com'
      : 'http://localhost:5005')
  );
}
