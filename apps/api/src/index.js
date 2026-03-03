import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDb } from './db.js';

import authRoutes from './routes/auth.js';
import keysRoutes from './routes/keys.js';
import usageRoutes from './routes/usage.js';
import settingsRoutes from './routes/settings.js';
import sessionsRoutes from './routes/sessions.js';
import oauthRoutes from './routes/oauth.js';
import oauthClientsRoutes from './routes/oauth-clients.js';

const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:5173'];

export function createApp() {
  const app = express();

  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(oauthRoutes);
  app.use('/api', oauthClientsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/keys', keysRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/sessions', sessionsRoutes);

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
