import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import Alert from '../components/Alert';
import Input from '../components/Input';
import { apiVerifyEmail, apiResendVerification } from '../lib/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = useState('loading'); // loading | success | error | check-email
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('check-email');
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        await apiVerifyEmail(token);
        if (!cancelled) {
          setStatus('success');
          setTimeout(() => navigate('/login?verified=1'), 2000);
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setError(err.message);
        }
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  const handleResend = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);
    setResendLoading(true);
    try {
      await apiResendVerification(resendEmail);
      setResendSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <Logo />
        </div>

        {status === 'loading' && (
          <>
            <h1 style={{ textAlign: 'center' }}>Verifying your email</h1>
            <p className="auth-sub" style={{ textAlign: 'center' }}>
              Please wait...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1 style={{ textAlign: 'center' }}>Email verified!</h1>
            <p className="auth-sub" style={{ textAlign: 'center' }}>
              Redirecting you to login...
            </p>
          </>
        )}

        {(status === 'error' || status === 'check-email') && (
          <>
            <h1 style={{ textAlign: 'center' }}>
              {status === 'error' ? 'Verification failed' : 'Check your email'}
            </h1>
            <p className="auth-sub" style={{ textAlign: 'center' }}>
              {status === 'error'
                ? 'The verification link may have expired. Request a new one below.'
                : 'We sent a verification link to your email. Click it to verify your account.'}
            </p>

            <Alert variant="error">{error}</Alert>
            {resendSuccess && (
              <Alert variant="success">Verification email sent. Check your inbox.</Alert>
            )}

            <form className="auth-form" onSubmit={handleResend}>
              <Input
                label="Email"
                id="resend-email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
              />
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={resendLoading}
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
            </form>
          </>
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
