/**
 * @pre/mcp-server — MCP Tool Result Helpers
 *
 * Standard response formatters for MCP tool handlers.
 * All responses follow the { content: [{ type: 'text', text: JSON }] } shape.
 */

/** MCP tool content result shape */
export interface McpToolContent {
  content: Array<{ type: 'text'; text: string }>;
}

/**
 * Wrap a success payload in MCP tool content format.
 */
export function mcpOk(data: Record<string, unknown>): McpToolContent {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ success: true, data }),
    }],
  };
}

/**
 * Wrap a structured error in MCP tool content format.
 */
export function mcpErr(
  code: string,
  message: string,
  suggestion: string,
): McpToolContent {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: { code, message, suggestion },
      }),
    }],
  };
}

/**
 * Standard SESSION_NOT_FOUND error response.
 */
export function mcpNotFound(sessionId: string): McpToolContent {
  return mcpErr(
    'SESSION_NOT_FOUND',
    `Session ${sessionId} does not exist.`,
    'Call create_session first and use the returned session_id.',
  );
}

/**
 * Format validation error into an MCP error.
 * Accepts either a plain string message or Zod-style issues array.
 */
export function mcpValidationError(
  issues: string | Array<{ path: (string | number)[]; message: string }>,
): McpToolContent {
  const detail = typeof issues === 'string'
    ? issues
    : issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');

  return mcpErr(
    'VALIDATION_ERROR',
    `Input validation failed: ${detail}`,
    'Fix the listed field errors and retry the tool call.',
  );
}

/**
 * Wrap a handler in a try/catch that returns INTERNAL_ERROR on exception.
 */
export function withErrorBoundary<T>(
  handler: (args: T) => Promise<McpToolContent>,
): (args: T) => Promise<McpToolContent> {
  return async (args: T) => {
    try {
      return await handler(args);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      return mcpErr(
        'INTERNAL_ERROR',
        message,
        'Retry the operation. If the problem persists, check server logs.',
      );
    }
  };
}
