import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import Alert from '../../components/Alert';
import { useTheme } from '../../context/ThemeContext';
import { apiGetIllustrationDemand } from '../../lib/api';

const BAR_COLORS = {
  unknown_type: '#ff6b6b',
  generic_fallback: '#ffab00',
  known_type: '#4ECDC4',
};

export default function Illustrations() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGetIllustrationDemand()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const isDark = currentTheme === 'dark';
  const textColor = isDark ? '#b0b0c0' : '#4a4a5a';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  return (
    <DashboardLayout title="Illustrations">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {error && <Alert type="error">{error}</Alert>}

        {loading && <p style={{ color: textColor, textAlign: 'center', padding: 40 }}>Loading...</p>}

        {data && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <StatCard
                label="Known Types Used"
                value={data.total_known_types}
                color="#4ECDC4"
                isDark={isDark}
              />
              <StatCard
                label="Missing Types Requested"
                value={data.total_unknown_types}
                color="#ff6b6b"
                isDark={isDark}
              />
            </div>

            {/* Most Requested (Missing) */}
            {data.top_requested.length > 0 && (
              <Section title="Most Requested (Missing)" isDark={isDark}>
                <p style={{ color: textColor, fontSize: 13, marginBottom: 16, opacity: 0.7 }}>
                  Entity types agents tried to use but don't exist yet. Prioritize these for new illustrations.
                </p>
                <ResponsiveContainer width="100%" height={Math.max(200, data.top_requested.length * 32)}>
                  <BarChart data={data.top_requested} layout="vertical" margin={{ left: 120, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fill: textColor, fontSize: 12 }} />
                    <YAxis dataKey="typeName" type="category" tick={{ fill: textColor, fontSize: 12 }} width={110} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#1a1b26' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 8,
                        color: textColor,
                      }}
                      formatter={(value, name, props) => [
                        `${value} requests (${props.payload.uniqueUsers} users)`,
                        'Demand',
                      ]}
                    />
                    <Bar dataKey="requestCount" radius={[0, 4, 4, 0]}>
                      {data.top_requested.map((entry, i) => (
                        <Cell key={i} fill={BAR_COLORS.unknown_type} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Generic Fallbacks */}
            {data.generic_fallbacks.length > 0 && (
              <Section title="Generic Fallbacks" isDark={isDark}>
                <p style={{ color: textColor, fontSize: 13, marginBottom: 16, opacity: 0.7 }}>
                  When agents use Concept/Entity/Group as substitutes. The labels reveal what they actually wanted.
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${gridColor}` }}>
                        <Th isDark={isDark}>Type:Label</Th>
                        <Th isDark={isDark} align="right">Requests</Th>
                        <Th isDark={isDark} align="right">Users</Th>
                        <Th isDark={isDark}>Sample Labels</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.generic_fallbacks.map((item, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${gridColor}` }}>
                          <Td isDark={isDark}>
                            <span style={{ color: BAR_COLORS.generic_fallback, fontWeight: 600 }}>
                              {item.typeName}
                            </span>
                          </Td>
                          <Td isDark={isDark} align="right">{item.requestCount}</Td>
                          <Td isDark={isDark} align="right">{item.uniqueUsers}</Td>
                          <Td isDark={isDark}>
                            {item.sampleLabels.map((l, j) => (
                              <span
                                key={j}
                                style={{
                                  display: 'inline-block',
                                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                  borderRadius: 4,
                                  padding: '2px 6px',
                                  marginRight: 4,
                                  fontSize: 11,
                                  fontFamily: 'JetBrains Mono, monospace',
                                }}
                              >
                                {l}
                              </span>
                            ))}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )}

            {/* Most Used (Known) */}
            {data.top_used.length > 0 && (
              <Section title="Most Used Illustrations" isDark={isDark}>
                <ResponsiveContainer width="100%" height={Math.max(200, data.top_used.length * 32)}>
                  <BarChart data={data.top_used} layout="vertical" margin={{ left: 120, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fill: textColor, fontSize: 12 }} />
                    <YAxis dataKey="typeName" type="category" tick={{ fill: textColor, fontSize: 12 }} width={110} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#1a1b26' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        borderRadius: 8,
                        color: textColor,
                      }}
                      formatter={(value, name, props) => [
                        `${value} uses (${props.payload.uniqueUsers} users)`,
                        'Popularity',
                      ]}
                    />
                    <Bar dataKey="requestCount" radius={[0, 4, 4, 0]}>
                      {data.top_used.map((entry, i) => (
                        <Cell key={i} fill={BAR_COLORS.known_type} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Section>
            )}

            {/* Empty state */}
            {data.top_requested.length === 0 && data.top_used.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: textColor, opacity: 0.5 }}>
                <p style={{ fontSize: 16 }}>No illustration usage data yet.</p>
                <p style={{ fontSize: 13 }}>Create presentations via MCP to start tracking entity type demand.</p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function StatCard({ label, value, color, isDark }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '20px 24px',
        borderRadius: 12,
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <div style={{ fontSize: 13, color: isDark ? '#888' : '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Section({ title, isDark, children }) {
  return (
    <div
      style={{
        marginBottom: 32,
        padding: 24,
        borderRadius: 12,
        background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: isDark ? '#e0e0e8' : '#2d2d3a',
          marginBottom: 16,
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Th({ children, isDark, align = 'left' }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '8px 12px',
        fontWeight: 600,
        color: isDark ? '#888' : '#666',
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, isDark, align = 'left' }) {
  return (
    <td
      style={{
        textAlign: align,
        padding: '10px 12px',
        color: isDark ? '#c0c0d0' : '#4a4a5a',
      }}
    >
      {children}
    </td>
  );
}
