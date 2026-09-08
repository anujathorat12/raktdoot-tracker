import { useState } from 'react';
import { Search, Navigation, Clock, Zap, AlertTriangle, MapPin } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { getDisplayAddress } from '../../utils/geoAddress';

const STATUS_COLORS = {
  active: 'var(--status-active)',
  idle: 'var(--status-idle)',
  issue: 'var(--status-issue)',
  offline: 'var(--status-offline)',
};

function DriverItem({ driver, selected, onClick }) {
  const initials = driver.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  const lastSeen = driver.updated_at ? formatDistanceToNow(new Date(driver.updated_at), { addSuffix: true }) : 'Unknown';

  return (
    <div
      id={`driver-item-${driver.id}`}
      className={`driver-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div className="user-avatar" style={{ background: driver.avatar_color || '#6366f1', width: 38, height: 38, fontSize: 13 }}>
          {initials}
        </div>
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: 12, height: 12, borderRadius: '50%',
          background: STATUS_COLORS[driver.status] || 'var(--status-offline)',
          border: '2px solid var(--bg-surface)',
        }} />
      </div>

      <div className="driver-item-info">
        <div className="driver-item-name">{driver.name}</div>
        <div className="driver-item-meta">
          <span style={{ color: STATUS_COLORS[driver.status], textTransform: 'capitalize', fontWeight: 600 }}>
            {driver.status || 'offline'}
          </span>
          {driver.speed > 0 && (
            <>
              <span>·</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{Math.round(driver.speed)} km/h</span>
            </>
          )}
        </div>
        <div className="driver-item-meta" style={{ marginTop: 2, color: '#818cf8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={10} style={{ flexShrink: 0, color: '#818cf8' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {getDisplayAddress(driver)}
          </span>
        </div>
        <div className="driver-item-meta" style={{ marginTop: 2 }}>
          <Clock size={10} />
          <span>{lastSeen}</span>
        </div>
      </div>

      {driver.status === 'issue' && (
        <AlertTriangle size={14} style={{ color: 'var(--status-issue)', flexShrink: 0 }} />
      )}
    </div>
  );
}

export default function DriverList({ selectedId, onSelect }) {
  const { fleetDriversList } = useSocket();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = fleetDriversList
    .filter(d => {
      if (filter !== 'all' && d.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        return d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const order = { issue: 0, active: 1, idle: 2, offline: 3 };
      return (order[a.status] ?? 4) - (order[b.status] ?? 4);
    });

  const counts = {
    all: fleetDriversList.length,
    active: fleetDriversList.filter(d => d.status === 'active').length,
    idle: fleetDriversList.filter(d => d.status === 'idle').length,
    issue: fleetDriversList.filter(d => d.status === 'issue').length,
    offline: fleetDriversList.filter(d => d.status === 'offline').length,
  };

  return (
    <div className="map-panel-list">
      {/* Header */}
      <div className="driver-list-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Fleet — {counts.all} Drivers
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <Navigation size={14} style={{ color: 'var(--color-accent)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live</span>
          </div>
        </div>

        {/* Search */}
        <div className="driver-search" style={{ marginBottom: 'var(--space-2)' }}>
          <Search size={14} className="driver-search-icon" />
          <input
            id="driver-search"
            className="input"
            style={{ paddingLeft: 36, fontSize: 12 }}
            placeholder="Search drivers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {['all', 'active', 'idle', 'issue', 'offline'].map(s => (
            <button
              key={s}
              id={`filter-${s}`}
              className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '3px 8px', fontSize: 11 }}
              onClick={() => setFilter(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {counts[s] > 0 && <span style={{ marginLeft: 3, opacity: 0.8 }}>({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Driver list */}
      <div className="driver-list-items">
        {filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Zap size={24} style={{ marginBottom: 8, opacity: 0.3 }} />
            <div style={{ fontSize: 13 }}>No drivers found</div>
          </div>
        ) : (
          filtered.map(driver => (
            <DriverItem
              key={driver.id}
              driver={driver}
              selected={selectedId === driver.id}
              onClick={() => onSelect?.(selectedId === driver.id ? null : driver.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
