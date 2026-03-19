import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Key, Activity, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Skeleton from '../../components/Skeleton';
import Alert from '../../components/Alert';
import { useAuth } from '../../context/AuthContext';
import { apiGetOverview } from '../../lib/api';

export default function Overview() {
  const { email } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetOverview()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout title="Overview">
      <style>{`
        .ov-welcome {
          margin-bottom: 32px;
        }
        .ov-welcome h2 {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-style: italic;
          margin-bottom: var(--space-2);
          color: var(--color-text);
        }
        .ov-welcome p {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }

        .ov-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }
        .ov-stat {
          flex: 1;
          padding: 22px 24px;
          border-radius: var(--radius-xl, 16px);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-left: 4px solid var(--stat-accent);
          transition: box-shadow 180ms;
        }
        .ov-stat:hover {
          box-shadow: var(--shadow-md);
        }
        .ov-stat-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--stat-bg);
          margin-bottom: 14px;
          color: var(--stat-accent);
        }
        .ov-stat-label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-muted);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .ov-stat-value {
          font-size: 28px;
          font-weight: 700;
          font-family: var(--font-body);
          color: var(--stat-accent);
        }

        .ov-action {
          margin-top: 8px;
        }

        @media (max-width: 640px) {
          .ov-stats {
            flex-direction: column;
          }
        }
      `}</style>

      {loading ? (
        <>
          <div className="ov-welcome">
            <Skeleton height="28px" width="200px" style={{ marginBottom: 'var(--space-2)' }} />
            <Skeleton height="16px" width="160px" />
          </div>
          <div className="ov-stats">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ov-stat" style={{ '--stat-accent': 'var(--color-text-muted)', '--stat-bg': 'var(--color-surface-dynamic)' }}>
                <Skeleton height="14px" width="80px" style={{ marginBottom: 'var(--space-2)' }} />
                <Skeleton height="28px" width="60px" />
              </div>
            ))}
          </div>
        </>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <>
          <div className="ov-welcome">
            <h2>Welcome back</h2>
            <p>{email}</p>
          </div>

          <div className="ov-stats">
            <div className="ov-stat" style={{ '--stat-accent': 'var(--color-primary)', '--stat-bg': 'var(--color-primary-highlight)' }}>
              <div className="ov-stat-icon">
                <Key size={18} />
              </div>
              <div className="ov-stat-label">Access Tokens</div>
              <div className="ov-stat-value">{data?.total_keys ?? 0}</div>
            </div>
            <div className="ov-stat" style={{ '--stat-accent': '#3498DB', '--stat-bg': 'rgba(52, 152, 219, 0.1)' }}>
              <div className="ov-stat-icon">
                <Activity size={18} />
              </div>
              <div className="ov-stat-label">Requests This Month</div>
              <div className="ov-stat-value">{data?.month_requests ?? 0}</div>
            </div>
            <div className="ov-stat" style={{ '--stat-accent': '#4ECDC4', '--stat-bg': 'rgba(78, 205, 196, 0.1)' }}>
              <div className="ov-stat-icon">
                <BarChart3 size={18} />
              </div>
              <div className="ov-stat-label">Total Requests</div>
              <div className="ov-stat-value">{data?.total_scenes ?? 0}</div>
            </div>
          </div>

          <div className="ov-action">
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/keys')}
            >
              <Plus size={16} />
              Create Access Token
            </button>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
