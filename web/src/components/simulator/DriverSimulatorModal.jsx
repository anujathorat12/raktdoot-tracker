import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Zap, Navigation, Gauge, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

// Mumbai route waypoints
const DEFAULT_ROUTE = [
  { lat: 19.0760, lng: 72.8777 },
  { lat: 19.0800, lng: 72.8800 },
  { lat: 19.0850, lng: 72.8850 },
  { lat: 19.0900, lng: 72.8900 },
  { lat: 19.0880, lng: 72.8950 },
  { lat: 19.0820, lng: 72.9000 },
  { lat: 19.0760, lng: 72.8950 },
  { lat: 19.0700, lng: 72.8900 },
  { lat: 19.0720, lng: 72.8840 },
  { lat: 19.0760, lng: 72.8777 },
];

function calcHeading(from, to) {
  const dLng = to.lng - from.lng;
  const dLat = to.lat - from.lat;
  return ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
}

function calcSpeed(from, to, intervalMs) {
  const R = 6371000;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round((dist / (intervalMs / 1000)) * 3.6); // km/h
}

const DEMO_DRIVERS = [
  { id: 'user-drv-001', name: 'Ravi Kumar' },
  { id: 'user-drv-002', name: 'Priya Sharma' },
  { id: 'user-drv-003', name: 'Amit Patel' },
  { id: 'user-drv-004', name: 'Neha Singh' },
  { id: 'user-drv-005', name: 'Kiran Rao' },
];

