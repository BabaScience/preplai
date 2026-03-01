import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDb, closeDb, User, ApiKey, UsageLog } from '../db.js';

const KEY_PREFIX = 'plai_';

async function seed() {
  await connectDb();

  console.log('Seeding database...');

  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    let user = await User.findOne({ email: 'demo@preplai.com' });
    if (!user) {
      user = await User.create({
        email: 'demo@preplai.com',
        passwordHash,
        name: 'Demo User',
      });
    }
    console.log('Created demo user:', user.email);

    const rawKey = KEY_PREFIX + crypto.randomBytes(20).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const existingKey = await ApiKey.findOne({ keyHash });
    if (!existingKey) {
      await ApiKey.create({
        userId: user._id,
        name: 'Default Key',
        keyHash,
        keyPrefix,
        ownerEmail: user.email,
        tier: 'free',
      });
      console.log('Created sample API key:', keyPrefix + '...');
    }

    const count = await UsageLog.countDocuments({ userId: user._id });
    if (count === 0) {
      const sampleLogs = [
        { endpoint: '/v1/chat/completions', tokensUsed: 1250 },
        { endpoint: '/v1/embeddings', tokensUsed: 500 },
        { endpoint: '/v1/chat/completions', tokensUsed: 890 },
        { endpoint: '/v1/chat/completions', tokensUsed: 2100 },
        { endpoint: '/v1/completions', tokensUsed: 750 },
      ];

      for (const log of sampleLogs) {
        await UsageLog.create({
          userId: user._id,
          endpoint: log.endpoint,
          tokensUsed: log.tokensUsed,
        });
      }
      console.log(`Inserted ${sampleLogs.length} sample usage logs`);
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }

  await closeDb();
  console.log('Seeding complete!');
}

seed();
