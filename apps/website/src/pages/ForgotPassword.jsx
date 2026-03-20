import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Alert from '../components/Alert';
import Input from '../components/Input';
import { apiForgotPassword } from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiForgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Logo />
        </div>
        <h1 style={{ textAlign: 'center' }}>Forgot your password?</h1>
        <p className="auth-sub" style={{ textAlign: 'center' }}>
          Enter your email and we'll send you a link to reset your password.
        </p>

        <Alert variant="error">{error}</Alert>

        {success ? (
          <Alert variant="success">
            If an account with that email exists, we've sent a password reset link. Check your inbox.
          </Alert>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <Input
              label="Email"
              id="forgot-email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link to="/login" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>
            Back to login
          </Link>
          {' · '}
          <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
