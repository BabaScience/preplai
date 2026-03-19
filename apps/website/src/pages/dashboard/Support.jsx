import { useEffect, useState, useCallback } from 'react';
import { MessageSquare, Mail, Inbox, X, Image, ExternalLink } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import Alert from '../../components/Alert';
import { useTheme } from '../../context/ThemeContext';
import {
  apiGetFeedback,
  apiUpdateFeedbackStatus,
  apiGetContacts,
  apiUpdateContactStatus,
} from '../../lib/api';

const STATUS_OPTIONS = ['new', 'in_progress', 'resolved', 'closed'];

const STATUS_COLORS = {
  new:         { bg: 'var(--color-primary-highlight)', text: 'var(--color-primary)', label: 'New' },
  in_progress: { bg: 'rgba(52, 152, 219, 0.1)',       text: '#3498DB',              label: 'In Progress' },
  resolved:    { bg: 'var(--color-success-highlight)',  text: 'var(--color-success)', label: 'Resolved' },
  closed:      { bg: 'var(--color-surface-dynamic)',    text: 'var(--color-text-faint)', label: 'Closed' },
};

const TYPE_COLORS = {
  bug:     { bg: 'var(--color-error-highlight)', text: 'var(--color-error)' },
  feature: { bg: 'rgba(52, 152, 219, 0.1)',      text: '#3498DB' },
  other:   { bg: 'var(--color-surface-dynamic)',  text: 'var(--color-text-muted)' },
};

