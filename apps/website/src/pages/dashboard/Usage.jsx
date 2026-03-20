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
import { Layers, Database } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import ProgressBar from '../../components/ProgressBar';
import Alert from '../../components/Alert';
import { useTheme } from '../../context/ThemeContext';
import { apiGetUsage } from '../../lib/api';
import { formatDate } from '../../utils/format';

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
      <style>{`
        .usg-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }
        .usg-stat {
          flex: 1;
          padding: 22px 24px;
          border-radius: var(--radius-xl, 16px);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-left: 4px solid var(--stat-accent);
          transition: box-shadow 180ms;
        }
        .usg-stat:hover {
          box-shadow: var(--shadow-md);
        }
        .usg-stat-icon {
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
        .usg-stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .usg-stat-label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .usg-stat-value {
          font-size: 14px;
          font-weight: 600;
          font-family: var(--font-body);
          color: var(--color-text);
          font-variant-numeric: tabular-nums;
        }
        .usg-stat-hint {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin-top: var(--space-2);
        }

        /* Chart card */
        .usg-chart-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl, 16px);
          padding: 24px;
          margin-bottom: 32px;
        }
        .usg-chart-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 20px;
        }

        /* Logs table */
        .usg-table-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl, 16px);
          overflow: hidden;
        }
        .usg-table-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
          padding: 20px 24px 0;
          margin-bottom: 16px;
        }
        .usg-table-scroll {
          overflow-x: auto;
        }
        .usg-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .usg-table thead {
          background: var(--color-surface-offset);
        }
        .usg-table th {
          text-align: left;
          padding: 12px 16px;
          font-weight: 600;
          color: var(--color-text-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          border-bottom: 1px solid var(--color-divider);
          white-space: nowrap;
        }
        .usg-table td {
          text-align: left;
          padding: 14px 16px;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-divider);
          vertical-align: middle;
        }
        .usg-table tbody tr {
          transition: background 150ms;
        }
        .usg-table tbody tr:nth-child(even) {
          background: var(--color-surface-offset);
        }
        .usg-table tbody tr:hover {
          background: var(--color-surface-dynamic);
        }
        .usg-table tbody tr:last-child td {
          border-bottom: none;
        }

        .usg-empty {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
          text-align: center;
          padding: 40px 20px;
        }

        @media (max-width: 640px) {
          .usg-stats {
            flex-direction: column;
          }
        }
      `}</style>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : (
        <>
          {/* Stat cards with progress bars */}
          <div className="usg-stats">
            <div className="usg-stat" style={{ '--stat-accent': '#3498DB', '--stat-bg': 'rgba(52, 152, 219, 0.1)' }}>
              <div className="usg-stat-icon">
                <Database size={18} />
              </div>
              <div className="usg-stat-header">
                <span className="usg-stat-label">Presentations</span>
                <span className="usg-stat-value">
                  {data?.session_count ?? 0} / {data?.limits?.max_sessions ?? '--'}
                </span>
              </div>
              <ProgressBar
                value={data?.session_count ?? 0}
                max={data?.limits?.max_sessions ?? 100}
              />
              <p className="usg-stat-hint">
                Delete a presentation to free up a slot.
              </p>
            </div>
            <div className="usg-stat" style={{ '--stat-accent': 'var(--color-primary)', '--stat-bg': 'var(--color-primary-highlight)' }}>
              <div className="usg-stat-icon">
                <Layers size={18} />
              </div>
              <div className="usg-stat-header">
                <span className="usg-stat-label">Scenes This Month</span>
                <span className="usg-stat-value">
                  {data?.month_scenes ?? 0}
                </span>
              </div>
              <p className="usg-stat-hint">
                Unlimited scenes on all plans.
              </p>
            </div>
          </div>

          {/* Chart */}
          <div className="usg-chart-card">
            <h3 className="usg-chart-title">Daily Scene Usage (Last 30 Days)</h3>
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
            <div className="usg-table-card">
              <h3 className="usg-table-title">Recent API Calls</h3>
              <div className="usg-table-scroll">
                <table className="usg-table">
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
            </div>
          ) : (
            <p className="usg-empty">
              No API calls recorded yet.
            </p>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
