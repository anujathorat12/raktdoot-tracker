import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../context/LanguageContext';
import { Maximize2, Crosshair, X } from 'lucide-react';

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
  const pulse = driver.status === 'issue' ? 'animation: pulse-marker 1.5s ease infinite;' : '';
  const glow = isSelected
    ? `box-shadow: 0 0 0 4px rgba(185,28,28,0.7), 0 0 24px rgba(185,28,28,0.5); transform: scale(1.15);`
    : `box-shadow: 0 2px 10px rgba(0,0,0,0.5);`;

  // Dynamic radar rings
  const ring = driver.status === 'active'
    ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};opacity:0;animation:radar 2.5s ease-out infinite;pointer-events:none;"></div>`
    : '';

  // Target ping for selected person
  const targetRing = isSelected
    ? `<div style="position:absolute;inset:-14px;border-radius:50%;border:3px dashed #ef4444;animation:target-ping 1.6s cubic-bezier(0,0,0.2,1) infinite;pointer-events:none;"></div>`
    : '';

  // Floating person name badge when focused/selected
  const nameBadge = isSelected
    ? `<div style="
        position:absolute;top:-30px;left:50%;transform:translateX(-50%);
        background:linear-gradient(135deg, #7f1d1d, #b91c1c);
        color:white;font-weight:700;font-size:11px;padding:3px 10px;
        border-radius:14px;white-space:nowrap;
        box-shadow:0 4px 16px rgba(0,0,0,0.5);
        border:1px solid rgba(255,255,255,0.3);
        display:flex;align-items:center;gap:4px;z-index:20;
        pointer-events:none;
      ">🎯 ${driver.name}</div>`
    : '';

  const heading = driver.heading != null
    ? `<div style="position:absolute;top:-6px;left:50%;transform:translateX(-50%) rotate(${driver.heading}deg);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-bottom:8px solid ${color};"></div>`
    : '';

  const html = `
    <div style="position:relative;width:44px;height:44px;">
      ${nameBadge}
      ${targetRing}
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
        cursor:pointer;transition:transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
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
    popupAnchor: [0, -26],
    className: '',
  });
}

// Leaflet instance bridge to share map controller with outside UI
function MapInstanceBridge({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (map) onMapReady(map);
  }, [map, onMapReady]);
  return null;
}

// Automatically triggers map.invalidateSize() whenever container size changes or panel toggles
function MapResizer({ isListCollapsed }) {
  const map = useMap();

  // Invalidate when collapse toggle state changes
  useEffect(() => {
    if (!map) return;
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 150);
    const t3 = setTimeout(() => map.invalidateSize(), 350);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isListCollapsed, map]);

  // Continuous ResizeObserver for any layout or window dimension changes
  useEffect(() => {
    if (!map) return;

    map.invalidateSize();
    const container = map.getContainer();
    if (!container) return;

    let rafId;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    });

    ro.observe(container);

    const onResize = () => {
      map.invalidateSize({ pan: false });
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  return null;
}

// Auto-fit bounds on first load or auto-focus active driver
function BoundsController({ drivers, selectedId, isListCollapsed }) {
  const map = useMap();
  const fitted = useRef(false);
  const lastActiveDriverId = useRef(null);

  useEffect(() => {
    const validDrivers = drivers.filter(d => d.lat && d.lng && (d.lat !== 0 || d.lng !== 0));
    if (validDrivers.length === 0) return;

    const activeDrivers = validDrivers.filter(d => d.status === 'active' || d.status === 'issue');

    // 1. Initial Load: center on active driver if exists, else fit all drivers
    if (!fitted.current && !selectedId) {
      map.invalidateSize();
      if (activeDrivers.length > 0) {
        const topDriver = activeDrivers[0];
        map.flyTo([topDriver.lat, topDriver.lng], 15, { animate: true, duration: 1.0 });
        lastActiveDriverId.current = topDriver.id;
      } else {
        const bounds = L.latLngBounds(validDrivers.map(d => [d.lat, d.lng]));
        map.fitBounds(bounds.pad(0.15), { animate: true });
      }
      fitted.current = true;
    } else if (!selectedId && activeDrivers.length > 0) {
      // 2. An active driver just went online or updated location!
      const topDriver = activeDrivers[0];
      if (lastActiveDriverId.current !== topDriver.id) {
        map.flyTo([topDriver.lat, topDriver.lng], 15, { animate: true, duration: 1.0 });
        lastActiveDriverId.current = topDriver.id;
      }
    }
  }, [drivers, selectedId, map]);

  // When panel collapse state changes, re-fit bounds smoothly if no single driver is focused
  useEffect(() => {
    const validDrivers = drivers.filter(d => d.lat && d.lng && (d.lat !== 0 || d.lng !== 0));
    if (!selectedId && validDrivers.length > 0 && map && fitted.current) {
      const timer = setTimeout(() => {
        map.invalidateSize();
        const bounds = L.latLngBounds(validDrivers.map(d => [d.lat, d.lng]));
        map.fitBounds(bounds.pad(0.15), { animate: true });
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isListCollapsed, selectedId, map, drivers]);

  return null;
}

export default function FleetMap({ selectedDriverId, onSelectDriver, isListCollapsed = false }) {
  const { fleetDriversList } = useSocket();
  const { t } = useLanguage();
  const [mapInstance, setMapInstance] = useState(null);
  const markerRefs = useRef({});

  const validDrivers = fleetDriversList.filter(d => d.lat && d.lng && (d.lat !== 0 || d.lng !== 0));
  const activeDrivers = validDrivers.filter(d => d.status === 'active' || d.status === 'issue');
  const selectedDriver = fleetDriversList.find(d => d.id === selectedDriverId);

  const lastFocusedIdRef = useRef(null);

  // Programmatically fly to and pop open driver marker
  const focusOnDriver = useCallback((driverId, zoom = 16) => {
    const driver = fleetDriversList.find(d => d.id === driverId);
    if (!mapInstance || !driver) return;

    if (driver.lat && driver.lng && (driver.lat !== 0 || driver.lng !== 0)) {
      lastFocusedIdRef.current = driverId;
      mapInstance.flyTo([driver.lat, driver.lng], zoom, {
        animate: true,
        duration: 1.1,
      });

      setTimeout(() => {
        const marker = markerRefs.current[driverId];
        if (marker) {
          marker.openPopup();
        }
      }, 500);
    }
  }, [mapInstance, fleetDriversList]);

  // Smooth live vehicle tracking: when selected, smoothly panTo moving vehicle
  useEffect(() => {
    if (!selectedDriverId || !mapInstance) {
      lastFocusedIdRef.current = null;
      return;
    }

    const driver = fleetDriversList.find(d => d.id === selectedDriverId);
    if (!driver || !driver.lat || !driver.lng) return;

    if (lastFocusedIdRef.current !== selectedDriverId) {
      // Initial focus on driver
      lastFocusedIdRef.current = selectedDriverId;
      mapInstance.flyTo([driver.lat, driver.lng], 16, { animate: true, duration: 1.0 });
      setTimeout(() => {
        markerRefs.current[selectedDriverId]?.openPopup();
      }, 500);
    } else {
      // Smooth continuous camera panning as vehicle travels
      mapInstance.panTo([driver.lat, driver.lng], { animate: true, duration: 0.8 });
    }
  }, [selectedDriverId, fleetDriversList, mapInstance]);

  // Reset map view to fit all fleet drivers
  const handleResetView = useCallback(() => {
    onSelectDriver?.(null);
    if (mapInstance && validDrivers.length > 0) {
      mapInstance.invalidateSize();
      const bounds = L.latLngBounds(validDrivers.map(d => [d.lat, d.lng]));
      mapInstance.fitBounds(bounds.pad(0.15), { animate: true, duration: 0.9 });
    }
  }, [mapInstance, onSelectDriver, validDrivers]);

  // Quick action: center on active driver
  const handleFocusActive = useCallback(() => {
    if (activeDrivers.length > 0) {
      const target = activeDrivers[0];
      onSelectDriver?.(target.id);
      focusOnDriver(target.id, 16);
    }
  }, [activeDrivers, onSelectDriver, focusOnDriver]);

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        @keyframes radar {
          0% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 0; transform: scale(2.8); }
        }
        @keyframes target-ping {
          0% { opacity: 0.9; transform: scale(0.9); }
          70% { opacity: 0.2; transform: scale(2.4); }
          100% { opacity: 0; transform: scale(2.6); }
        }
        @keyframes pulse-marker {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5), 0 2px 10px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 0 12px rgba(239,68,68,0), 0 2px 10px rgba(0,0,0,0.5); }
        }
        .leaflet-container {
          width: 100% !important;
          height: 100% !important;
          background: #1a1c23;
        }
        .leaflet-tile-pane {
          width: 100%;
          height: 100%;
        }
        .leaflet-tile { filter: brightness(0.7) contrast(1.1) saturate(0.8); }
        .leaflet-popup-content-wrapper {
          background: #16181f; border: 1px solid rgba(255,255,255,0.12);
          color: #f1f5f9; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.65);
        }
        .leaflet-popup-tip { background: #16181f; }
        .leaflet-popup-close-button { color: #94a3b8 !important; }
      `}</style>

      {/* Selected Vehicle Floating Focus Pill (Top-Left, minimal & sleek) */}
      {selectedDriver && (
        <div style={{
          position: 'absolute', top: 14, left: 14, zIndex: 1000,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(15, 23, 42, 0.92)', backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(220, 38, 38, 0.45)', borderRadius: 20,
          padding: '5px 12px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLORS[selectedDriver.status] || '#b91c1c' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f8fafc' }}>
            {selectedDriver.name}
            {selectedDriver.speed > 0 ? ` · ${Math.round(selectedDriver.speed)} km/h` : ''}
          </span>
          <button
            onClick={() => onSelectDriver?.(null)}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2,
              marginLeft: 2,
            }}
            title="Clear selection"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Sleek Floating Map Controls (Top-Right) */}
      <div style={{
        position: 'absolute', top: 14, right: 14, zIndex: 1000,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {activeDrivers.length > 0 && (
          <button
            onClick={handleFocusActive}
            title={t.focusActiveVehicle}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 8,
              color: '#34d399', fontSize: 11.5, fontWeight: 600, padding: '6px 11px',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Crosshair size={13} />
            <span>{t.focusActiveVehicle}</span>
          </button>
        )}

        <button
          onClick={handleResetView}
          title={t.viewAllVehicles}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 8,
            color: '#e2e8f0', fontSize: 11.5, fontWeight: 600, padding: '6px 11px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Maximize2 size={13} style={{ color: 'var(--color-primary-light)' }} />
          <span>{t.viewAllVehicles}</span>
        </button>
      </div>

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

        <MapInstanceBridge onMapReady={setMapInstance} />
        <MapResizer isListCollapsed={isListCollapsed} />
        <BoundsController drivers={validDrivers} selectedId={selectedDriverId} isListCollapsed={isListCollapsed} />

        {validDrivers.map(driver => (
          <Marker
            key={driver.id}
            ref={el => {
              if (el) markerRefs.current[driver.id] = el;
              else delete markerRefs.current[driver.id];
            }}
            position={[driver.lat, driver.lng]}
            icon={createVehicleIcon(driver, selectedDriverId === driver.id)}
            eventHandlers={{
              click: () => {
                onSelectDriver?.(driver.id);
              },
            }}
          >
            <Popup>
              <div style={{ minWidth: 240, fontFamily: 'Inter, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: driver.avatar_color || '#b91c1c',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}>
                    {driver.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{driver.name}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{driver.email}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                  <div style={{ color: '#94a3b8' }}>Status</div>
                  <div style={{ color: STATUS_COLORS[driver.status], fontWeight: 700, textTransform: 'capitalize' }}>
                    ● {driver.status}
                  </div>
                  <div style={{ color: '#94a3b8' }}>Speed</div>
                  <div style={{ color: '#f8fafc', fontFamily: 'monospace', fontWeight: 600 }}>
                    {Math.round(driver.speed || 0)} km/h
                  </div>
                  <div style={{ color: '#94a3b8' }}>Heading</div>
                  <div style={{ color: '#f8fafc', fontFamily: 'monospace' }}>
                    {Math.round(driver.heading || 0)}°
                  </div>
                  <div style={{ color: '#94a3b8' }}>Coordinates</div>
                  <div style={{ color: '#f8fafc', fontFamily: 'monospace', fontSize: 10 }}>
                    {driver.lat?.toFixed(5)}, {driver.lng?.toFixed(5)}
                  </div>
                </div>

                {driver.address && (
                  <div style={{
                    marginTop: 8, padding: '6px 8px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <div style={{ fontSize: 10, color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                      📍 Exact Physical Location
                    </div>
                    <div style={{ fontSize: 11, color: '#f8fafc', lineHeight: 1.3 }}>
                      {driver.address}
                    </div>
                  </div>
                )}

                {driver.phone && (
                  <div style={{
                    marginTop: 8, paddingTop: 8,
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>📞</span>
                    <a href={`tel:${driver.phone}`} style={{ color: '#f87171', textDecoration: 'none' }}>
                      {driver.phone}
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

