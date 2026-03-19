import { useEffect, useState, useCallback, useMemo } from 'react';
import { Film, ExternalLink, Trash2, Search } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import { apiGetSessions, apiDeleteSession } from '../../lib/api';
import { formatDate } from '../../utils/format';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => (s.title || '').toLowerCase().includes(q));
  }, [sessions, search]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleDelete = async (sessionId) => {
    setDeleteLoading(true);
    try {
      await apiDeleteSession(sessionId);
      setShowDeleteModal(null);
      loadSessions();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout title="Sessions">
      <style>{`
        .ses-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .ses-count {
          color: var(--color-text-muted);
          font-size: var(--text-sm);
        }
        .ses-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ses-search-icon {
          position: absolute;
          left: 12px;
          color: var(--color-text-muted);
          pointer-events: none;
        }

        /* Table card */
        .ses-table-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl, 16px);
          overflow: hidden;
        }
        .ses-table-scroll {
          overflow-x: auto;
        }
        .ses-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .ses-table thead {
          background: var(--color-surface-offset);
        }
        .ses-table th {
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
        .ses-table td {
          text-align: left;
          padding: 14px 16px;
          color: var(--color-text);
          border-bottom: 1px solid var(--color-divider);
          vertical-align: middle;
        }
        .ses-table tbody tr {
          transition: background 150ms;
        }
        .ses-table tbody tr:nth-child(even) {
          background: var(--color-surface-offset);
        }
        .ses-table tbody tr:hover {
          background: var(--color-surface-dynamic);
        }
        .ses-table tbody tr:last-child td {
          border-bottom: none;
        }
        .ses-table td.ses-title-cell {
          font-weight: 500;
        }
        .ses-table td.ses-frames-cell {
          font-variant-numeric: tabular-nums;
        }
        .ses-table td.ses-date-cell {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        /* Action buttons */
        .ses-actions {
          display: flex;
          gap: var(--space-2);
          align-items: center;
        }
        .ses-open-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
        }
        .ses-delete-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: var(--space-1);
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 13px;
          font-family: var(--font-body);
          color: var(--color-text-muted);
          transition: color 180ms, background 180ms;
        }
        .ses-delete-btn:hover {
          color: var(--color-error);
          background: var(--color-error-highlight);
        }

        /* Empty state */
        .ses-empty {
          text-align: center;
          padding: 60px 20px;
        }
        .ses-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-surface-dynamic);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          color: var(--color-text-faint);
        }
        .ses-empty h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 8px;
        }
        .ses-empty p {
          font-size: 14px;
          color: var(--color-text-muted);
          max-width: 360px;
          margin: 0 auto;
          line-height: 1.6;
        }
      `}</style>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : sessions.length === 0 ? (
        <div className="ses-empty">
          <div className="ses-empty-icon">
            <Film size={24} />
          </div>
          <h3>No sessions yet</h3>
          <p>
            Create presentations using your access tokens with Claude, ChatGPT, or any MCP-compatible AI agent.
          </p>
        </div>
      ) : (
        <>
          <div className="ses-toolbar">
            <p className="ses-count">
              {filteredSessions.length === sessions.length
                ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`
                : `${filteredSessions.length} of ${sessions.length} sessions`}
            </p>
            <div className="ses-search-wrap">
              <Search size={14} className="ses-search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Search sessions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  paddingLeft: 'var(--space-8)',
                  fontSize: 'var(--text-sm)',
                  width: 220,
                }}
              />
            </div>
          </div>

          <div className="ses-table-card">
            <div className="ses-table-scroll">
              <table className="ses-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Frames</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((s) => (
                    <tr key={s.id}>
                      <td className="ses-title-cell">{s.title}</td>
                      <td className="ses-frames-cell">{s.frame_count ?? 0}</td>
                      <td className="ses-date-cell">
                        {formatDate(s.created_at)}
                      </td>
                      <td>
                        <div className="ses-actions">
                          <a
                            href={s.player_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm ses-open-btn"
                          >
                            <ExternalLink size={14} />
                            Open
                          </a>
                          <button
                            className="ses-delete-btn"
                            onClick={() => setShowDeleteModal(s.id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showDeleteModal !== null && (
        <Modal open={showDeleteModal !== null} onClose={() => setShowDeleteModal(null)}>
          <h2>Delete Session</h2>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}>
            This action cannot be undone. The presentation and all its data will be permanently deleted.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowDeleteModal(null)}>Cancel</button>
            <button
              className="btn btn-danger"
              onClick={() => handleDelete(showDeleteModal)}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
