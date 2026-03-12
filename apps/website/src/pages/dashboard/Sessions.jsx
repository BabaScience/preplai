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
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Film}
          title="No sessions yet"
          description="Create presentations using your access tokens with Claude, ChatGPT, or any MCP-compatible AI agent."
        />
      ) : (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-6)',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
              {filteredSessions.length === sessions.length
                ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`
                : `${filteredSessions.length} of ${sessions.length} sessions`}
            </p>
            <div style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: 'var(--space-3)',
                  color: 'var(--color-text-muted)',
                  pointerEvents: 'none',
                }}
              />
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
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
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
                    <td>{s.title}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{s.frame_count ?? 0}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(s.created_at)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                        <a
                          href={s.player_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
                        >
                          <ExternalLink size={14} />
                          Open
                        </a>
                        <button
                          className="btn btn-ghost btn-sm"
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
