import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../services/api';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="page-content-full">
      <div className="topbar">
        <button
          id="btn-back-to-map"
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/manager/map')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 'var(--space-2)' }}
          title="Back to Fleet Map"
        >
          <ArrowLeft size={14} /> Back to Map
        </button>
        <Settings size={16} style={{ color: 'var(--color-primary)' }} />
        <div><div className="topbar-title">Settings</div></div>
      </div>
      <div className="page-content">
        <div className="card" style={{ maxWidth: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
            <div className="user-avatar" style={{ background: user?.avatar_color || '#6366f1', width: 56, height: 56, fontSize: 20, borderRadius: 14 }}>{initials}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</div>
              <span className={`badge badge-${user?.role}`} style={{ marginTop: 6 }}>{user?.role}</span>
            </div>
          </div>
          <div className="divider" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Backend URL</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {API_URL}
                </div>
              </div>
            </div>
            <div className="divider" style={{ margin: '4px 0' }} />
            <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 4 }}>
              <button
                id="btn-settings-back"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/manager/map')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={14} /> Back to Fleet Map
              </button>
              <button id="btn-settings-logout" className="btn btn-danger btn-sm" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
