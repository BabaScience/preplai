import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import DashboardLayout from '../../layouts/DashboardLayout';
import Alert from '../../components/Alert';
import { useTheme } from '../../context/ThemeContext';
import { apiGetIllustrationDemand, apiDismissIllustration, apiGetCategories } from '../../lib/api';

const BAR_COLORS = {
  unknown_type: '#ff6b6b',
  generic_fallback: '#ffab00',
  known_type: '#4ECDC4',
};

const PIE_COLORS = ['#4ECDC4', '#F39C12', '#E74C3C', '#9B59B6', '#3498DB', '#2ECC71', '#ff6b6b', '#F1C40F', '#1ABC9C', '#95a5a6'];

export default function Illustrations() {
  const { currentTheme } = useTheme();
  const [data, setData] = useState(null);
  const [catData, setCatData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('requests');

  const fetchData = useCallback((sortBy) => {
    setLoading(true);
    Promise.all([apiGetIllustrationDemand(sortBy), apiGetCategories()])
      .then(([demand, categories]) => { setData(demand); setCatData(categories); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData(sort);
  }, [sort, fetchData]);

  const handleDismiss = async (typeName, section) => {
    if (!window.confirm(`Dismiss "${typeName}" from tracking? This removes it permanently.`)) return;
    try {
      await apiDismissIllustration(typeName);
      // Optimistic removal from local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [section]: prev[section].filter((item) => item.typeName !== typeName),
          total_unknown_types: section === 'top_requested' ? prev.total_unknown_types - 1 : prev.total_unknown_types,
          total_known_types: section === 'top_used' ? prev.total_known_types - 1 : prev.total_known_types,
        };
      });
    } catch (err) {
      setError(`Failed to dismiss: ${err.message}`);
    }
  };

  const isDark = currentTheme === 'dark';
  const textColor = isDark ? '#b0b0c0' : '#4a4a5a';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';

  return (
    <DashboardLayout title="Illustrations">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Sort controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: 8,
              overflow: 'hidden',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            <SortButton
              active={sort === 'requests'}
              onClick={() => setSort('requests')}
              isDark={isDark}
            >
              By Requests
            </SortButton>
            <SortButton
              active={sort === 'users'}
              onClick={() => setSort('users')}
              isDark={isDark}
            >
              By Users
            </SortButton>
          </div>
        </div>

        {loading && <p style={{ color: textColor, textAlign: 'center', padding: 40 }}>Loading...</p>}

        {data && (
          <>
            {/* Summary stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
              <StatCard label="Known Types Used" value={data.total_known_types} color="#4ECDC4" isDark={isDark} />
              <StatCard label="Missing Types Requested" value={data.total_unknown_types} color="#ff6b6b" isDark={isDark} />
              {catData && <StatCard label="Total Sessions" value={catData.totalSessions} color="#9B59B6" isDark={isDark} />}
            </div>

            {/* Presentation Categories */}
            {catData && catData.distribution.length > 0 && (
              <Section title="Presentation Categories" isDark={isDark}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 280px' }}>
                    <ResponsiveContainer width={280} height={280}>
                      <PieChart>
                        <Pie
                          data={catData.distribution}
                          dataKey="count"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={50}
                          paddingAngle={2}
                          label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                          labelLine={{ stroke: isDark ? '#555' : '#bbb', strokeWidth: 1 }}
                          style={{ fontSize: 11, fill: textColor }}
                        >
                          {catData.distribution.map((entry, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} fillOpacity={0.85} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: isDark ? '#1a1b26' : '#fff',
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            borderRadius: 8,
                            color: textColor,
                          }}
                          formatter={(value, name) => [`${value} sessions`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1 }}>
                    {catData.uncategorized.length > 0 && (
                      <>
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#e0e0e8' : '#2d2d3a', marginBottom: 8 }}>
                          Uncategorized ({catData.uncategorized.length}) — new use cases to discover
                        </h4>
                        <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                          {catData.uncategorized.map((s) => (
                            <div
                              key={s.id}
                              style={{
                                padding: '6px 10px',
                                marginBottom: 4,
                                borderRadius: 6,
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                fontSize: 12,
                                color: textColor,
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>{s.title}</span>
                              {Object.keys(s.entityDistribution).length > 0 && (
                                <span style={{ opacity: 0.5, marginLeft: 8 }}>
                                  {Object.keys(s.entityDistribution).slice(0, 4).join(', ')}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Most Requested (Missing) */}
            {data.top_requested.length > 0 && (
              <Section title="Most Requested (Missing)" isDark={isDark}>
                <p style={{ color: textColor, fontSize: 13, marginBottom: 16, opacity: 0.7 }}>
                  Entity types agents tried to use but don't exist yet. Prioritize these for new illustrations.
                </p>
                <DemandChart items={data.top_requested} color={BAR_COLORS.unknown_type} sortBy={sort} isDark={isDark} textColor={textColor} gridColor={gridColor} />
                <DemandTable
                  items={data.top_requested}
                  color={BAR_COLORS.unknown_type}
                  sortBy={sort}
                  onDismiss={(typeName) => handleDismiss(typeName, 'top_requested')}
                  isDark={isDark}
                  gridColor={gridColor}
                />
              </Section>
            )}

            {/* Generic Fallbacks */}
            {data.generic_fallbacks.length > 0 && (
              <Section title="Generic Fallbacks" isDark={isDark}>
                <p style={{ color: textColor, fontSize: 13, marginBottom: 16, opacity: 0.7 }}>
                  When agents use Concept/Entity/Group as substitutes. The labels reveal what they actually wanted.
                </p>
                <DemandChart items={data.generic_fallbacks} color={BAR_COLORS.generic_fallback} sortBy={sort} isDark={isDark} textColor={textColor} gridColor={gridColor} />
                <DemandTable
                  items={data.generic_fallbacks}
                  color={BAR_COLORS.generic_fallback}
                  sortBy={sort}
                  onDismiss={(typeName) => handleDismiss(typeName, 'generic_fallbacks')}
                  isDark={isDark}
                  gridColor={gridColor}
                  showLabels
                />
              </Section>
            )}

            {/* Most Used (Known) */}
            {data.top_used.length > 0 && (
              <Section title="Most Used Illustrations" isDark={isDark}>
                <DemandChart items={data.top_used} color={BAR_COLORS.known_type} sortBy={sort} isDark={isDark} textColor={textColor} gridColor={gridColor} />
                <DemandTable
                  items={data.top_used}
                  color={BAR_COLORS.known_type}
                  sortBy={sort}
                  onDismiss={(typeName) => handleDismiss(typeName, 'top_used')}
                  isDark={isDark}
                  gridColor={gridColor}
                />
              </Section>
            )}

            {/* Empty state */}
            {data.top_requested.length === 0 && data.top_used.length === 0 && data.generic_fallbacks.length === 0 && (
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

function DemandChart({ items, color, sortBy, isDark, textColor, gridColor }) {
  if (items.length === 0) return null;
  const dataKey = sortBy === 'users' ? 'uniqueUsers' : 'requestCount';
  const label = sortBy === 'users' ? 'users' : 'requests';
  return (
    <div style={{ marginBottom: 20 }}>
      <ResponsiveContainer width="100%" height={Math.max(120, items.length * 32)}>
        <BarChart data={items} layout="vertical" margin={{ left: 140, right: 20, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis type="number" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis dataKey="typeName" type="category" tick={{ fill: textColor, fontSize: 12 }} width={130} />
          <Tooltip
            contentStyle={{
              background: isDark ? '#1a1b26' : '#fff',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: 8,
              color: textColor,
            }}
            formatter={(value, name, props) => [
              `${value} ${label} (${props.payload.uniqueUsers} users)`,
              'Demand',
            ]}
          />
          <Bar dataKey={dataKey} radius={[0, 4, 4, 0]}>
            {items.map((entry, i) => (
              <Cell key={i} fill={color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DemandTable({ items, color, sortBy, onDismiss, isDark, gridColor, showLabels = false }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${gridColor}` }}>
            <Th isDark={isDark}>Type</Th>
            <Th isDark={isDark} align="right" highlight={sortBy === 'requests'}>Requests</Th>
            <Th isDark={isDark} align="right" highlight={sortBy === 'users'}>Users</Th>
            {showLabels && <Th isDark={isDark}>Sample Labels</Th>}
            <Th isDark={isDark} align="center" style={{ width: 50 }}></Th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${gridColor}` }}>
              <Td isDark={isDark}>
                <span style={{ color, fontWeight: 600 }}>{item.typeName}</span>
              </Td>
              <Td isDark={isDark} align="right">
                <span style={{ fontWeight: sortBy === 'requests' ? 700 : 400 }}>{item.requestCount}</span>
              </Td>
              <Td isDark={isDark} align="right">
                <span style={{ fontWeight: sortBy === 'users' ? 700 : 400 }}>{item.uniqueUsers}</span>
              </Td>
              {showLabels && (
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
              )}
              <Td isDark={isDark} align="center">
                <button
                  onClick={() => onDismiss(item.typeName)}
                  title={`Dismiss ${item.typeName}`}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: isDark ? '#666' : '#aaa',
                    fontSize: 16,
                    padding: '2px 6px',
                    borderRadius: 4,
                    transition: 'color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = '#ff6b6b';
                    e.target.style.background = isDark ? 'rgba(255,107,107,0.1)' : 'rgba(255,107,107,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = isDark ? '#666' : '#aaa';
                    e.target.style.background = 'none';
                  }}
                >
                  ✕
                </button>
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <h3 style={{ fontSize: 16, fontWeight: 600, color: isDark ? '#e0e0e8' : '#2d2d3a', marginBottom: 16 }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SortButton({ active, onClick, isDark, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
        border: 'none',
        background: active
          ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')
          : 'transparent',
        color: active
          ? (isDark ? '#e0e0e8' : '#2d2d3a')
          : (isDark ? '#888' : '#999'),
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function Th({ children, isDark, align = 'left', highlight = false }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: '8px 12px',
        fontWeight: 600,
        color: highlight ? (isDark ? '#e0e0e8' : '#2d2d3a') : (isDark ? '#888' : '#666'),
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
