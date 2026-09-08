import { Platform } from 'react-native';

// Default backend URL based on platform
export const DEFAULT_SERVER_URL = Platform.select({
  android: 'http://10.0.2.2:5000', // Standard Android emulator loopback to host
  ios: 'http://localhost:5000',
  default: 'http://localhost:5000',
});

export const PRESET_SERVER_URLS = [
  { label: 'Localhost (5000)', url: 'http://localhost:5000' },
  { label: 'Android Emulator (10.0.2.2)', url: 'http://10.0.2.2:5000' },
  { label: 'Wi-Fi Network (10.60.1.53)', url: 'http://10.60.1.53:5000' },
];

export const DEMO_CREDENTIALS = {
  email: 'driver1@delivery.com',
  password: 'driver123',
  name: 'Ravi Kumar',
};

export const STATUS_COLORS = {
  active: '#10b981', // Green
  idle: '#f59e0b',   // Amber
  issue: '#ef4444',  // Red
  offline: '#6b7280',// Gray
};

export const ISSUE_TYPES = [
  { id: 'vehicle_breakdown', label: 'Vehicle Breakdown', emoji: '🔧' },
  { id: 'flat_tire', label: 'Flat Tire / Puncture', emoji: '🛞' },
  { id: 'accident', label: 'Accident / Collision', emoji: '💥' },
  { id: 'traffic_delay', label: 'Severe Traffic Jam', emoji: '🚦' },
  { id: 'cargo_damage', label: 'Cargo / Package Damaged', emoji: '📦' },
  { id: 'fuel_empty', label: 'Fuel / Battery Depleted', emoji: '⛽' },
];

export const SEVERITIES = [
  { id: 'low', label: 'Low', color: '#3b82f6' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#f97316' },
  { id: 'critical', label: 'Critical', color: '#ef4444' },
];
