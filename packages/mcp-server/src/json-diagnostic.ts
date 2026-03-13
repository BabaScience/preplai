/**
 * JSON Parse Error Diagnostics
 *
 * Pinpoints where a JSON parse error occurred and provides
 * actionable suggestions for the agent to fix it.
 */

export interface JsonDiagnostic {
  position: number;
  line: number;
  column: number;
  context: string;       // snippet around the error
  problem: string;       // human-readable explanation
  suggestion: string;    // what the agent should fix
}

/**
 * Analyse a JSON parse error and return a diagnostic that pinpoints
 * exactly where the problem is and what the agent should do to fix it.
 */
export function diagnoseJsonError(json: string, err: unknown): JsonDiagnostic {
  const msg = err instanceof Error ? err.message : String(err);

  // Extract position from Node error messages:
  //   "... in JSON at position 8402 (line 1 column 8403)"
  //   "Unexpected token X in JSON at position Y"
  const posMatch = msg.match(/position\s+(\d+)/i);
  const pos = posMatch ? Number(posMatch[1]) : Math.max(0, json.length - 1);

  // Compute line/column
  const before = json.slice(0, pos);
  const line = (before.match(/\n/g) || []).length + 1;
  const lastNewline = before.lastIndexOf('\n');
  const column = pos - lastNewline;

  // Context window: 60 chars around the error with a pointer
  const ctxStart = Math.max(0, pos - 40);
  const ctxEnd = Math.min(json.length, pos + 40);
  const snippet = json.slice(ctxStart, ctxEnd).replace(/\n/g, '\\n');
  const pointer = ' '.repeat(Math.min(40, pos - ctxStart)) + '^^^';
  const context = `${snippet}\n${pointer}`;

  // Characters near the error
  const charAtPos = json[pos] ?? '<EOF>';
  const nearBefore = json.slice(Math.max(0, pos - 15), pos);
  const nearAfter = json.slice(pos, Math.min(json.length, pos + 15));

  let problem: string;
  let suggestion: string;

  // Check truncation first — if JSON doesn't end with } or ], it was likely cut off
  const trimmedJson = json.trim();
  const lastChar = trimmedJson.slice(-1);
  const isTruncated = (lastChar !== '}' && lastChar !== ']') &&
    (pos >= json.length - 5 || msg.includes('end of JSON input'));
  if (isTruncated) {
    problem = `JSON appears truncated — ends with "${trimmedJson.slice(-30)}" instead of closing bracket.`;
    suggestion = `The response was cut off before completion. Reduce the number of frames or shorten narration text to stay within the output token limit.`;
    return { position: pos, line, column, context, problem, suggestion };
  }

  // Check if single quotes were used instead of double quotes
  if (charAtPos === "'" || nearAfter.startsWith("'") ||
      (msg.includes('Expected property name') && json.includes("'"))) {
    problem = `Single quotes used instead of double quotes at line ${line}.`;
    suggestion = `JSON requires double quotes " for all strings. Replace single quotes ' with double quotes " near line ${line}.`;
    return { position: pos, line, column, context, problem, suggestion };
  }

  if (msg.includes("Expected ',' or ']' after array element")) {
    problem = `Missing comma or bad content inside an array at line ${line}, col ${column} (position ${pos}). Found: '${charAtPos}'.`;
    suggestion = `Check the array near line ${line}. Likely causes: (1) missing comma between array elements, (2) unescaped double-quote inside a string — use \\" instead, (3) a literal newline inside narration text — use \\n instead.`;
  } else if (msg.includes("Expected ',' or '}' after property value")) {
    problem = `Missing comma between object properties at line ${line}, col ${column}.`;
    suggestion = `Add a comma after the property value near line ${line}. Every JSON property except the last needs a trailing comma.`;
  } else if (msg.includes('Unexpected token')) {
    const tokenMatch = msg.match(/Unexpected token\s+(.)/);
    const token = tokenMatch ? tokenMatch[1] : charAtPos;
    if (token === "'" || charAtPos === "'" || nearAfter.includes("'")) {
      problem = `Single quotes used instead of double quotes at line ${line}.`;
      suggestion = `JSON requires double quotes " for all strings. Replace single quotes ' with double quotes " near line ${line}.`;
    } else if (token === '\n' || token === '\r') {
      problem = `Literal newline inside a string at line ${line}.`;
      suggestion = `JSON strings cannot contain literal line breaks. Use \\n for newlines in narration text. Near: "${nearBefore.replace(/\n/g, '\\n')}".`;
    } else {
      problem = `Unexpected '${token}' at line ${line}, col ${column}.`;
      suggestion = `Check JSON near: "${nearBefore.replace(/\n/g, '\\n')}>>HERE>>${nearAfter.replace(/\n/g, '\\n')}". Common causes: trailing comma before }, missing comma between properties, or unescaped characters in strings.`;
    }
  } else if (msg.includes('Unterminated string')) {
    problem = `Unterminated string at line ${line} — missing closing double-quote.`;
    suggestion = `A string near line ${line} is missing its closing ". Check narration text for unescaped double-quotes (use \\") or literal newlines (use \\n).`;
  } else {
    problem = `Parse error at line ${line}, col ${column}: ${msg}`;
    suggestion = `Review JSON near: "${nearBefore.replace(/\n/g, '\\n')}>>HERE>>${nearAfter.replace(/\n/g, '\\n')}". Look for missing commas, unescaped quotes, or trailing commas.`;
  }

  return { position: pos, line, column, context, problem, suggestion };
}

/**
 * Format a diagnostic for console output.
 */
export function formatDiagnosticConsole(d: JsonDiagnostic, indent = '      '): string {
  return [
    `${indent}🔍 JSON PARSE ERROR DIAGNOSTIC`,
    `${indent}├─ Where: line ${d.line}, column ${d.column} (position ${d.position})`,
    `${indent}├─ Problem: ${d.problem}`,
    `${indent}├─ Fix: ${d.suggestion}`,
    `${indent}└─ Context:`,
    ...d.context.split('\n').map((l: string) => `${indent}   ${l}`),
  ].join('\n');
}

/**
 * Format a diagnostic for MCP tool error responses (agent-facing).
 * Concise and actionable.
 */
export function formatDiagnosticMcp(d: JsonDiagnostic): string {
  return [
    `JSON parse error at line ${d.line}, column ${d.column}.`,
    `Problem: ${d.problem}`,
    `How to fix: ${d.suggestion}`,
  ].join('\n');
}

/**
 * Try to parse JSON, returning either the parsed value or a diagnostic.
 */
export function safeParseJson(text: string): { ok: true; value: any } | { ok: false; diagnostic: JsonDiagnostic } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (err) {
    return { ok: false, diagnostic: diagnoseJsonError(text, err) };
  }
}
