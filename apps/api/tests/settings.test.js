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
    .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });
  token = res.body.token;
});

afterEach(() => {
  closeDb();
});

describe('GET /api/settings', () => {
  it('returns current user profile', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.name).toBe('Test User');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/settings/profile', () => {
  it('updates name', async () => {
    const res = await request(app)
      .patch('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('New Name');
  });

  it('returns 409 if email already used by another user', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'other@example.com', password: 'password123' });

    const res = await request(app)
      .patch('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'other@example.com' });

    expect(res.status).toBe(409);
  });

  it('returns 400 if no fields provided', async () => {
    const res = await request(app)
      .patch('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/settings/password', () => {
  it('updates password with correct current password', async () => {
    const res = await request(app)
      .patch('/api/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('updated');
  });

  it('returns 401 if current password is wrong', async () => {
    const res = await request(app)
      .patch('/api/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword456' });

    expect(res.status).toBe(401);
  });

  it('returns 400 if new password too short', async () => {
    const res = await request(app)
      .patch('/api/settings/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'password123', newPassword: 'short' });

    expect(res.status).toBe(400);
  });
});
