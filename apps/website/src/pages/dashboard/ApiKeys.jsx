import { useEffect, useState, useCallback } from 'react';
import { Plus, Key, Copy, Check } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import Input from '../../components/Input';
import { apiGetKeys, apiCreateKey, apiRevokeKey } from '../../lib/api';
import { formatDate } from '../../utils/format';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(null);
  const [newKeyName, setNewKeyName] = useState('Default');
  const [createdKey, setCreatedKey] = useState(null);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetKeys();
      const rawKeys = data.keys || [];
      setKeys(rawKeys.map((k) => ({
        ...k,
        key_display: k.key_display ?? (k.key_prefix ? `${k.key_prefix}...` : '—'),
        tier: k.tier ?? 'free',
        status: k.status ?? 'active',
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const data = await apiCreateKey(newKeyName || 'Default');
      setCreatedKey(data.key?.rawKey ?? (typeof data.key === 'string' ? data.key : null));
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleRevoke = async (keyId) => {
    try {
      await apiRevokeKey(keyId);
      setShowRevokeModal(null);
      loadKeys();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(createdKey).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedKey(null);
    setNewKeyName('Default');
    setCreateError('');
    if (createdKey) loadKeys();
  };

  return (
    <DashboardLayout title="Access Tokens">
      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : keys.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No access tokens yet"
          description="Create one to get started with preplai."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create Access Token
            </button>
          }
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
              {keys.length} key{keys.length !== 1 ? 's' : ''}
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} />
              Create Token
            </button>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Name</th>
                  <th>Tier</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td>
                      <code style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                      }}>
                        {k.key_display}
                      </code>
                    </td>
                    <td>{k.name}</td>
                    <td><Badge variant="primary">{k.tier}</Badge></td>
                    <td>
                      <Badge variant={k.status === 'active' ? 'success' : 'error'}>
                        {k.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(k.created_at)}
                    </td>
                    <td>
                      {k.status === 'active' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowRevokeModal(k.id)}
                        >
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Key Modal */}
      {showCreateModal && (
        <Modal open={showCreateModal} onClose={closeCreateModal}>
          <h2>Create Access Token</h2>
          <Alert variant="error">{createError}</Alert>
          {createdKey ? (
            <>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-4)',
              }}>
                Your access token has been created. Copy it now — you won&apos;t be able to see it again.
              </p>
              <div className="key-reveal">{createdKey}</div>
              <div className="key-warning">
                Store this key securely. It cannot be retrieved after this dialog is closed.
              </div>
              <div style={{
                display: 'flex',
                gap: 'var(--space-3)',
                justifyContent: 'flex-end',
                marginTop: 'var(--space-6)',
              }}>
                <button className="copy-btn" onClick={handleCopyKey}>
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={closeCreateModal}>Done</button>
              </div>
            </>
          ) : (
            <form className="auth-form" onSubmit={handleCreateKey}>
              <Input
                label="Key Name"
                id="key-name"
                type="text"
                placeholder="e.g. Production"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Revoke Confirmation Modal */}
      {showRevokeModal !== null && (
        <Modal open={showRevokeModal !== null} onClose={() => setShowRevokeModal(null)}>
          <h2>Revoke Access Token</h2>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}>
            This action cannot be undone. Any applications using this token will stop working.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowRevokeModal(null)}>Cancel</button>
            <button className="btn btn-danger" onClick={() => handleRevoke(showRevokeModal)}>
              Revoke Token
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
