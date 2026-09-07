import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../context/SocketContext';

// Fix default leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const STATUS_COLORS = {
  active: '#10b981',
  idle: '#f59e0b',
  issue: '#ef4444',
  offline: '#6b7280',
};

const STATUS_EMOJI = {
  active: '🚚',
  idle: '⏸️',
  issue: '🚨',
  offline: '💤',
};

function createVehicleIcon(driver, isSelected) {
  const color = STATUS_COLORS[driver.status] || '#6b7280';
  const emoji = STATUS_EMOJI[driver.status] || '🚚';
  const initials = driver.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
  const pulse = driver.status === 'issue' ? 'animation: pulse-marker 1.5s ease infinite;' : '';
  const glow = isSelected ? `box-shadow: 0 0 0 4px rgba(99,102,241,0.5), 0 0 20px rgba(99,102,241,0.3);` : `box-shadow: 0 2px 10px rgba(0,0,0,0.5);`;
  const ring = driver.status === 'active'
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};opacity:0;animation:radar 2.5s ease-out infinite;"></div>` : '';
  const heading = driver.heading != null
    ? `<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(${driver.heading}deg);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid ${color};"></div>` : '';

  const html = `
    <div style="position:relative;width:44px;height:44px;">
      ${ring}
      ${heading}
      <div style="
        width:44px;height:44px;border-radius:50%;
        background:${color};
        display:flex;align-items:center;justify-content:center;
        border:3px solid white;
        ${glow}
        ${pulse}
        font-size:18px;font-weight:700;color:white;
        cursor:pointer;transition:transform 0.15s;
        position:relative;z-index:1;
      " title="${driver.name}">
        ${emoji}
      </div>
      <div style="
        position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);
        background:#0a0b0f;border:1px solid #333;border-radius:4px;
        padding:1px 5px;font-size:10px;font-weight:600;color:white;
        white-space:nowrap;font-family:monospace;
      ">${Math.round(driver.speed || 0)} km/h</div>
    </div>
  `;

  return L.divIcon({
    html,
    iconSize: [44, 64],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
    className: '',
  });
}

// Auto-fit bounds when drivers change
function BoundsController({ drivers, selectedId }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (selectedId) {
      const d = drivers.find(d => d.id === selectedId);
      if (d?.lat && d?.lng) {
        map.flyTo([d.lat, d.lng], 15, { animate: true, duration: 1 });
        return;
      }
    }
    if (!fitted.current && drivers.length > 0) {
      const validDrivers = drivers.filter(d => d.lat && d.lng && (d.lat !== 0 || d.lng !== 0));
      if (validDrivers.length > 0) {
        const bounds = L.latLngBounds(validDrivers.map(d => [d.lat, d.lng]));
        map.fitBounds(bounds.pad(0.2), { animate: true });
        fitted.current = true;
      }
    }
  }, [drivers, selectedId, map]);

  return null;
}

export default function FleetMap({ selectedDriverId, onSelectDriver }) {
  const { fleetDriversList } = useSocket();
  const validDrivers = fleetDriversList.filter(d => d.lat && d.lng && (d.lat !== 0 || d.lng !== 0));

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <style>{`
        @keyframes radar {
          0% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(3); }
        }
        @keyframes pulse-marker {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 2px 10px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0), 0 2px 10px rgba(0,0,0,0.5); }
        }
        .leaflet-container { background: #1a1c23; }
        .leaflet-tile { filter: brightness(0.7) contrast(1.1) saturate(0.8); }
        .leaflet-popup-content-wrapper {
          background: #16181f; border: 1px solid rgba(255,255,255,0.1);
          color: #f1f5f9; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }
        .leaflet-popup-tip { background: #16181f; }
        .leaflet-popup-close-button { color: #94a3b8 !important; }
      `}</style>

      <MapContainer
        center={[19.076, 72.8777]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsController drivers={validDrivers} selectedId={selectedDriverId} />

        {validDrivers.map(driver => (
          <Marker
            key={driver.id}
            position={[driver.lat, driver.lng]}
            icon={createVehicleIcon(driver, selectedDriverId === driver.id)}
            eventHandlers={{ click: () => onSelectDriver?.(driver.id) }}
          >
            <Popup>
              <div style={{ minWidth: 200, fontFamily: 'Inter, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: driver.avatar_color || '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white' }}>
                    {driver.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{driver.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{driver.email}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                  <div style={{ color: '#94a3b8' }}>Status</div>
                  <div style={{ color: STATUS_COLORS[driver.status], fontWeight: 600, textTransform: 'capitalize' }}>{driver.status}</div>
                  <div style={{ color: '#94a3b8' }}>Speed</div>
                  <div style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{Math.round(driver.speed || 0)} km/h</div>
                  <div style={{ color: '#94a3b8' }}>Heading</div>
                  <div style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{Math.round(driver.heading || 0)}°</div>
                  <div style={{ color: '#94a3b8' }}>Coords</div>
                  <div style={{ color: '#f1f5f9', fontFamily: 'monospace', fontSize: 10 }}>{driver.lat?.toFixed(4)}, {driver.lng?.toFixed(4)}</div>
                </div>
                {driver.phone && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 11 }}>
                    📞 {driver.phone}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map overlay stats */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        {['active', 'idle', 'issue', 'offline'].map(status => {
          const count = fleetDriversList.filter(d => d.status === status).length;
          if (count === 0) return null;
          return (
            <div key={status} style={{
              background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 12, fontWeight: 600, color: STATUS_COLORS[status],
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status], display: 'inline-block' }} />
              {count} {status}
            </div>
          );
        })}
      </div>
    </div>
  );
}
