import { useState, useEffect } from 'react';
import { Map as MapIcon, PanelLeftClose, PanelLeft, Radio } from 'lucide-react';
import FleetMap from '../components/map/FleetMap';
import DriverList from '../components/manager/DriverList';
import DriverDetailsDrawer from '../components/manager/DriverDetailsDrawer';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

import harbingerLogo from '../assets/harbinger_logo_actual.png';

export default function ManagerMapPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [showDriverList, setShowDriverList] = useState(true);
  const { fleetDriversList } = useSocket();

  // If driver logs in, auto-target their own vehicle
  useEffect(() => {
    if (user?.role === 'driver' && !selectedDriverId) {
      setSelectedDriverId(user.id);
    }
  }, [user]);

  return (
    <div className="page-content-full">
      {/* Streamlined, elegant Topbar */}
      <div className="topbar" style={{ padding: '10px 20px', minHeight: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Toggle Fleet List Button */}
          <button
            onClick={() => setShowDriverList(prev => !prev)}
            className="btn btn-ghost btn-icon btn-sm"
            title={showDriverList ? "Collapse Fleet Panel" : "Show Fleet Panel"}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-default)',
              color: showDriverList ? 'var(--color-primary-light)' : 'var(--text-muted)',
            }}
          >
            {showDriverList ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>

          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'var(--color-primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(220, 38, 38, 0.45)',
            flexShrink: 0,
          }}>
            <MapIcon size={16} style={{ color: 'var(--color-primary-light)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="topbar-title" style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.2px' }}>
              {t.liveBloodTransportTracking}
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 9px',
              borderRadius: 12,
              letterSpacing: '0.3px',
            }}>
              <span className="badge-dot pulse" style={{ background: '#10b981', width: 6, height: 6 }} />
              {t.liveDispatchBadge}
            </span>
          </div>
        </div>

        {/* Right side: Single Clean Language Toggle & Corporate Logo */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <LanguageToggle />

          <div style={{ height: 20, width: 1, background: 'var(--border-default)' }} />

          <img
            src={harbingerLogo}
            alt="Harbinger Group"
            style={{ height: 24, objectFit: 'contain', opacity: 0.9 }}
            title="Harbinger Group"
          />
        </div>
      </div>

      {/* Map + Driver list split */}
      <div className="map-panel-split" style={{ flex: 1, minHeight: 0 }}>
        {showDriverList && (
          <DriverList
            selectedId={selectedDriverId}
            onSelect={setSelectedDriverId}
            onClose={() => setShowDriverList(false)}
          />
        )}
        <div className="map-panel-map" style={{ flex: 1, minWidth: 0, width: '100%', height: '100%', position: 'relative' }}>
          <FleetMap
            selectedDriverId={selectedDriverId}
            onSelectDriver={setSelectedDriverId}
            isListCollapsed={!showDriverList}
          />
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
