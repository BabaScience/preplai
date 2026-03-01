import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { apiChangePassword, apiDeleteAccount, clearApiToken } from '../../lib/api';

export default function Settings() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwAlert, setPwAlert] = useState({ type: '', msg: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwAlert({ type: '', msg: '' });
    setPwLoading(true);
    try {
      await apiChangePassword(currentPw, newPw);
      setPwAlert({ type: 'success', msg: 'Password updated.' });
      setCurrentPw('');
      setNewPw('');
    } catch (err) {
      setPwAlert({ type: 'error', msg: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await apiDeleteAccount();
      clearApiToken();
      logout();
      navigate('/');
    } catch (err) {
      alert(err.message);
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="card" style={{ maxWidth: '560px', marginBottom: 'var(--space-8)' }}>
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          marginBottom: 'var(--space-6)',
        }}>
          Account
        </h3>
        <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
          <label>Email</label>
          <input
            type="email"
            className="input-field"
            value={email || ''}
            disabled
            style={{ opacity: 0.6 }}
          />
        </div>

        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
        }}>
          Change Password
        </h3>

        {pwAlert.msg && (
          <Alert variant={pwAlert.type}>{pwAlert.msg}</Alert>
        )}

        <form className="auth-form" onSubmit={handlePasswordChange}>
          <Input
            label="Current Password"
            id="current-pw"
            type="password"
            required
            minLength={6}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
          <Input
            label="New Password"
            id="new-pw"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="danger-zone" style={{ maxWidth: '560px' }}>
        <h3>Danger Zone</h3>
        <p>Permanently delete your account and all data. This cannot be undone.</p>
        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <Modal onClose={() => setShowDeleteModal(false)}>
          <h2 style={{ color: 'var(--color-error)' }}>Delete Account</h2>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}>
            This will permanently delete your account, all API keys, and all usage data.
            This action cannot be undone.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete Forever'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
