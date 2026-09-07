import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Map, Users, AlertTriangle, BarChart3,
  Settings, LogOut, Wifi, WifiOff, Shield, Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const managerNav = [
  { to: '/manager/map', icon: Map, label: 'Fleet Map' },
  { to: '/manager/issues', icon: AlertTriangle, label: 'Issues Feed' },
];

const adminNav = [
  { to: '/admin/users', icon: Users, label: 'User Management' },
  { to: '/admin/telemetry', icon: BarChart3, label: 'Telemetry' },
];

function NavItem({ to, icon: Icon, label, badge }) {
  return (
    <NavLink
      to={to}
      id={`nav-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    >
      <Icon size={16} className="nav-icon" />
      <span>{label}</span>
      {badge > 0 && <span className="nav-badge">{badge}</span>}
    </NavLink>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { connected, issues } = useSocket();
  const navigate = useNavigate();

  const openIssues = issues.filter(i => i.status === 'open').length;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const isAdmin = user?.role === 'admin';
  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🚚</div>
        <div>
          <div className="sidebar-logo-text">DeliveryTrack</div>
          <div className="sidebar-logo-sub">Fleet Management</div>
        </div>
      </div>

      {/* Connection indicator */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: connected ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span style={{ fontWeight: 600 }}>{connected ? 'Live Connected' : 'Disconnected'}</span>
          {connected && <span className="badge-dot pulse" style={{ marginLeft: 'auto' }} />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {isManagerOrAdmin && (
          <>
            <div className="nav-section-label">Fleet Operations</div>
            {managerNav.map(n => (
              <NavItem key={n.to} {...n} badge={n.label === 'Issues Feed' ? openIssues : 0} />
            ))}
          </>
        )}

        {isAdmin && (
          <>
            <div className="nav-section-label" style={{ marginTop: 'var(--space-3)' }}>Administration</div>
            {adminNav.map(n => <NavItem key={n.to} {...n} />)}
          </>
        )}

        <div style={{ marginTop: 'var(--space-3)' }}>
          <div className="nav-section-label">System</div>
          <NavItem to="/settings" icon={Settings} label="Settings" />
        </div>
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar" style={{ background: user?.avatar_color || '#6366f1' }}>
            {initials}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
          <button
            id="btn-logout"
            className="btn btn-ghost btn-icon btn-sm"
            onClick={logout}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
