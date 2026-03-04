/**
 * Structured logger for preplai-api.
 * Uses pino with JSON output and LOG_LEVEL env support.
 */
import pino from 'pino';

const logLevel = process.env.LOG_LEVEL ?? 'info';

export const logger = pino({
  level: logLevel,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
