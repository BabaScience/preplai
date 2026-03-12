import { useEffect, useState, useCallback } from 'react';
import { Plus, Plug, Copy, Check, Trash2, Pencil } from 'lucide-react';
import DashboardLayout from '../../layouts/DashboardLayout';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import Alert from '../../components/Alert';
import Input from '../../components/Input';
import {
  apiGetOAuthClients,
  apiCreateOAuthClient,
  apiUpdateOAuthClient,
  apiDeleteOAuthClient,
} from '../../lib/api';
import { formatDate } from '../../utils/format';

const CLAUDE_CALLBACK = 'https://claude.ai/api/mcp/auth_callback';

export default function Connectors() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClientName, setNewClientName] = useState('Claude');
  const [redirectUri, setRedirectUri] = useState(CLAUDE_CALLBACK);
  const [createdClient, setCreatedClient] = useState(null);
  const [createError, setCreateError] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit modal
  const [editClient, setEditClient] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRedirectUri, setEditRedirectUri] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deleteClient, setDeleteClient] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [copied, setCopied] = useState(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetOAuthClients();
      setClients(data.clients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const redirectUris = redirectUri
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      if (redirectUris.length === 0) {
        setCreateError('At least one redirect URI is required.');
        return;
      }
      const data = await apiCreateOAuthClient(newClientName || 'Claude', redirectUris);
      setCreatedClient(data);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const redirectUris = editRedirectUri
        .split(',')
        .map((u) => u.trim())
        .filter(Boolean);
      if (redirectUris.length === 0) {
        setEditError('At least one redirect URI is required.');
        setEditLoading(false);
        return;
      }
      await apiUpdateOAuthClient(editClient.clientId, {
        name: editName,
        redirectUris,
      });
      setEditClient(null);
      loadClients();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await apiDeleteOAuthClient(deleteClient.clientId);
      setDeleteClient(null);
      loadClients();
    } catch (err) {
      setError(err.message);
      setDeleteClient(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEdit = (c) => {
    setEditClient(c);
    setEditName(c.name);
    setEditRedirectUri(c.redirectUris?.join(', ') || '');
    setEditError('');
  };

  const handleCopy = (label, value) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreatedClient(null);
    setNewClientName('Claude');
    setRedirectUri(CLAUDE_CALLBACK);
    setCreateError('');
    if (createdClient) loadClients();
  };

  return (
    <DashboardLayout title="Connectors">
      <p style={{
        color: 'var(--color-text-muted)',
        fontSize: 'var(--text-sm)',
        marginBottom: 'var(--space-6)',
      }}>
        Create OAuth clients to connect Claude Web, ChatGPT, and other tools to your preplai account.
      </p>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Loading...</p>
      ) : error ? (
        <Alert variant="error">{error}</Alert>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Plug}
          title="No connectors yet"
          description="Create an OAuth client to connect Claude Web or ChatGPT to preplai."
          action={
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create OAuth Client
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
              {clients.length} client{clients.length !== 1 ? 's' : ''}
            </p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} />
              Create OAuth Client
            </button>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client ID</th>
                  <th>Name</th>
                  <th>Redirect URIs</th>
                  <th>Created</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => (
                  <tr key={c.clientId}>
                    <td>
                      <code style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-muted)',
                      }}>
                        {c.clientId}
                      </code>
                    </td>
                    <td>{c.name}</td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {c.redirectUris?.join(', ') || '—'}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(c.createdAt)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(c)}
                          title="Edit connector"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteClient(c)}
                          title="Delete connector"
                          style={{ color: 'var(--color-error)' }}
                        >
                          <Trash2 size={14} />
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

      {/* Create Modal */}
      {showCreateModal && (
        <Modal open={showCreateModal} onClose={closeCreateModal}>
          <h2>Create OAuth Client</h2>
          <Alert variant="error">{createError}</Alert>
          {createdClient ? (
            <>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-4)',
              }}>
                Your OAuth client has been created. Copy the Client ID and Client Secret now — the
                secret cannot be retrieved again.
              </p>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Client ID
                </label>
                <div className="key-reveal" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <code style={{ flex: 1, wordBreak: 'break-all' }}>{createdClient.clientId}</code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopy('clientId', createdClient.clientId)}
                  >
                    {copied === 'clientId' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  Client Secret
                </label>
                <div className="key-reveal" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <code style={{ flex: 1, wordBreak: 'break-all' }}>{createdClient.clientSecret}</code>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleCopy('clientSecret', createdClient.clientSecret)}
                  >
                    {copied === 'clientSecret' ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
              <div className="key-warning">
                Store the client secret securely. It cannot be retrieved after this dialog is closed.
              </div>
              <p style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-muted)',
                marginTop: 'var(--space-4)',
              }}>
                In Claude Web: Settings → Connectors → Add custom connector. Enter URL{' '}
                <code>https://player.preplai.com/mcp</code> and paste Client ID and Client Secret in
                Advanced settings.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
                <button className="btn btn-primary btn-sm" onClick={closeCreateModal}>Done</button>
              </div>
            </>
          ) : (
            <form className="auth-form" onSubmit={handleCreate}>
              <Input
                label="Client Name"
                id="client-name"
                type="text"
                placeholder="e.g. Claude"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
              <Input
                label="Redirect URIs"
                id="redirect-uris"
                type="text"
                placeholder="https://claude.ai/api/mcp/auth_callback"
                value={redirectUri}
                onChange={(e) => setRedirectUri(e.target.value)}
              />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Comma-separated for multiple. Use https://claude.ai/api/mcp/auth_callback for Claude Web.
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
                <button type="button" className="btn btn-ghost" onClick={closeCreateModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Edit Modal */}
      {editClient && (
        <Modal open={!!editClient} onClose={() => setEditClient(null)}>
          <h2>Edit Connector</h2>
          <Alert variant="error">{editError}</Alert>
          <form className="auth-form" onSubmit={handleEdit}>
            <Input
              label="Client Name"
              id="edit-client-name"
              type="text"
              placeholder="e.g. Claude"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
            <Input
              label="Redirect URIs"
              id="edit-redirect-uris"
              type="text"
              placeholder="https://claude.ai/api/mcp/auth_callback"
              value={editRedirectUri}
              onChange={(e) => setEditRedirectUri(e.target.value)}
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              Comma-separated for multiple URIs.
            </p>
            <div style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-muted)',
              marginTop: 'var(--space-2)',
              padding: 'var(--space-3)',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <strong>Client ID:</strong>{' '}
              <code style={{ fontSize: 'var(--text-xs)' }}>{editClient.clientId}</code>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-4)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditClient(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={editLoading}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteClient && (
        <Modal open={!!deleteClient} onClose={() => setDeleteClient(null)}>
          <h2>Delete Connector</h2>
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-muted)',
            marginBottom: 'var(--space-4)',
          }}>
            Are you sure you want to delete the OAuth client <strong>{deleteClient.name}</strong>?
            Any tools using this client will lose access to your preplai account.
          </p>
          <div style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-muted)',
            padding: 'var(--space-3)',
            background: 'var(--color-bg-elevated)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-4)',
          }}>
            <strong>Client ID:</strong>{' '}
            <code style={{ fontSize: 'var(--text-xs)' }}>{deleteClient.clientId}</code>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setDeleteClient(null)}>
              Cancel
            </button>
            <button
              className="btn btn-sm"
              style={{
                background: 'var(--color-error)',
                color: 'white',
                border: 'none',
              }}
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Connector'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
