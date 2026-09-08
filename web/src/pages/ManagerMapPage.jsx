import { useState, useEffect } from 'react';
import { Map as MapIcon } from 'lucide-react';
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

  const activeCount = fleetDriversList.filter(d => d.status === 'active').length;
  const issueCount = fleetDriversList.filter(d => d.status === 'issue').length;

  return (
    <div className="page-content-full">
      {/* Topbar */}
      <div className="topbar">
        <MapIcon size={16} style={{ color: 'var(--color-primary)' }} />
        <div>
          <div className="topbar-title">Fleet Map</div>
          <div className="topbar-subtitle">Real-time GPS tracking · {fleetDriversList.length} drivers</div>
        </div>
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginLeft: 'auto' }}>
          <span className="badge badge-active"><span className="badge-dot pulse" />{activeCount} Active</span>
          {issueCount > 0 && <span className="badge badge-issue"><span className="badge-dot" />{issueCount} Issue{issueCount > 1 ? 's' : ''}</span>}
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
