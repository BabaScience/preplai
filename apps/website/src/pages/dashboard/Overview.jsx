import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
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
      {loading ? (
        <>
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <Skeleton height="28px" width="200px" style={{ marginBottom: 'var(--space-2)' }} />
            <Skeleton height="16px" width="160px" />
          </div>
          <div className="kpi-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="kpi-card">
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
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-xl)',
              fontStyle: 'italic',
              marginBottom: 'var(--space-2)',
            }}>
              Welcome back
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>{email}</p>
          </div>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-label">API Keys</div>
              <div className="kpi-value">{data?.total_keys ?? 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Requests This Month</div>
              <div className="kpi-value">{data?.month_requests ?? 0}</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Total Scenes</div>
              <div className="kpi-value">{data?.total_scenes ?? 0}</div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/dashboard/keys')}
          >
            <Plus size={16} />
            Create New API Key
          </button>
        </>
      )}
    </DashboardLayout>
  );
}
