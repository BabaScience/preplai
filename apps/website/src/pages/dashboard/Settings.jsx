import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Palette, Trash2 } from 'lucide-react';
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
  { id: 'light', label: 'Light', desc: 'Warm beige, frosted glass UI' },
  { id: 'cinema', label: 'Cinematic', desc: 'Rich gradients, ambient effects' },
];

const PALETTES = [
  { id: 'default', label: 'Default', colors: ['#4ECDC4', '#9B59B6', '#C9A84C'] },
  { id: 'ocean', label: 'Ocean', colors: ['#3498DB', '#2ECC71', '#1ABC9C'] },
  { id: 'sunset', label: 'Sunset', colors: ['#F39C12', '#E74C3C', '#F1C40F'] },
  { id: 'forest', label: 'Forest', colors: ['#2ECC71', '#1ABC9C', '#16a085'] },
  { id: 'mono', label: 'Mono', colors: ['#64748b', '#475569', '#94a3b8'] },
];

const THEME_STYLES = {
  cinema: {
    bg: '#0c0d14',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, #0c0d14, #060610)',
    text: '#e8e8f0',
    textMuted: '#8888a0',
    narrator: 'rgba(18, 20, 28, 0.65)',
    narratorBorder: '#C9A84C',
    narratorText: '#b8b8d0',
    navBg: 'rgba(12, 13, 20, 0.75)',
    navBtn: 'rgba(255, 255, 255, 0.06)',
    navBtnText: 'rgba(255, 255, 255, 0.5)',
    progress: '#C9A84C',
    dotGrid: 'rgba(255, 255, 255, 0.04)',
    entityStroke: 'rgba(255, 255, 255, 0.08)',
    arrowColor: 'rgba(255, 255, 255, 0.25)',
  },
  light: {
    bg: '#faf7f2',
    bgGradient: 'radial-gradient(ellipse at 50% 40%, #faf7f2, #f3ede4)',
    text: '#1a1a2e',
    textMuted: '#6a6a7e',
    narrator: 'rgba(255, 255, 255, 0.7)',
    narratorBorder: '#B8943D',
    narratorText: '#3a3a4e',
    navBg: 'rgba(255, 255, 255, 0.8)',
    navBtn: 'rgba(0, 0, 0, 0.04)',
    navBtnText: '#5a5a6e',
    progress: '#B8943D',
    dotGrid: 'rgba(0, 0, 0, 0.06)',
    entityStroke: 'rgba(0, 0, 0, 0.08)',
    arrowColor: 'rgba(0, 0, 0, 0.2)',
  },
};

const PALETTE_COLORS = {
  default:  { compute: '#00e676', data: '#4488ff', human: '#C9A84C', structure: '#9B59B6', generic: '#4ECDC4', accent: '#C9A84C' },
  ocean:    { compute: '#2ECC71', data: '#3498DB', human: '#1ABC9C', structure: '#00bcd4', generic: '#4ECDC4', accent: '#4ECDC4' },
  sunset:   { compute: '#F39C12', data: '#E74C3C', human: '#F1C40F', structure: '#ff6b6b', generic: '#E67E22', accent: '#E67E22' },
  forest:   { compute: '#2ECC71', data: '#1ABC9C', human: '#16a085', structure: '#00e676', generic: '#22c55e', accent: '#27ae60' },
  mono:     { compute: '#ECEFF1', data: '#607D8B', human: '#B0BEC5', structure: '#455A64', generic: '#CFD8DC', accent: '#90A4AE' },
};