export default function Support() {
  const { currentTheme } = useTheme();
  const [tab, setTab] = useState('feedback');
  const [feedback, setFeedback] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const isDark = currentTheme === 'dark';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [fb, ct] = await Promise.all([apiGetFeedback(), apiGetContacts()]);
      setFeedback(fb.reports || fb.items || []);
      setContacts(ct.submissions || ct.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFeedbackStatus = async (id, status) => {
    try {
      await apiUpdateFeedbackStatus(id, status);
      setFeedback((prev) =>
        prev.map((item) => (item._id || item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  const handleContactStatus = async (id, status) => {
    try {
      await apiUpdateContactStatus(id, status);
      setContacts((prev) =>
        prev.map((item) => (item._id || item.id === id ? { ...item, status } : item))
      );
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  const openFeedbackCount = Array.isArray(feedback)
    ? feedback.filter((f) => f.status === 'new').length
    : 0;
  const newContactsCount = Array.isArray(contacts)
    ? contacts.filter((c) => c.status === 'new').length
    : 0;

  return (
    <DashboardLayout title="Support">
      <style>{`
        .sup-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }
        .sup-stat {
          flex: 1;
          padding: 22px 24px;
          border-radius: var(--radius-xl, 16px);
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-left: 4px solid var(--stat-accent);
          transition: box-shadow 180ms;
        }
        .sup-stat:hover {
          box-shadow: var(--shadow-md);
        }
        .sup-stat-label {
          font-size: var(--text-xs);
          font-weight: 500;
          color: var(--color-text-muted);
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .sup-stat-value {
          font-size: 28px;
          font-weight: 700;
          font-family: var(--font-body);
          color: var(--stat-accent);
        }

        /* Tab toggle */
        .sup-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 28px;
          border-bottom: 1px solid var(--color-divider);
        }
        .sup-tab {
          padding: 10px 22px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          position: relative;
          transition: color 180ms;
          font-family: var(--font-body);
        }
        .sup-tab:hover {
          color: var(--color-text);
        }
        .sup-tab--active {
          color: var(--color-primary);
          font-weight: 600;
        }
        .sup-tab--active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--color-primary);
          border-radius: 2px 2px 0 0;
        }

        /* Table card wrapper */
        .sup-table-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl, 16px);
          overflow: hidden;
        }
        .sup-table-scroll {
          overflow-x: auto;
        }
        .sup-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .sup-table thead {
          background: var(--color-surface-offset);
        }
        .sup-table th {
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
        .sup-table td {
          text-align: left;
          padding: 14px 16px;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-divider);
          vertical-align: middle;
        }
        .sup-table tbody tr {
          transition: background 150ms;
        }
        .sup-table tbody tr:nth-child(even) {
          background: var(--color-surface-offset);
        }
        .sup-table tbody tr:hover {
          background: var(--color-surface-dynamic);
        }
        .sup-table tbody tr:last-child td {
          border-bottom: none;
        }

        /* Badges */
        .sup-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 10px;
          border-radius: var(--radius-full, 9999px);
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
          white-space: nowrap;
        }

        /* Status select */
        .sup-status-select {
          appearance: none;
          -webkit-appearance: none;
          padding: 5px 28px 5px 10px;
          border-radius: var(--radius-full, 9999px);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          outline: none;
          border: 1px solid transparent;
          transition: border-color 180ms, box-shadow 180ms;
          text-transform: capitalize;
          font-family: var(--font-body);
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238a8b95' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
        }
        .sup-status-select:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 2px var(--color-primary-highlight);
        }

        /* Email sub-row */
        .sup-email-sub {
          font-size: 11px;
          color: var(--color-text-faint);
          margin-top: 2px;
        }

        /* Empty state */
        .sup-empty {
          text-align: center;
          padding: 60px 20px;
          color: var(--color-text-faint);
        }
        .sup-empty-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--color-surface-dynamic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: var(--color-text-faint);
        }
        .sup-empty p {
          font-size: 14px;
          max-width: 280px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* Loading */
        .sup-loading {
          text-align: center;
          padding: 48px;
          color: var(--color-text-muted);
          font-size: 14px;
        }

        /* Detail drawer */
        .sup-drawer-overlay {
          position: fixed;
          inset: 0;
          z-index: 200;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          justify-content: flex-end;
          animation: sup-fade-in 0.2s ease forwards;
        }
        @keyframes sup-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sup-slide-in {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .sup-drawer {
          width: min(480px, 90vw);
          height: 100vh;
          background: var(--color-surface);
          border-left: 1px solid var(--color-border);
          overflow-y: auto;
          animation: sup-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .sup-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--color-divider);
          position: sticky;
          top: 0;
          background: var(--color-surface);
          z-index: 1;
        }
        .sup-drawer-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin: 0;
        }
        .sup-drawer-close {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--color-text-muted);
          padding: 6px;
          border-radius: 8px;
          transition: background 150ms, color 150ms;
        }
        .sup-drawer-close:hover {
          background: var(--color-surface-dynamic);
          color: var(--color-text);
        }
        .sup-drawer-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .sup-drawer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .sup-drawer-row--block {
          flex-direction: column;
          align-items: flex-start;
        }
        .sup-drawer-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--color-text-muted);
          flex-shrink: 0;
        }
        .sup-drawer-text {
          font-size: 14px;
          line-height: 1.7;
          color: var(--color-text);
          background: var(--color-surface-offset);
          border-radius: 10px;
          padding: 14px 16px;
          width: 100%;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .sup-drawer-image {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 10px;
          border: 1px solid var(--color-divider);
          cursor: pointer;
          transition: opacity 150ms;
        }
        .sup-drawer-image:hover {
          opacity: 0.85;
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {error && <Alert type="error">{error}</Alert>}

        {/* Stat cards */}
        <div className="sup-stats">
          <div className="sup-stat" style={{ '--stat-accent': 'var(--color-error)' }}>
            <div className="sup-stat-label">Open Feedback</div>
            <div className="sup-stat-value">{openFeedbackCount}</div>
          </div>
          <div className="sup-stat" style={{ '--stat-accent': '#3498DB' }}>
            <div className="sup-stat-label">New Contacts</div>
            <div className="sup-stat-value">{newContactsCount}</div>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="sup-tabs">
          <button
            className={`sup-tab${tab === 'feedback' ? ' sup-tab--active' : ''}`}
            onClick={() => setTab('feedback')}
          >
            Feedback
          </button>
          <button
            className={`sup-tab${tab === 'contacts' ? ' sup-tab--active' : ''}`}
            onClick={() => setTab('contacts')}
          >
            Contacts
          </button>
        </div>

        {loading && (
          <div className="sup-loading">Loading...</div>
        )}

        {/* Feedback tab */}
        {!loading && tab === 'feedback' && (
          <div className="sup-table-card">
            {feedback.length === 0 ? (
              <div className="sup-empty">
                <div className="sup-empty-icon">
                  <MessageSquare size={20} />
                </div>
                <p>No feedback submissions yet. They will appear here when users send feedback.</p>
              </div>
            ) : (
              <div className="sup-table-scroll">
                <table className="sup-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Description</th>
                      <th>User</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((item) => {
                      const typeStyle = TYPE_COLORS[item.type] || TYPE_COLORS.other;
                      const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.new;
                      return (
                        <tr key={item._id || item.id} onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                          <td>
                            <span
                              className="sup-badge"
                              style={{ background: typeStyle.bg, color: typeStyle.text }}
                            >
                              {item.type}
                            </span>
                          </td>
                          <td>
                            {truncate(item.description, 80)}
                            {item.imageData && <span style={{ marginLeft: 6, opacity: 0.4 }} title="Has image"><Image size={13} /></span>}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{item.email || item.userId || '-'}</td>
                          <td>
                            <select
                              className="sup-status-select"
                              value={item.status || 'new'}
                              onChange={(e) => handleFeedbackStatus(item._id || item.id, e.target.value)}
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                              }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contacts tab */}
        {!loading && tab === 'contacts' && (
          <div className="sup-table-card">
            {contacts.length === 0 ? (
              <div className="sup-empty">
                <div className="sup-empty-icon">
                  <Mail size={20} />
                </div>
                <p>No contact submissions yet. They will appear here when visitors reach out.</p>
              </div>
            ) : (
              <div className="sup-table-scroll">
                <table className="sup-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Company</th>
                      <th>Use Case</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((item) => {
                      const statusStyle = STATUS_COLORS[item.status] || STATUS_COLORS.new;
                      return (
                        <tr key={item._id || item.id} onClick={() => setSelectedItem(item)} style={{ cursor: 'pointer' }}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{item.name}</div>
                            <div className="sup-email-sub">{item.email}</div>
                          </td>
                          <td>{item.company || '-'}</td>
                          <td style={{ textTransform: 'capitalize' }}>{item.useCase || '-'}</td>
                          <td>{truncate(item.message, 80)}</td>
                          <td>
                            <select
                              className="sup-status-select"
                              value={item.status || 'new'}
                              onChange={(e) => handleContactStatus(item._id || item.id, e.target.value)}
                              style={{
                                background: statusStyle.bg,
                                color: statusStyle.text,
                              }}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace('_', ' ')}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedItem && (
        <div className="sup-drawer-overlay" onClick={() => setSelectedItem(null)}>
          <div className="sup-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="sup-drawer-header">
              <h3>
                {selectedItem.name ? 'Contact Details' : 'Feedback Details'}
              </h3>
              <button className="sup-drawer-close" onClick={() => setSelectedItem(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="sup-drawer-body">
              {/* Type badge (feedback only) */}
              {selectedItem.type && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Type</span>
                  <span
                    className="sup-badge"
                    style={{
                      background: (TYPE_COLORS[selectedItem.type] || TYPE_COLORS.other).bg,
                      color: (TYPE_COLORS[selectedItem.type] || TYPE_COLORS.other).text,
                    }}
                  >
                    {selectedItem.type}
                  </span>
                </div>
              )}

              {/* Name + email (contacts) */}
              {selectedItem.name && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Name</span>
                  <span>{selectedItem.name}</span>
                </div>
              )}

              <div className="sup-drawer-row">
                <span className="sup-drawer-label">Email</span>
                <span>{selectedItem.email || selectedItem.userId || '-'}</span>
              </div>

              {selectedItem.company && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Company</span>
                  <span>{selectedItem.company}</span>
                </div>
              )}

              {selectedItem.useCase && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Use Case</span>
                  <span style={{ textTransform: 'capitalize' }}>{selectedItem.useCase}</span>
                </div>
              )}

              {/* Full description / message */}
              <div className="sup-drawer-row sup-drawer-row--block">
                <span className="sup-drawer-label">{selectedItem.name ? 'Message' : 'Description'}</span>
                <div className="sup-drawer-text">{selectedItem.description || selectedItem.message}</div>
              </div>

              {/* Image attachment */}
              {selectedItem.imageData && (
                <div className="sup-drawer-row sup-drawer-row--block">
                  <span className="sup-drawer-label">Attached Screenshot</span>
                  <img
                    src={selectedItem.imageData}
                    alt="Feedback screenshot"
                    className="sup-drawer-image"
                    onClick={() => window.open(selectedItem.imageData, '_blank')}
                  />
                </div>
              )}

              {/* Session context */}
              {selectedItem.presentationTitle && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Presentation</span>
                  <span>{selectedItem.presentationTitle}</span>
                </div>
              )}

              {selectedItem.sessionId && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Session ID</span>
                  <code style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', opacity: 0.7 }}>{selectedItem.sessionId}</code>
                </div>
              )}

              {selectedItem.pageUrl && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Page URL</span>
                  <a href={selectedItem.pageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {truncate(selectedItem.pageUrl, 50)} <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {selectedItem.source && (
                <div className="sup-drawer-row">
                  <span className="sup-drawer-label">Source</span>
                  <span className="sup-badge" style={{ background: 'var(--color-surface-dynamic)', color: 'var(--color-text-muted)' }}>
                    {selectedItem.source}
                  </span>
                </div>
              )}

              <div className="sup-drawer-row">
                <span className="sup-drawer-label">Date</span>
                <span>{formatDate(selectedItem.createdAt)}</span>
              </div>

              {/* Status */}
              <div className="sup-drawer-row">
                <span className="sup-drawer-label">Status</span>
                <select
                  className="sup-status-select"
                  value={selectedItem.status || 'new'}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    const id = selectedItem._id || selectedItem.id;
                    if (selectedItem.name) {
                      handleContactStatus(id, newStatus);
                    } else {
                      handleFeedbackStatus(id, newStatus);
                    }
                    setSelectedItem({ ...selectedItem, status: newStatus });
                  }}
                  style={{
                    background: (STATUS_COLORS[selectedItem.status] || STATUS_COLORS.new).bg,
                    color: (STATUS_COLORS[selectedItem.status] || STATUS_COLORS.new).text,
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

/* ---- Helpers ---- */

function truncate(str, max) {
  if (!str) return '-';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
