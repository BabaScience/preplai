import bcrypt from 'bcryptjs';
import { initDb, closeDb } from '../db.js';

async function seed() {
  const db = initDb();

  console.log('Seeding database...');

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);

  try {
    db.prepare(
      'INSERT OR IGNORE INTO users (email, password_hash, name) VALUES (?, ?, ?)'
    ).run('demo@preplai.com', passwordHash, 'Demo User');

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@preplai.com');
    console.log('Created demo user:', user.email);

    // Create a sample API key
    const crypto = await import('crypto');
    const rawKey = 'pk_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    db.prepare(
      'INSERT OR IGNORE INTO api_keys (user_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'Default Key', keyHash, keyPrefix);

    console.log('Created sample API key:', keyPrefix + '...');

    // Create sample usage logs
    const insertLog = db.prepare(
      'INSERT INTO usage_logs (user_id, endpoint, tokens_used) VALUES (?, ?, ?)'
    );

    const sampleLogs = [
      [user.id, '/v1/chat/completions', 1250],
      [user.id, '/v1/embeddings', 500],
      [user.id, '/v1/chat/completions', 890],
      [user.id, '/v1/chat/completions', 2100],
      [user.id, '/v1/completions', 750],
    ];

    for (const log of sampleLogs) {
      insertLog.run(...log);
    }
    console.log(`Inserted ${sampleLogs.length} sample usage logs`);

  } catch (err) {
    console.error('Seed error:', err.message);
  }

  closeDb();
  console.log('Seeding complete!');
}

seed();
