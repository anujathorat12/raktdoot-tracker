import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Switch, Platform
} from 'react-native';
import * as Location from 'expo-location';
import { STATUS_COLORS } from '../config/constants';
import { socketManager } from '../services/socket';
import { createIssue, getDriverIssues } from '../services/api';
import { LocationSimulator } from '../services/locationSimulator';
import ReportIssueModal from '../components/ReportIssueModal';
import IssuesHistoryModal from '../components/IssuesHistoryModal';

export default function DriverDashboardScreen({
  user,
  token,
  serverUrl,
  onLogout,
}) {
  const [driverStatus, setDriverStatus] = useState('active'); // active, idle, offline
  const [socketConnected, setSocketConnected] = useState(false);
  const [useSimulator, setUseSimulator] = useState(true);
  const [currentTelemetry, setCurrentTelemetry] = useState({
    lat: 19.0760,
    lng: 72.8777,
    speed: 0,
    heading: 0,
    address: 'Bandra West Logistics Hub',
  });
  const [pingsCount, setPingsCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [issuesHistory, setIssuesHistory] = useState([]);

  // Simulator & GPS tracking references
  const simulatorRef = useRef(new LocationSimulator());
  const locationSubRef = useRef(null);
  const intervalRef = useRef(null);

  // Connect WebSocket on mount
  useEffect(() => {
    socketManager.connect(serverUrl, token, (connected) => {
      setSocketConnected(connected);
      if (connected) {
        socketManager.emitStatusChange(driverStatus);
      }
    });

    // Fetch past issues
    loadIssues();

    return () => {
      stopTracking();
      socketManager.disconnect();
    };
  }, [serverUrl, token]);

  const loadIssues = async () => {
    try {
      const data = await getDriverIssues(serverUrl, token);
      setIssuesHistory(data);
    } catch (_) {}
  };

  // Transmit location packet to backend
  const transmitLocation = useCallback((locationData, status) => {
    const payload = {
      lat: locationData.lat,
      lng: locationData.lng,
      speed: locationData.speed || 0,
      heading: locationData.heading || 0,
      status: status || driverStatus,
      address: locationData.address || null,
    };

    setCurrentTelemetry(locationData);
    setLastSyncTime(new Date());
    setPingsCount(prev => prev + 1);

    socketManager.emitLocationUpdate(payload);
  }, [driverStatus]);

  // Start location tracking (Simulator or Real GPS)
  const startTracking = useCallback(() => {
    stopTracking();

    if (driverStatus === 'offline') return;

    if (useSimulator) {
      // Periodic simulated driving updates every 3 seconds
      intervalRef.current = setInterval(() => {
        const nextPoint = simulatorRef.current.getNextPoint();
        transmitLocation(nextPoint, driverStatus);
      }, 3000);
    } else {
      // Real Hardware GPS via Expo Location
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert(
              'Permission Required',
              'Location permission denied. Switching to Route Simulator mode.',
              [{ text: 'OK', onPress: () => setUseSimulator(true) }]
            );
            return;
          }

          locationSubRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 3000,
              distanceInterval: 5,
            },
            (pos) => {
              const point = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                speed: Math.max(0, (pos.coords.speed || 0) * 3.6), // m/s to km/h
                heading: pos.coords.heading || 0,
                address: 'Real Device GPS Tracking',
              };
              transmitLocation(point, driverStatus);
            }
          );
        } catch (err) {
          console.warn('[GPS] Error watching position:', err);
          setUseSimulator(true);
        }
      })();
    }
  }, [driverStatus, useSimulator, transmitLocation]);

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }
  };

  // Restart tracking when status or tracking mode changes
  useEffect(() => {
    if (driverStatus !== 'offline') {
      startTracking();
    } else {
      stopTracking();
    }
    return () => stopTracking();
  }, [driverStatus, useSimulator, startTracking]);

  // Handle Shift Status Changes
  const handleStatusChange = (newStatus) => {
    setDriverStatus(newStatus);
    socketManager.emitStatusChange(newStatus);

    if (newStatus === 'offline') {
      stopTracking();
      // Send final offline ping
      transmitLocation({ ...currentTelemetry, speed: 0 }, 'offline');
    } else if (newStatus === 'idle') {
      transmitLocation({ ...currentTelemetry, speed: 0 }, 'idle');
    }
  };

  // Handle Issue Submission
  const handleReportIssue = async (issueData) => {
    // 1. Submit via REST API
    const created = await createIssue(serverUrl, token, issueData);

    // 2. Emit real-time WebSocket alert
    socketManager.emitIssueReported({
      ...created,
      driver_name: user?.name,
    });

    // 3. Update status to issue
    setDriverStatus('issue');
    socketManager.emitStatusChange('issue');

    // Refresh history
    setIssuesHistory(prev => [created, ...prev]);

    Alert.alert(
      'Alert Dispatched',
      'Your incident has been transmitted live to the manager console.'
    );
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'DR';

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topbar}>
        <View style={styles.driverProfile}>
          <View style={[styles.avatar, { backgroundColor: user?.avatar_color || '#6366f1' }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{user?.name || 'Delivery Driver'}</Text>
            <View style={styles.socketIndicator}>
              <View style={[styles.dot, { backgroundColor: socketConnected ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.socketText}>
                {socketConnected ? 'Connected (Live)' : 'Reconnecting...'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Shift Control Card */}
        <View style={styles.shiftCard}>
          <View style={styles.shiftHeader}>
            <Text style={styles.shiftCardTitle}>Shift Status</Text>
            <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[driverStatus]}22`, borderColor: STATUS_COLORS[driverStatus] }]}>
              <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[driverStatus] }]} />
              <Text style={[styles.statusPillText, { color: STATUS_COLORS[driverStatus] }]}>
                {driverStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Shift Buttons */}
          <View style={styles.shiftButtonsRow}>
            <TouchableOpacity
              style={[styles.shiftBtn, driverStatus === 'active' && styles.shiftBtnActive]}
              onPress={() => handleStatusChange('active')}
            >
              <Text style={styles.shiftBtnEmoji}>🚚</Text>
              <Text style={[styles.shiftBtnLabel, driverStatus === 'active' && styles.shiftBtnLabelActive]}>
                Online
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shiftBtn, driverStatus === 'idle' && styles.shiftBtnIdle]}
              onPress={() => handleStatusChange('idle')}
            >
              <Text style={styles.shiftBtnEmoji}>⏸️</Text>
              <Text style={[styles.shiftBtnLabel, driverStatus === 'idle' && { color: '#f59e0b', fontWeight: '700' }]}>
                Break
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shiftBtn, driverStatus === 'offline' && styles.shiftBtnOffline]}
              onPress={() => handleStatusChange('offline')}
            >
              <Text style={styles.shiftBtnEmoji}>🛑</Text>
              <Text style={[styles.shiftBtnLabel, driverStatus === 'offline' && { color: '#94a3b8', fontWeight: '700' }]}>
                Off Duty
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Telemetry HUD */}
        <View style={styles.hudCard}>
          <Text style={styles.hudTitle}>Live Vehicle Telemetry</Text>

          <View style={styles.hudGrid}>
            {/* Speedometer */}
            <View style={styles.hudTile}>
              <Text style={styles.tileLabel}>SPEED</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={styles.speedValue}>{Math.round(currentTelemetry.speed)}</Text>
                <Text style={styles.unitText}>km/h</Text>
              </View>
            </View>

            {/* Compass / Heading */}
            <View style={styles.hudTile}>
              <Text style={styles.tileLabel}>HEADING</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={styles.headingValue}>{currentTelemetry.heading}°</Text>
                <Text style={styles.unitText}>BEARING</Text>
              </View>
            </View>
          </View>

          {/* Coordinates & Route */}
          <View style={styles.routeBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 13 }}>📍</Text>
              <Text style={styles.coordsText}>
                {currentTelemetry.lat.toFixed(5)}, {currentTelemetry.lng.toFixed(5)}
              </Text>
            </View>
            <Text style={styles.addressText} numberOfLines={2}>
              {currentTelemetry.address}
            </Text>
          </View>

          {/* Pings & Sync */}
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Telemetry Packets Sent: <Text style={{ color: '#818cf8', fontWeight: '700' }}>{pingsCount}</Text></Text>
            <Text style={styles.metaLabel}>Synced: {lastSyncTime.toLocaleTimeString()}</Text>
          </View>
        </View>

        {/* GPS Tracking Mode Toggle */}
        <View style={styles.simulatorCard}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.simulatorTitle}>Route Simulation Mode</Text>
            <Text style={styles.simulatorSub}>
              {useSimulator
                ? 'Simulating realistic Mumbai logistics driving (Bandra ➔ Andheri ➔ BKC)'
                : 'Using physical device GPS sensor'}
            </Text>
          </View>
          <Switch
            value={useSimulator}
            onValueChange={setUseSimulator}
            trackColor={{ false: '#334155', true: '#4f46e5' }}
            thumbColor={useSimulator ? '#818cf8' : '#94a3b8'}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Emergency / Breakdown Alert Button */}
          <TouchableOpacity
            style={styles.emergencyBtn}
            onPress={() => setShowReportModal(true)}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>🚨</Text>
            <Text style={styles.emergencyBtnText}>Report Breakdown / Delay</Text>
          </TouchableOpacity>

          {/* Incident Log Button */}
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => setShowHistoryModal(true)}
          >
            <Text style={{ fontSize: 16, marginRight: 8 }}>📋</Text>
            <Text style={styles.historyBtnText}>My Incident Logs ({issuesHistory.length})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Incident Modals */}
      <ReportIssueModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportIssue}
        currentLocation={currentTelemetry}
      />

      <IssuesHistoryModal
        visible={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        issues={issuesHistory}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0b10',
  },
  topbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 36,
    paddingBottom: 14,
    backgroundColor: '#161822',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  driverProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  driverName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  socketIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  socketText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  shiftCard: {
    backgroundColor: '#161822',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shiftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shiftCardTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shiftButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  shiftBtn: {
    flex: 1,
    backgroundColor: '#0f111a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  shiftBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  shiftBtnIdle: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  shiftBtnOffline: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderColor: '#6b7280',
  },
  shiftBtnEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  shiftBtnLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  shiftBtnLabelActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  hudCard: {
    backgroundColor: '#161822',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  hudTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  hudGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  hudTile: {
    flex: 1,
    backgroundColor: '#0f111a',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tileLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  speedValue: {
    color: '#38bdf8',
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  headingValue: {
    color: '#a78bfa',
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  unitText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  routeBox: {
    backgroundColor: '#0f111a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 10,
  },
  coordsText: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '600',
  },
  addressText: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  simulatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161822',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  simulatorTitle: {
    color: '#c7d2fe',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  simulatorSub: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 6,
  },
  emergencyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  emergencyBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#161822',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 13,
  },
  historyBtnText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
});
