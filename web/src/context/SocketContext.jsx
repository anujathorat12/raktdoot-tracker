import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [fleetDrivers, setFleetDrivers] = useState({});
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
      setConnected(false);
      return;
    }

    const socket = io(SOCKET_URL, { auth: { token }, reconnectionAttempts: 5, reconnectionDelay: 2000 });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => console.error('[Socket] connect_error:', err.message));

    // ── Manager / Admin events ──
    socket.on('initial_fleet_state', ({ drivers }) => {
      const map = {};
      drivers.forEach(d => { map[d.id] = d; });
      setFleetDrivers(map);
    });

    socket.on('fleet_update', (update) => {
      setFleetDrivers(prev => ({
        ...prev,
        [update.driver_id]: {
          ...(prev[update.driver_id] || {}),
          id: update.driver_id,
          name: update.driver_name,
          avatar_color: update.avatar_color,
          lat: update.lat, lng: update.lng,
          speed: update.speed, heading: update.heading,
          status: update.status,
          address: update.address !== undefined ? update.address : prev[update.driver_id]?.address,
          updated_at: update.updated_at,
        },
      }));
    });

    socket.on('driver_status_changed', (data) => {
      setFleetDrivers(prev => ({
        ...prev,
        [data.driver_id]: {
          ...(prev[data.driver_id] || {}),
          id: data.driver_id,
          name: data.driver_name,
          status: data.status,
          updated_at: data.timestamp,
        },
      }));
    });

    socket.on('issue_alert', (data) => {
      const issue = data?.issue || data;
      setIssues(prev => [issue, ...prev].slice(0, 100));
    });

    socket.on('issue_updated', ({ issue }) => {
      setIssues(prev => prev.map(i => i.id === issue.id ? issue : i));
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token, user]);

  // Emit from driver context
  const emitLocationUpdate = useCallback((data) => {
    socketRef.current?.emit('location_update', data);
  }, []);

  const emitStatusChange = useCallback((status) => {
    socketRef.current?.emit('status_change', { status });
  }, []);

  const emitIssueReported = useCallback((data) => {
    socketRef.current?.emit('issue_reported', data);
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      fleetDrivers,
      fleetDriversList: Object.values(fleetDrivers),
      issues, setIssues,
      emitLocationUpdate, emitStatusChange, emitIssueReported,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
