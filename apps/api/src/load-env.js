/**
 * Load .env files before any other application code.
 * Must be imported first so process.env is populated before email service etc. load.
 */
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '..', '..', '.env') });
config({ path: join(__dirname, '..', '.env') });
