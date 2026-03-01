import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Alert from '../components/Alert';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, password);
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
          <Logo showWordmark={false} />
        </div>
        <h1 style={{ textAlign: 'center' }}>Create your account</h1>
        <p className="auth-sub" style={{ textAlign: 'center' }}>
          Get started with preplai for free.
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
            placeholder="Min. 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