function PresentationPreview({ theme, palette }) {
  const t = THEME_STYLES[theme] || THEME_STYLES.cinema;
  const p = PALETTE_COLORS[palette] || PALETTE_COLORS.default;

  return (
    <div className="set-preview-wrap">
      <div className="set-preview" style={{ background: t.bgGradient }}>
        <svg viewBox="0 0 480 270" xmlns="http://www.w3.org/2000/svg" className="set-preview-svg">
          {/* Dot grid */}
          <defs>
            <pattern id={`dots-${theme}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="0.6" fill={t.dotGrid} />
            </pattern>
          </defs>
          <rect width="480" height="270" fill={`url(#dots-${theme})`} />

          {/* === Top row: Idea → Research → Strategy === */}

          {/* Idea (circle) */}
          <circle cx="80" cy="80" r="30" fill={p.human} fillOpacity="0.15" stroke={p.human} strokeWidth="1.5" />
          <text x="80" y="76" textAnchor="middle" fill={p.human} fontSize="14" fontFamily="Inter, sans-serif">&#x1F4A1;</text>
          <text x="80" y="90" textAnchor="middle" fill={t.text} fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">Idea</text>

          {/* Arrow: Idea → Research */}
          <line x1="110" y1="80" x2="158" y2="80" stroke={t.arrowColor} strokeWidth="1" strokeDasharray="4 3" />
          <polygon points="158,76 166,80 158,84" fill={t.arrowColor} />

          {/* Research (rounded rect) */}
          <rect x="168" y="56" width="100" height="48" rx="8" fill={p.data} fillOpacity="0.15" stroke={p.data} strokeWidth="1.5" />
          <text x="218" y="84" textAnchor="middle" fill={t.text} fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">Research</text>

          {/* Arrow: Research → Strategy */}
          <line x1="268" y1="80" x2="318" y2="80" stroke={t.arrowColor} strokeWidth="1" strokeDasharray="4 3" />
          <polygon points="318,76 326,80 318,84" fill={t.arrowColor} />

          {/* Strategy (rounded rect) */}
          <rect x="328" y="56" width="100" height="48" rx="8" fill={p.compute} fillOpacity="0.15" stroke={p.compute} strokeWidth="1.5" />
          <text x="378" y="84" textAnchor="middle" fill={t.text} fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif">Strategy</text>

          {/* === Bottom row: Delivery + Results === */}

          {/* Arrow: Strategy → Delivery (down-left) */}
          <line x1="378" y1="104" x2="378" y2="140" stroke={t.arrowColor} strokeWidth="1" strokeDasharray="4 3" />
          <polygon points="374,140 378,148 382,140" fill={t.arrowColor} />

          {/* Arrow: Research → Delivery (down) */}
          <line x1="218" y1="104" x2="218" y2="140" stroke={t.arrowColor} strokeWidth="1" strokeDasharray="4 3" />
          <polygon points="214,140 218,148 222,140" fill={t.arrowColor} />

          {/* Delivery (larger rounded rect, centered) */}
          <rect x="158" y="150" width="210" height="48" rx="10" fill={p.generic} fillOpacity="0.15" stroke={p.generic} strokeWidth="1.5" />
          <text x="263" y="178" textAnchor="middle" fill={t.text} fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">Delivery</text>

          {/* Arrow: Delivery → Results */}
          <line x1="368" y1="174" x2="390" y2="174" stroke={t.arrowColor} strokeWidth="1" strokeDasharray="4 3" />
          <polygon points="390,170 398,174 390,178" fill={t.arrowColor} />

          {/* Results (circle) */}
          <circle cx="428" cy="174" r="26" fill={p.structure} fillOpacity="0.15" stroke={p.structure} strokeWidth="1.5" />
          <text x="428" y="171" textAnchor="middle" fill={p.structure} fontSize="12" fontFamily="Inter, sans-serif">&#x2713;</text>
          <text x="428" y="183" textAnchor="middle" fill={t.text} fontSize="8" fontWeight="600" fontFamily="Inter, sans-serif">Results</text>
        </svg>

        {/* Narrator bar */}
        <div className="set-preview-narrator" style={{
          background: t.narrator,
          borderLeftColor: t.narratorBorder,
          color: t.narratorText,
        }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: t.narratorBorder, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Narrator</span>
          <span style={{ fontSize: 9 }}>We start with an idea, validate it through research, then build a strategy for delivery...</span>
        </div>

        {/* Bottom nav */}
        <div className="set-preview-nav" style={{ background: t.navBg }}>
          <div className="set-preview-progress" style={{ background: t.progress }} />
          <div className="set-preview-nav-inner">
            <span style={{ fontSize: 7.5, color: t.navBtnText, fontWeight: 500 }}>Scene 1 of 4</span>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4].map((n) => (
                <span key={n} style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  background: n === 1 ? t.progress : t.navBtn,
                  color: n === 1 ? (theme === 'cinema' ? '#000' : '#fff') : t.navBtnText,
                  fontSize: 7.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <style>{`
        .set-section {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl, 16px);
          padding: 28px 28px 24px;
          margin-bottom: 24px;
          transition: box-shadow 180ms;
        }
        .set-section:hover {
          box-shadow: var(--shadow-md);
        }
        .set-section--accent {
          border-left: 4px solid var(--section-accent);
        }
        .set-section-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .set-section-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--section-bg);
          color: var(--section-accent);
          flex-shrink: 0;
        }
        .set-section-title {
          font-size: 11px;
          font-weight: 500;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0;
        }
        .set-section-subtitle {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0;
        }
        .set-divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: 24px 0;
        }
        .set-field-group {
          margin-bottom: 16px;
        }
        .set-field-label {
          display: block;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--color-text);
          margin-bottom: 8px;
        }
        .set-theme-grid {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .set-theme-btn {
          padding: 14px 18px;
          border-radius: var(--radius-md);
          border: 2px solid var(--color-border);
          background: transparent;
          color: var(--color-text);
          cursor: pointer;
          text-align: left;
          min-width: 160px;
          transition: border-color 150ms, background 150ms, box-shadow 150ms;
        }
        .set-theme-btn:hover {
          border-color: var(--color-text-muted);
        }
        .set-theme-btn--active {
          border-color: var(--color-primary);
          background: var(--color-bg-elevated);
          box-shadow: 0 0 0 1px var(--color-primary);
        }
        .set-theme-btn__label {
          font-weight: 600;
          display: block;
          margin-bottom: 2px;
        }
        .set-theme-btn__desc {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }
        .set-palette-grid {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .set-palette-btn {
          padding: 10px 16px;
          border-radius: var(--radius-md);
          border: 2px solid var(--color-border);
          background: transparent;
          color: var(--color-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: var(--text-sm);
          font-weight: 500;
          transition: border-color 150ms, background 150ms, box-shadow 150ms;
        }
        .set-palette-btn:hover {
          border-color: var(--color-text-muted);
        }
        .set-palette-btn--active {
          border-color: var(--color-primary);
          background: var(--color-bg-elevated);
          box-shadow: 0 0 0 1px var(--color-primary);
        }
        .set-palette-dots {
          display: flex;
          gap: 3px;
        }
        .set-palette-dot {
          width: 14px;
          height: 14px;
          border-radius: 3px;
        }
        .set-danger {
          background: transparent;
          border: 1px solid var(--color-error);
          border-left: 4px solid var(--color-error);
          border-radius: var(--radius-xl, 16px);
          padding: 28px 28px 24px;
          margin-bottom: 24px;
        }
        .set-danger .set-section-icon {
          background: rgba(231, 76, 60, 0.1);
          color: var(--color-error);
        }
        .set-danger-text {
          font-size: var(--text-sm);
          color: var(--color-text-muted);
          margin: 0 0 16px;
        }
        .set-btn-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 4px;
        }

        /* Preview */
        .set-preview-wrap {
          margin-bottom: 24px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }
        .set-preview {
          position: relative;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .set-preview-svg {
          flex: 1;
          width: 100%;
          display: block;
        }
        .set-preview-narrator {
          position: absolute;
          bottom: 34px;
          left: 12px;
          right: 12px;
          padding: 8px 12px;
          border-radius: 8px;
          border-left: 3px solid;
          backdrop-filter: blur(12px);
          display: flex;
          flex-direction: column;
          gap: 3px;
          line-height: 1.3;
        }
        .set-preview-nav {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 28px;
          backdrop-filter: blur(8px);
        }
        .set-preview-progress {
          height: 2px;
          width: 25%;
          border-radius: 1px;
        }
        .set-preview-nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          height: 26px;
        }
        .set-preview-label {
          text-align: center;
          padding: 10px 0 2px;
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          font-weight: 500;
        }

        @media (max-width: 640px) {
          .set-section {
            padding: 20px 18px 18px;
          }
          .set-theme-grid {
            flex-direction: column;
          }
          .set-theme-btn {
            min-width: unset;
          }
        }
      `}</style>

      {/* Account section */}
      <div
        className="set-section set-section--accent"
        style={{ '--section-accent': 'var(--color-primary)', '--section-bg': 'var(--color-primary-highlight)' }}
      >
        <div className="set-section-header">
          <div className="set-section-icon">
            <User size={18} />
          </div>
          <div>
            <h3 className="set-section-title">Account</h3>
            <p className="set-section-subtitle">Manage your profile information</p>
          </div>
        </div>

        {profileAlert.msg && (
          <Alert variant={profileAlert.type}>{profileAlert.msg}</Alert>
        )}

        <form onSubmit={handleProfileSave}>
          <div className="set-field-group">
            <label className="set-field-label">Email</label>
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

          <div className="set-btn-row" style={{ marginTop: 'var(--space-4)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={profileLoading}
            >
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Password section */}
      <div
        className="set-section set-section--accent"
        style={{ '--section-accent': '#3498DB', '--section-bg': 'rgba(52, 152, 219, 0.1)' }}
      >
        <div className="set-section-header">
          <div className="set-section-icon">
            <Lock size={18} />
          </div>
          <div>
            <h3 className="set-section-title">Security</h3>
            <p className="set-section-subtitle">Update your password</p>
          </div>
        </div>

        {pwAlert.msg && (
          <Alert variant={pwAlert.type}>{pwAlert.msg}</Alert>
        )}

        <form onSubmit={handlePasswordChange}>
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
          <div className="set-btn-row" style={{ marginTop: 'var(--space-2)' }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={pwLoading}>
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Player preferences section */}
      <div
        className="set-section set-section--accent"
        style={{ '--section-accent': '#9B59B6', '--section-bg': 'rgba(155, 89, 182, 0.1)' }}
      >
        <div className="set-section-header">
          <div className="set-section-icon">
            <Palette size={18} />
          </div>
          <div>
            <h3 className="set-section-title">Player Preferences</h3>
            <p className="set-section-subtitle">Choose how your presentations look</p>
          </div>
        </div>

        <PresentationPreview theme={playerTheme} palette={playerPalette} />
        <p className="set-preview-label">Live preview</p>

        <div className="set-field-group">
          <label className="set-field-label">Theme</label>
          <div className="set-theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`set-theme-btn${playerTheme === t.id ? ' set-theme-btn--active' : ''}`}
                onClick={() => setPlayerTheme(t.id)}
              >
                <span className="set-theme-btn__label">{t.label}</span>
                <span className="set-theme-btn__desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="set-field-group">
          <label className="set-field-label">Color Palette</label>
          <div className="set-palette-grid">
            {PALETTES.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`set-palette-btn${playerPalette === p.id ? ' set-palette-btn--active' : ''}`}
                onClick={() => setPlayerPalette(p.id)}
              >
                <span className="set-palette-dots">
                  {p.colors.map((c) => (
                    <span
                      key={c}
                      className="set-palette-dot"
                      style={{ background: c }}
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

        <div className="set-btn-row">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handlePlayerPrefsSave}
            disabled={playerPrefsLoading}
          >
            {playerPrefsLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="set-danger">
        <div className="set-section-header">
          <div className="set-section-icon">
            <Trash2 size={18} />
          </div>
          <div>
            <h3 className="set-section-title" style={{ color: 'var(--color-error)' }}>Danger Zone</h3>
          </div>
        </div>
        <p className="set-danger-text">
          Permanently delete your account and all data. This cannot be undone.
        </p>
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
