import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, Image, ExternalLink } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import api, { API_URL } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

function IssueDetailModal({ issue, onClose }) {
  if (!issue) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">🚨 Incident Report</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>
        <div className="modal-body">
          {issue.image_path && (
            <img
              src={`${API_URL}${issue.image_path}`}
              alt="Incident"
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)', border: '1px solid var(--border-default)' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            {[
              { label: 'Driver', value: issue.driver_name },
              { label: 'Status', value: issue.status, badge: true },
              { label: 'Phone', value: issue.driver_phone || '—' },
              { label: 'Reported', value: formatDistanceToNow(new Date(issue.created_at), { addSuffix: true }) },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--bg-overlay)', borderRadius: 8, padding: 'var(--space-3)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{item.label}</div>
                {item.badge
                  ? <span className={`badge badge-${issue.status}`}>{issue.status}</span>
                  : <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</div>
                }
              </div>
            ))}
          </div>
          <div style={{ background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Description</div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{issue.description}</p>
          </div>
          {issue.lat && issue.lng && (
            <div style={{ marginTop: 'var(--space-3)', fontSize: 12, color: 'var(--text-muted)' }}>
              📍 Coordinates: {issue.lat?.toFixed(5)}, {issue.lng?.toFixed(5)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, onResolve, onInspect }) {
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    setResolving(true);
    try {
      await onResolve(issue.id);
    } finally {
      setResolving(false);
    }
  };

  const initials = issue.driver_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className={`issue-card ${issue.status === 'open' ? 'is-new' : ''}`} id={`issue-${issue.id}`}>
      <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
        {/* Photo thumbnail */}
        {issue.image_path ? (
          <img
            className="issue-img"
            src={`${API_URL}${issue.image_path}`}
            alt="Incident"
            onClick={() => onInspect(issue)}
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="issue-img" style={{ background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => onInspect(issue)}>
            <Image size={20} style={{ color: 'var(--text-muted)' }} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Driver + status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="user-avatar" style={{ background: issue.avatar_color || '#6366f1', width: 26, height: 26, fontSize: 11, borderRadius: 6 }}>{initials}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{issue.driver_name}</span>
            </div>
            <span className={`badge badge-${issue.status}`}>{issue.status}</span>
          </div>

          {/* Description */}
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>{issue.description}</p>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
            <Clock size={10} />
            <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
            {issue.driver_phone && <><span>·</span><span>{issue.driver_phone}</span></>}
          </div>
        </div>
      </div>

      {/* Actions */}
      {issue.status === 'open' && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            id={`btn-resolve-${issue.id}`}
            className="btn btn-success btn-sm"
            onClick={handleResolve}
            disabled={resolving}
          >
            <CheckCircle size={12} />
            {resolving ? 'Resolving...' : 'Mark Resolved'}
          </button>
          <button
            id={`btn-inspect-${issue.id}`}
            className="btn btn-secondary btn-sm"
            onClick={() => onInspect(issue)}
          >
            <ExternalLink size={12} />
            Full Details
          </button>
        </div>
      )}
    </div>
  );
}

export default function IssueFeed() {
  const { issues, setIssues } = useSocket();
  const [inspecting, setInspecting] = useState(null);
  const [filter, setFilter] = useState('all');

  const filtered = issues.filter(i => filter === 'all' || i.status === filter);
  const openCount = issues.filter(i => i.status === 'open').length;

  const handleResolve = async (id) => {
    await api.patch(`/issues/${id}/status`, { status: 'resolved' });
    setIssues(prev => prev.map(i => i.id === id ? { ...i, status: 'resolved' } : i));
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Issue Feed</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{openCount} open incident{openCount !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginLeft: 'auto' }}>
          {['all', 'open', 'resolved'].map(f => (
            <button key={f} id={`issue-filter-${f}`} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
            <CheckCircle size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>No {filter !== 'all' ? filter : ''} issues</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>All clear — fleet is running smoothly.</div>
          </div>
        ) : (
          filtered.map(issue => (
            <IssueCard key={issue.id} issue={issue} onResolve={handleResolve} onInspect={setInspecting} />
          ))
        )}
      </div>

      {inspecting && <IssueDetailModal issue={inspecting} onClose={() => setInspecting(null)} />}
    </div>
  );
}
