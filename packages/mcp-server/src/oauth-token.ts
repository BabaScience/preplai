/**
 * @preplai/mcp-server — OAuth JWT validation and user→apiKey mapping
 *
 * Validates OAuth access tokens (JWT) issued by the API's OAuth server.
 * Maps the token's sub (userId) to a ValidatedKey for MCP tool handlers.
 */
import jwt from 'jsonwebtoken';
import { getOrCreateApiKeyForUser } from './auth.js';
import type { ValidatedKey } from './auth.js';
import { getMcpResource } from '@preplai/shared/node';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set. Generate with: openssl rand -hex 32');
  }
  return secret;
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
