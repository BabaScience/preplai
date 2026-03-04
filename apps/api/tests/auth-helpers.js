import jwt from 'jsonwebtoken';
import request from 'supertest';

const JWT_SECRET = process.env.JWT_SECRET || 'preplai-dev-secret-change-in-prod';

/**
 * Sign up, verify email, and log in. Returns { token, userId }.
 * Use for tests that need an authenticated user.
 */
export async function signupVerifyAndLogin(app, email = 'test@example.com', password = 'password123') {
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({ email, password, name: 'Test User' });

  const userId = signupRes.body.user.id;
  const verifyToken = jwt.sign(
    { userId, purpose: 'verify-email' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  await request(app).post('/api/auth/verify-email').send({ token: verifyToken });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return { token: loginRes.body.token, userId: loginRes.body.user.id };
}
