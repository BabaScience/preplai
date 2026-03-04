import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/index.js';
import { User } from '../src/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'preplai-dev-secret-change-in-prod';

describe('Monitoring', () => {
  let app;

  beforeEach(async () => {
    await User.deleteMany({});
    app = createApp();
  });

  it('GET /api/monitoring/overview returns 401 without auth', async () => {
    await request(app)
      .get('/api/monitoring/overview')
      .expect(401);
  });

  it('GET /api/monitoring/overview returns 403 for non-admin user', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'user@example.com',
      passwordHash,
      name: 'User',
      role: 'user',
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await request(app)
      .get('/api/monitoring/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('GET /api/monitoring/overview returns aggregated health and metrics for admin', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin',
      role: 'admin',
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get('/api/monitoring/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('api');
    expect(res.body.api).toHaveProperty('health');
    expect(res.body.api.health).toHaveProperty('status');
    expect(res.body.api.health).toHaveProperty('db');
    expect(res.body.api).toHaveProperty('metrics');
    expect(res.body.api.metrics).toHaveProperty('http_requests_total');
    expect(res.body).toHaveProperty('business');
    expect(res.body.business).toHaveProperty('users');
    expect(res.body.business).toHaveProperty('apiKeys');
    expect(res.body.business).toHaveProperty('sessions');
    expect(res.body.business).toHaveProperty('usageLast24h');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/monitoring/history returns 401 without auth', async () => {
    await request(app)
      .get('/api/monitoring/history')
      .expect(401);
  });

  it('GET /api/monitoring/history returns daily aggregates for admin', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await User.create({
      email: 'admin@example.com',
      passwordHash,
      name: 'Admin',
      role: 'admin',
    });
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get('/api/monitoring/history?days=7')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty('daily');
    expect(Array.isArray(res.body.daily)).toBe(true);
  });

  it('GET /monitoring serves dashboard HTML', async () => {
    const res = await request(app)
      .get('/monitoring')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Preplai Monitoring');
    expect(res.text).toContain('/api/monitoring/overview');
    expect(res.text).toContain('Admin Login');
  });
});