export default function DriverSimulatorModal({ onClose }) {
  const { socket, connected } = useSocket();
  const [running, setRunning] = useState(false);
  const [currentWaypoint, setCurrentWaypoint] = useState(0);
  const [currentPos, setCurrentPos] = useState(DEFAULT_ROUTE[0]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentHeading, setCurrentHeading] = useState(0);
  const [status, setStatus] = useState('active');
  const [selectedDriver, setSelectedDriver] = useState('user-drv-001');
  const [interval, setIntervalMs] = useState(2000);
  const [log, setLog] = useState([]);
  const [issueText, setIssueText] = useState('');
  const [sendingIssue, setSendingIssue] = useState(false);
  const timerRef = useRef(null);
  const wpRef = useRef(0);

  const addLog = useCallback((msg) => {
    setLog(prev => [`${new Date().toLocaleTimeString()} — ${msg}`, ...prev].slice(0, 20));
  }, []);

  const sendUpdate = useCallback((pos, speed, heading, stat) => {
    if (!socket || !connected) return;
    socket.emit('location_update', {
      driver_id: selectedDriver,
      lat: pos.lat,
      lng: pos.lng,
      speed,
      heading,
      status: stat,
    });
  }, [socket, connected, selectedDriver]);

  const startSimulation = useCallback(() => {
    if (!socket || !connected) { addLog('⚠️ Socket not connected'); return; }
    wpRef.current = 0;
    setCurrentWaypoint(0);
    setRunning(true);
    addLog('▶️ Simulation started');
  }, [socket, connected, addLog]);

  const stopSimulation = useCallback(() => {
    clearTimeout(timerRef.current);
    setRunning(false);
    sendUpdate(currentPos, 0, currentHeading, 'idle');
    addLog('⏹️ Simulation stopped — driver set to idle');
  }, [currentPos, currentHeading, sendUpdate, addLog]);

  useEffect(() => {
    if (!running) return;

    const step = () => {
      const routeLen = DEFAULT_ROUTE.length;
      const from = DEFAULT_ROUTE[wpRef.current % routeLen];
      const to = DEFAULT_ROUTE[(wpRef.current + 1) % routeLen];

      const heading = calcHeading(from, to);
      const speed = calcSpeed(from, to, interval);
      // Add small jitter to look natural
      const pos = {
        lat: to.lat + (Math.random() - 0.5) * 0.0001,
        lng: to.lng + (Math.random() - 0.5) * 0.0001,
      };

      setCurrentPos(pos);
      setCurrentSpeed(speed);
      setCurrentHeading(Math.round(heading));
      setCurrentWaypoint(wpRef.current + 1);
      sendUpdate(pos, speed, heading, status);
      addLog(`📍 WP${(wpRef.current + 1) % routeLen} • ${speed} km/h • ${Math.round(heading)}°`);

      wpRef.current = (wpRef.current + 1) % (routeLen - 1);
      timerRef.current = setTimeout(step, interval);
    };

    timerRef.current = setTimeout(step, 100);
    return () => clearTimeout(timerRef.current);
  }, [running, interval, status, sendUpdate, addLog]);

  const changeStatus = (s) => {
    setStatus(s);
    if (running) sendUpdate(currentPos, currentSpeed, currentHeading, s);
    addLog(`🔄 Status → ${s}`);
  };

  const sendIssue = async () => {
    if (!issueText.trim()) return;
    setSendingIssue(true);
    try {
      // Via REST API (no real photo in browser sim)
      const form = new FormData();
      form.append('description', issueText);
      if (currentPos.lat) { form.append('lat', currentPos.lat); form.append('lng', currentPos.lng); }
      // Use driver token — for sim we use manager token with driver_id override via socket
      socket?.emit('issue_reported', { description: issueText, lat: currentPos.lat, lng: currentPos.lng, driver_id: selectedDriver });
      addLog(`🚨 Issue reported: "${issueText}"`);
      setIssueText('');
    } finally {
      setSendingIssue(false);
    }
  };

  const STATUS_OPTIONS = [
    { value: 'active', label: '🚀 Active', color: 'var(--color-success)' },
    { value: 'idle', label: '⏸ Idle', color: 'var(--color-warning)' },
    { value: 'issue', label: '🚨 Issue', color: 'var(--color-danger)' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 680 }}>
        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(6,182,212,0.05))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 20 }}>🎮</div>
            <div>
              <div className="modal-title">Driver GPS Simulator</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Stream live GPS data to the fleet map without a physical device</div>
            </div>
          </div>
          <button id="btn-close-simulator" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Connection status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: connected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-md)', border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--color-success)' : 'var(--color-danger)' }} />
            <span style={{ color: connected ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
              {connected ? 'Socket Connected — Ready to simulate' : 'Socket Disconnected — Login first'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            {/* Config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div className="form-group">
                <label className="form-label">Simulated Driver</label>
                <select id="sim-driver" className="select" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)} disabled={running}>
                  {DEMO_DRIVERS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Update Interval</label>
                <select id="sim-interval" className="select" value={interval} onChange={e => setIntervalMs(Number(e.target.value))} disabled={running}>
                  <option value={1000}>1 second (fast)</option>
                  <option value={2000}>2 seconds (normal)</option>
                  <option value={5000}>5 seconds (slow)</option>
                </select>
              </div>

              {/* Status control */}
              <div className="form-group">
                <label className="form-label">Driver Status</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      id={`sim-status-${opt.value}`}
                      className="btn btn-sm"
                      style={{ flex: 1, background: status === opt.value ? `${opt.color}22` : 'var(--bg-overlay)', color: status === opt.value ? opt.color : 'var(--text-muted)', border: `1px solid ${status === opt.value ? opt.color : 'var(--border-default)'}`, fontSize: 11 }}
                      onClick={() => changeStatus(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start / Stop */}
              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                {!running ? (
                  <button id="btn-start-sim" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={startSimulation} disabled={!connected}>
                    <Play size={14} /> Start Simulation
                  </button>
                ) : (
                  <button id="btn-stop-sim" className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={stopSimulation}>
                    <Square size={14} /> Stop
                  </button>
                )}
              </div>

              {/* Live metrics */}
              {running && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-2)', marginTop: 4 }}>
                  {[
                    { label: 'Speed', value: `${currentSpeed} km/h`, icon: '⚡' },
                    { label: 'Heading', value: `${currentHeading}°`, icon: '🧭' },
                    { label: 'Waypoint', value: `#${currentWaypoint % DEFAULT_ROUTE.length}`, icon: '📍' },
                  ].map(m => (
                    <div key={m.label} style={{ background: 'var(--bg-overlay)', borderRadius: 8, padding: 'var(--space-2)', textAlign: 'center', border: '1px solid var(--color-primary-glow)' }}>
                      <div style={{ fontSize: 14 }}>{m.icon}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--color-primary-light)' }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Issue reporting + log */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Issue report */}
              <div style={{ background: 'var(--bg-overlay)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={12} /> Report Issue (Simulation)
                </div>
                <textarea
                  id="sim-issue-text"
                  className="textarea"
                  style={{ minHeight: 60, fontSize: 12 }}
                  placeholder="Describe the incident..."
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                />
                <button id="btn-send-issue" className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={sendIssue} disabled={!issueText.trim() || sendingIssue}>
                  <AlertTriangle size={12} /> {sendingIssue ? 'Sending...' : 'Report Issue'}
                </button>
              </div>

              {/* Event log */}
              <div style={{ flex: 1, background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', overflow: 'hidden' }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Event Log
                </div>
                <div style={{ height: 160, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {log.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', paddingTop: 20 }}>Press Start to begin...</div>
                  ) : log.map((entry, i) => (
                    <div key={i} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{entry}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
