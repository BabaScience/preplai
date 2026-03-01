import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';

import authRoutes from './routes/auth.js';
import keysRoutes from './routes/keys.js';
import usageRoutes from './routes/usage.js';
import settingsRoutes from './routes/settings.js';

const PORT = process.env.PORT || 5000;

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/keys', keysRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/settings', settingsRoutes);

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  connectDb()
    .then(() => {
      const app = createApp();
      app.listen(PORT, () => {
        console.log(`Preplai API running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
}
