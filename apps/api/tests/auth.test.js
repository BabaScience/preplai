import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/index.js';
import { User } from '../src/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'preplai-dev-secret-change-in-prod';

let app;

beforeEach(async () => {
  await User.deleteMany({});
  app = createApp();
});

function createVerifyToken(userId) {
  return jwt.sign(
    { userId, purpose: 'verify-email' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

describe('POST /api/auth/signup', () => {
  it('creates a new user and returns emailVerificationRequired', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.emailVerificationRequired).toBe(true);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.name).toBe('Test User');

    const user = await User.findOne({ email: 'test@example.com' });
    expect(user.emailVerified).toBe(false);
  });

  it('returns 400 if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });

  it('returns 400 if password is too short', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('8 characters');
  });

  it('returns 409 if email already exists', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'test@example.com', password: 'password123' });
    const userId = signupRes.body.user.id;
    const verifyToken = createVerifyToken(userId);
    await request(app).post('/api/auth/verify-email').send({ token: verifyToken });
  });

  it('returns token for valid credentials when verified', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('returns 403 for unverified user', async () => {
    await User.deleteMany({});
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'unverified@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unverified@example.com', password: 'password123' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.error).toContain('verify');
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid credentials');
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('returns 400 if email or password missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/verify-email', () => {
  it('verifies email with valid token', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'verify@example.com', password: 'password123' });
    const userId = signupRes.body.user.id;
    const verifyToken = createVerifyToken(userId);

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: verifyToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Email verified');

    const user = await User.findOne({ email: 'verify@example.com' });
    expect(user.emailVerified).toBe(true);
  });

  it('returns 400 for invalid token', async () => {
    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 for missing token', async () => {
    const res = await request(app).post('/api/auth/verify-email').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });
});

describe('POST /api/auth/resend-verification', () => {
  it('returns 200 for unverified user', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ email: 'resend@example.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'resend@example.com' });

    expect(res.status).toBe(200);
  });

  it('returns 200 for unknown email (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'nonexistent@example.com' });

    expect(res.status).toBe(200);
  });

  it('returns 200 for already verified user', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'verified@example.com', password: 'password123' });
    const verifyToken = createVerifyToken(signupRes.body.user.id);
    await request(app).post('/api/auth/verify-email').send({ token: verifyToken });

    const res = await request(app)
      .post('/api/auth/resend-verification')
      .send({ email: 'verified@example.com' });

    expect(res.status).toBe(200);
  });

  it('returns 400 if email missing', async () => {
    const res = await request(app).post('/api/auth/resend-verification').send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('required');
  });
});
