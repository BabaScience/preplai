import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Logo from '../components/Logo';
import Alert from '../components/Alert';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';
import { trackEvent, setUserProperties } from '../lib/analytics';

export default function Signup() {
  const { token, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (token) {
    const returnTo = new URLSearchParams(location.search).get('return_to');
    if (returnTo && returnTo.startsWith('http')) {
      window.location.href = returnTo;
      return null;
    }
    const from = location.state?.from?.pathname ?? '/dashboard/overview';
    return <Navigate to={from} replace />;
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await signup(email, password);
      trackEvent('sign_up', { method: 'email' });
      setUserProperties({ user_email_domain: email.split('@')[1] || '' });
      if (data.emailVerificationRequired) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      const returnTo = new URLSearchParams(location.search).get('return_to');
      if (returnTo && returnTo.startsWith('http')) {
        window.location.href = returnTo;
        return;
      }
      navigate('/dashboard/overview');
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
        <h1 style={{ textAlign: 'center' }}>Start watching, not reading.</h1>
        <p className="auth-sub" style={{ textAlign: 'center' }}>
          Create your free account. No credit card required.
        </p>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', opacity: 0.6, marginTop: -8, marginBottom: 16 }}>
          Join thousands of professionals who watch their AI answers instead of reading them.
        </p>
        <Alert variant="error">{error}</Alert>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input
            label="Email"
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            id="auth-password"
            type="password"
            placeholder="Min. 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm Password"
            id="auth-confirm-password"
            type="password"
            placeholder="Type your password again"
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
          <Link to="/" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-faint)' }}>
            &larr; Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
