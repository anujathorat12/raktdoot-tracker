import { useState, useEffect } from 'react';
import { Map as MapIcon, Smartphone, Download } from 'lucide-react';
import FleetMap from '../components/map/FleetMap';
import DriverList from '../components/manager/DriverList';
import DriverDetailsDrawer from '../components/manager/DriverDetailsDrawer';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export default function ManagerMapPage() {
  const { user } = useAuth();
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const { fleetDriversList } = useSocket();

  // If driver logs in, auto-target their own vehicle
  useEffect(() => {
    if (user?.role === 'driver' && !selectedDriverId) {
      setSelectedDriverId(user.id);
    }
  }, [user]);

  return (
    <div className="page-content-full">
      {/* Topbar */}
      <div className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MapIcon size={16} style={{ color: 'var(--color-primary)' }} />
          <div>
            <div className="topbar-title">Fleet Map</div>
            <div className="topbar-subtitle">Real-time GPS tracking · {fleetDriversList.length} drivers</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            href="https://raktdoot-backend.onrender.com/driver"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '6px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 600,
            }}
            title="Open Driver Mobile App on this device or phone"
          >
            <Smartphone size={14} />
            <span>Driver App (Phone)</span>
          </a>

          <a
            href="https://raktdoot-backend.onrender.com/download/driver-app"
            className="btn btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#93c5fd',
              padding: '6px 12px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: 500,
            }}
            title="Download Driver App Source & Files (ZIP)"
          >
            <Download size={14} />
            <span>Download ZIP</span>
          </a>
        </div>
      </div>

      {/* Map + Driver list split */}
      <div className="map-panel-split" style={{ flex: 1 }}>
        <DriverList selectedId={selectedDriverId} onSelect={setSelectedDriverId} />
        <div className="map-panel-map">
          <FleetMap selectedDriverId={selectedDriverId} onSelectDriver={setSelectedDriverId} />
        </div>
      </div>

      {/* Driver details drawer */}
      {selectedDriverId && (
        <DriverDetailsDrawer
          driverId={selectedDriverId}
          onClose={() => setSelectedDriverId(null)}
        />
      )}
    </div>
  );
}
