import './load-env.js';

import crypto from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
import express from 'express';
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
  });
}

import cors from 'cors';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { connectDb, isDbConnected } from './db.js';
import { logger } from './logger.js';
import { metricsMiddleware, register, updateMongoConnectionGauge } from './metrics.js';

import { getMonitoringOverview, getMonitoringHistory } from './monitoring.js';
import { authenticateAdmin } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import keysRoutes from './routes/keys.js';
import usageRoutes from './routes/usage.js';
import settingsRoutes from './routes/settings.js';
import sessionsRoutes from './routes/sessions.js';
import oauthRoutes from './routes/oauth.js';
import oauthClientsRoutes from './routes/oauth-clients.js';
import supportRoutes from './routes/support.js';

const PORT = process.env.PORT || 5000;

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['http://localhost:5173'];

export function createApp() {
  const app = express();

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
  }

  app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
    }
    next();
  });
  app.use(pinoHttp({ logger, genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID() }));
  // OAuth 2.0 token endpoint expects application/x-www-form-urlencoded (RFC 6749)
  app.use(express.urlencoded({ extended: true }));
  app.use(metricsMiddleware);

  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  app.get('/api/monitoring/overview', authenticateAdmin, async (req, res) => {
    try {
      const overview = await getMonitoringOverview();
      res.json(overview);
    } catch (err) {
      req.log?.error({ err }, 'Monitoring overview failed');
      res.status(500).json({ error: 'Failed to fetch monitoring data' });
    }
  });

  app.get('/api/monitoring/history', authenticateAdmin, async (req, res) => {
    try {
      const days = req.query.days || 7;
      const history = await getMonitoringHistory(days);
      res.json(history);
    } catch (err) {
      req.log?.error({ err }, 'Monitoring history failed');
      res.status(500).json({ error: 'Failed to fetch monitoring history' });
    }
  });

  app.get('/monitoring', (_req, res) => {
    res.sendFile(join(__dirname, 'monitoring-dashboard.html'));
  });

  app.get('/health', (req, res) => {
    const dbConnected = isDbConnected();
    const status = dbConnected ? 'ok' : 'degraded';
    const payload = {
      status,
      db: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
    if (!dbConnected) {
      res.status(503).json(payload);
    } else {
      res.json(payload);
    }
  });

  app.use(oauthRoutes);
  app.use('/api', oauthClientsRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/keys', keysRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/api/support', supportRoutes);

  if (process.env.SENTRY_DSN) {
    app.use(Sentry.Handlers.errorHandler());
  }

  app.use((err, req, res, next) => {
    const log = req.log ? req.log.child({ reqId: req.id }) : logger;
    log.error({ err, stack: err.stack }, 'Request error');
    if (req.id) res.setHeader('X-Request-ID', req.id);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  connectDb()
    .then(() => {
      updateMongoConnectionGauge();
      setInterval(updateMongoConnectionGauge, 30000);
      const app = createApp();
      app.listen(PORT, () => {
        logger.info({ port: PORT }, 'Preplai API running');
      });
    })
    .catch((err) => {
      logger.error({ err }, 'Failed to connect to MongoDB');
      process.exit(1);
    });
}
