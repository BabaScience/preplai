import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/index.js';
import { initDb, closeDb } from '../src/db.js';

let app;
let token;

beforeEach(async () => {
  initDb();
  app = createApp();

  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email: 'test@example.com', password: 'password123' });
  token = res.body.token;
});

afterEach(() => {
  closeDb();
});

describe('GET /api/keys', () => {
  it('returns empty array for new user', async () => {
    const res = await request(app)
      .get('/api/keys')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.keys).toEqual([]);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/keys');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/keys', () => {
  it('creates a new API key', async () => {
    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'My Key' });

    expect(res.status).toBe(201);
    expect(res.body.key.name).toBe('My Key');
    expect(res.body.key.rawKey).toMatch(/^pk_/);
    expect(res.body.key.key_prefix).toBe(res.body.key.rawKey.substring(0, 10));
  });

  it('returns 400 if name is missing', async () => {
    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/keys')
      .send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('enforces 10 key limit', async () => {
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/keys')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Key ${i}` });
    }

    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Key 11' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Maximum');
  });
});

describe('DELETE /api/keys/:id', () => {
  let keyId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/keys')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To Delete' });
    keyId = res.body.key.id;
  });

  it('deletes an existing key', async () => {
    const res = await request(app)
      .delete(`/api/keys/${keyId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('deleted');
  });

  it('returns 404 for non-existent key', async () => {
    const res = await request(app)
      .delete('/api/keys/99999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/keys/${keyId}`);
    expect(res.status).toBe(401);
  });
});
