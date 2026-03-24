# Preplai Monorepo Refactoring TODO

## Critical (Security / Broken)
- [x] Fix JWT_SECRET validation gap in API — added production validation to all 3 API auth files
- [x] Fix website proxy port (5001 → 5000) — corrected vite.config.js

## High Priority (Code Duplication)
- [x] Consolidate 8 text wrapping implementations — all now delegate to canonical `wrapBodyText` in illustrations/utils.ts
- [x] Unify entity type lists — created `@preplai/shared/entity-types.ts`, compiler now imports from shared
- [x] Extract CONNECTION_TYPES / HEADING_TYPES to shared — quality-scorer and quality-guards now import from shared

## Medium Priority (Infrastructure)
- [x] Create `@preplai/shared/math.ts` — clamp, distance, lerp, stdDev, mean (used by quality-scorer)
- [x] Move `generateApiKey` + `KEY_PREFIX` to shared — `@preplai/shared/node` subpath, API keys.js uses it
- [x] Centralize base URL construction — `@preplai/shared/node` urls.ts, oauth.js uses it
- [ ] Standardize `Result` type across packages (ApiResponse vs McpToolResult vs CompileResult)
- [ ] Merge dual palette systems (shared/palettes.ts vs illustrations/design-tokens.ts)
- [ ] Unify Prometheus metrics registries (api/metrics.js vs mcp-server/metrics.ts)

## New Shared Modules Created
- `packages/shared/src/math.ts` — common math utilities
- `packages/shared/src/entity-types.ts` — canonical entity classification sets
- `packages/shared/src/crypto.ts` — API key generation and hashing
- `packages/shared/src/urls.ts` — base URL construction
- `packages/shared/src/node.ts` — Node-only subpath entry (`@preplai/shared/node`)

## Verification
- [x] Build all packages successfully (full `pnpm run build`)
- [x] Run tests — 878/878 pass across 30 test files
- [x] Vitest config updated with `@preplai/shared/node` alias
