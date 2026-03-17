import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Alert from '../components/Alert';
import Input from '../components/Input';
import { apiResetPassword } from '../lib/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <Logo showWordmark={false} />
          </div>
          <h1 style={{ textAlign: 'center' }}>Invalid link</h1>
          <p className="auth-sub" style={{ textAlign: 'center' }}>
            This password reset link is invalid or has expired.
          </p>
          <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <Link to="/forgot-password" className="btn btn-primary btn-lg" style={{ display: 'inline-block' }}>
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await apiResetPassword(token, password);
      navigate('/login?reset=1');
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
          <Logo showWordmark={false} />
        </div>
        <h1 style={{ textAlign: 'center' }}>Reset your password</h1>
        <p className="auth-sub" style={{ textAlign: 'center' }}>
          Choose a new password for your account.
        </p>

        <Alert variant="error">{error}</Alert>

        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="New password"
            id="reset-password"
            type="password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm password"
            id="reset-confirm-password"
            type="password"
            placeholder="Repeat your password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

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
