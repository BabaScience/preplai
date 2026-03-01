import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import ProgressBar from '../../components/ProgressBar';
import Alert from '../../components/Alert';
import { useTheme } from '../../context/ThemeContext';
import { apiGetUsage } from '../../lib/api';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildChartData(daily) {
  const today = new Date();
  const dailyMap = {};
  (daily || []).forEach((d) => { dailyMap[d.day] = d.count; });
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({
      date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      scenes: dailyMap[key] || 0,
    });
  }
  return result;
}

export default function Usage() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetUsage()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isDark = currentTheme === 'dark';
  const chartColors = {
    fill: isDark ? 'rgba(201, 168, 76, 0.6)' : 'rgba(184, 149, 47, 0.6)',
    stroke: isDark ? '#C9A84C' : '#B8952F',
    grid: isDark ? 'rgba(42, 43, 54, 0.5)' : 'rgba(216, 214, 209, 0.5)',
    text: isDark ? '#8a8b95' : '#6b6c78',
    tooltipBg: isDark ? '#1a1b24' : '#F5F4F1',
    tooltipBorder: isDark ? '#333444' : '#CBC9C3',
    tooltipText: isDark ? '#e8e6e3' : '#1a1b24',
  };

  return (
    <DashboardLayout title="Usage">
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <>
          {/* Limits */}
          <div className="limits-grid">
            <div className="limit-card">
              <div className="limit-header">
                <span className="limit-label">Scenes This Month</span>
                <span className="limit-value">
                  {data?.month_scenes ?? 0} / {data?.limits?.max_scenes_month ?? '—'}
                </span>
              </div>
              <ProgressBar
                value={data?.month_scenes ?? 0}
                max={data?.limits?.max_scenes_month ?? 100}
              />
            </div>
            <div className="limit-card">
              <div className="limit-header">
                <span className="limit-label">Sessions Limit</span>
                <span className="limit-value">{data?.limits?.max_sessions ?? '—'}</span>
              </div>
              <ProgressBar
                value={data?.active_keys ?? 0}
                max={data?.limits?.max_sessions ?? 100}
              />
            </div>
            <div className="limit-card">
              <div className="limit-header">
                <span className="limit-label">Scenes Per Session</span>
                <span className="limit-value">{data?.limits?.max_scenes_session ?? '—'}</span>
              </div>
              <ProgressBar value={0} max={100} />
            </div>
          </div>

          {/* Chart */}
          <div className="chart-container">
            <h3>Daily Scene Usage (Last 30 Days)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={buildChartData(data?.daily)} barCategoryGap="30%">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartColors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartColors.text, fontSize: 10 }}
                  axisLine={{ stroke: chartColors.grid }}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: chartColors.text, fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    borderRadius: '8px',
                    color: chartColors.tooltipText,
                    fontSize: '12px',
                    padding: '12px',
                  }}
                  cursor={{ fill: 'rgba(201,168,76,0.05)' }}
                />
                <Bar
                  dataKey="scenes"
                  fill={chartColors.fill}
                  stroke={chartColors.stroke}
                  strokeWidth={1}
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent API Calls */}
          {data?.recent?.length > 0 ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <h3 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
              }}>
                Recent API Calls
              </h3>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Endpoint</th>
                    <th>Key</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((r, i) => (
                    <tr key={i}>
                      <td style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {formatDate(r.created_at)}
                      </td>
                      <td>
                        <code style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-primary)',
                        }}>
                          {r.endpoint}
                        </code>
                      </td>
                      <td>
                        <code style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--color-text-muted)',
                        }}>
                          {r.key_display}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              No API calls recorded yet.
            </p>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
