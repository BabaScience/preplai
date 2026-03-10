/**
 * @preplai/compiler — Package Entry Point
 *
 * Re-exports the public API of the compiler package.
 */

export { compileVisualScript } from './compile.js';

export type {
  CompileResult,
  CompilerError,
  CompilerWarning,
  CompilerErrorCode,
  CompilerWarningCode,
} from './types.js';

export {
  KNOWN_ENTITY_TYPES,
  BASE_ENTITY_SIZES,
  SKIP_CLAMP_TYPES,
} from './types.js';

export { ENTITY_TYPE_ALIASES, AGENT_SHORT_KEYS, stage0Expand } from './stage0-expand.js';
export { stage2bEnrich } from './stage2b-enrich.js';
