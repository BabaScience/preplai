import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { User, UsageLog } from '../src/db.js';

let app;
let token;
let userId;

beforeEach(async () => {
  await User.deleteMany({});
  await UsageLog.deleteMany({});
  app = createApp();

  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'test@example.com', password: 'password123' });
  token = res.body.token;
  userId = res.body.user.id;
});

async function insertLogs(n = 5) {
  for (let i = 0; i < n; i++) {
    await UsageLog.create({
      userId,
      endpoint: '/v1/chat/completions',
      tokensUsed: 100 * (i + 1),
    });
  }
}

describe('GET /api/usage/summary', () => {
  it('returns zeros for new user', async () => {
    const res = await request(app)
      .get('/api/usage/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.allTime.total_requests).toBe(0);
    expect(res.body.allTime.total_tokens).toBe(0);
  });

  it('returns correct totals with logs', async () => {
    await insertLogs(5);

    const res = await request(app)
      .get('/api/usage/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.allTime.total_requests).toBe(5);
    expect(res.body.allTime.total_tokens).toBe(1500); // 100+200+300+400+500
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/usage/summary');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/usage/logs', () => {
  it('returns empty logs for new user', async () => {
    const res = await request(app)
      .get('/api/usage/logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.logs).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('returns paginated logs', async () => {
    await insertLogs(5);

    const res = await request(app)
      .get('/api/usage/logs?limit=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.logs.length).toBe(3);
    expect(res.body.total).toBe(5);
  });
});
