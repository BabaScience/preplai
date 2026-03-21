/**
 * @preplai/mcp-server — OAuth JWT validation and user→apiKey mapping
 *
 * Validates OAuth access tokens (JWT) issued by the API's OAuth server.
 * Maps the token's sub (userId) to a ValidatedKey for MCP tool handlers.
 */
import jwt from 'jsonwebtoken';
import { getOrCreateApiKeyForUser } from './auth.js';
import type { ValidatedKey } from './auth.js';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === 'preplai-dev-secret-change-in-prod') {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
  }
  return secret ?? 'preplai-dev-secret-change-in-prod';
}

function getMcpResource(): string {
  return process.env.NODE_ENV === 'production'
    ? 'https://player.preplai.com'
    : process.env.MCP_RESOURCE_URL ?? 'http://localhost:5005';
}

export interface OAuthPayload {
  sub: string;
  aud: string | string[];
  iss: string;
  scope?: string;
  exp?: number;
}

/**
 * Validate OAuth JWT and return ValidatedKey for the user.
 * Returns null if token is invalid.
 */
export async function validateOAuthToken(token: string): Promise<ValidatedKey | null> {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as OAuthPayload;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const resource = getMcpResource().replace(/\/$/, '');
    if (!aud.some((a) => a === resource || a === `${resource}/` || a === `${resource}/mcp`)) {
      return null;
    }

    return getOrCreateApiKeyForUser(payload.sub);
  } catch {
    return null;
  }
}
