import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import Input from '../../components/Input';
import Alert from '../../components/Alert';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import {
  apiChangePassword,
  apiDeleteAccount,
  clearApiToken,
  apiGetSettings,
  apiUpdatePlayerPrefs,
  apiUpdateProfile,
} from '../../lib/api';

const THEMES = [
  { id: 'cinema', label: 'Cinematic', desc: 'Rich gradients, ambient effects' },
  { id: 'minimal', label: 'Minimal', desc: 'Flat, algorithm-viz style' },
];

const PALETTES = [
  { id: 'default', label: 'Default', colors: ['#4ECDC4', '#9B59B6', '#C9A84C'] },
  { id: 'ocean', label: 'Ocean', colors: ['#3498DB', '#2ECC71', '#1ABC9C'] },
  { id: 'sunset', label: 'Sunset', colors: ['#F39C12', '#E74C3C', '#F1C40F'] },
  { id: 'forest', label: 'Forest', colors: ['#2ECC71', '#1ABC9C', '#16a085'] },
  { id: 'mono', label: 'Mono', colors: ['#64748b', '#475569', '#94a3b8'] },
];

export default function Settings() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  const [profileName, setProfileName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileAlert, setProfileAlert] = useState({ type: '', msg: '' });

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwAlert, setPwAlert] = useState({ type: '', msg: '' });

  const [playerTheme, setPlayerTheme] = useState('cinema');
  const [playerPalette, setPlayerPalette] = useState('default');
  const [playerPrefsLoading, setPlayerPrefsLoading] = useState(false);
  const [playerPrefsAlert, setPlayerPrefsAlert] = useState({ type: '', msg: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    apiGetSettings()
      .then((data) => {
        if (data.user) {
          setProfileName(data.user.name ?? '');
          setPlayerTheme(data.user.player_theme ?? 'cinema');
          setPlayerPalette(data.user.player_palette ?? 'default');
        }
      })
      .catch(() => {});
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileAlert({ type: '', msg: '' });
    setProfileLoading(true);
    try {
      await apiUpdateProfile({ name: profileName.trim() });
      setProfileAlert({ type: 'success', msg: 'Profile updated.' });
    } catch (err) {
      setProfileAlert({ type: 'error', msg: err.message });
    } finally {
      setProfileLoading(false);
    }
  };

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

  const handlePlayerPrefsSave = async () => {
    setPlayerPrefsAlert({ type: '', msg: '' });
    setPlayerPrefsLoading(true);
    try {
      await apiUpdatePlayerPrefs(playerTheme, playerPalette);
      setPlayerPrefsAlert({ type: 'success', msg: 'Player preferences saved.' });
    } catch (err) {
      setPlayerPrefsAlert({ type: 'error', msg: err.message });
    } finally {
      setPlayerPrefsLoading(false);
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
        {profileAlert.msg && (
          <Alert variant={profileAlert.type}>{profileAlert.msg}</Alert>
        )}

        <form onSubmit={handleProfileSave}>
          <div className="input-group" style={{ marginBottom: 'var(--space-4)' }}>
            <label>Email</label>
            <input
              type="email"
              className="input-field"
              value={email || ''}
              disabled
              style={{ opacity: 0.6 }}
            />
          </div>

          <Input
            label="Display Name"
            id="profile-name"
            type="text"
            placeholder="Your name"
            value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
          />

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={profileLoading}
            style={{ marginTop: 'var(--space-2)' }}
          >
            {profileLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <hr style={{
          border: 'none',
          borderTop: '1px solid var(--color-border)',
          margin: 'var(--space-6) 0',
        }} />

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
            minLength={8}
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
          />
          <Input
            label="New Password"
            id="new-pw"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: '560px', marginBottom: 'var(--space-8)' }}>
        <h3 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          marginBottom: 'var(--space-6)',
        }}>
          Player preferences
        </h3>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          marginBottom: 'var(--space-6)',
        }}>
          Choose how your presentations look when you open them from the Sessions page.
        </p>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            marginBottom: 'var(--space-3)',
          }}>
            Theme
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setPlayerTheme(t.id)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${playerTheme === t.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: playerTheme === t.id ? 'var(--color-bg-elevated)' : 'transparent',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  minWidth: 140,
                }}
              >
                <span style={{ fontWeight: 600, display: 'block' }}>{t.label}</span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          <label style={{
            display: 'block',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            marginBottom: 'var(--space-3)',
          }}>
            Color palette
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlayerPalette(p.id)}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${playerPalette === p.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: playerPalette === p.id ? 'var(--color-bg-elevated)' : 'transparent',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                <span style={{ display: 'flex', gap: 2 }}>
                  {p.colors.map((c) => (
                    <span
                      key={c}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: c,
                      }}
                    />
                  ))}
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {playerPrefsAlert.msg && (
          <Alert variant={playerPrefsAlert.type} style={{ marginBottom: 'var(--space-4)' }}>
            {playerPrefsAlert.msg}
          </Alert>
        )}

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handlePlayerPrefsSave}
          disabled={playerPrefsLoading}
        >
          {playerPrefsLoading ? 'Saving...' : 'Save preferences'}
        </button>
      </div>

      <div className="danger-zone" style={{ maxWidth: '560px' }}>
        <h3>Danger Zone</h3>
        <p>Permanently delete your account and all data. This cannot be undone.</p>
        <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>
          Delete Account
        </button>
      </div>

      {showDeleteModal && (
        <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
          <h2 style={{ color: 'var(--color-error)' }}>Delete Account</h2>
          <p style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-6)',
          }}>
            This will permanently delete your account, all access tokens, and all usage data.
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
