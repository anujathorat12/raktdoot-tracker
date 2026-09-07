'use strict';
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { initDB, dbRun, dbGet } = require('./database');

initDB();

const SALT_ROUNDS = 10;

const users = [
  // Admin
  {
    id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@delivery.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91-9000000001',
    avatar_color: '#ef4444',
  },
  // Managers
  {
    id: 'user-mgr-001',
    name: 'Sarah Manager',
    email: 'manager@delivery.com',
    password: 'manager123',
    role: 'manager',
    phone: '+91-9000000002',
    avatar_color: '#8b5cf6',
  },
  // Drivers
  {
    id: 'user-drv-001',
    name: 'Ravi Kumar',
    email: 'driver1@delivery.com',
    password: 'driver123',
    role: 'driver',
    phone: '+91-9000000011',
    avatar_color: '#06b6d4',
  },
  {
    id: 'user-drv-002',
    name: 'Priya Sharma',
    email: 'driver2@delivery.com',
    password: 'driver123',
    role: 'driver',
    phone: '+91-9000000012',
    avatar_color: '#10b981',
  },
  {
    id: 'user-drv-003',
    name: 'Amit Patel',
    email: 'driver3@delivery.com',
    password: 'driver123',
    role: 'driver',
    phone: '+91-9000000013',
    avatar_color: '#f59e0b',
  },
  {
    id: 'user-drv-004',
    name: 'Neha Singh',
    email: 'driver4@delivery.com',
    password: 'driver123',
    role: 'driver',
    phone: '+91-9000000014',
    avatar_color: '#ec4899',
  },
  {
    id: 'user-drv-005',
    name: 'Kiran Rao',
    email: 'driver5@delivery.com',
    password: 'driver123',
    role: 'driver',
    phone: '+91-9000000015',
    avatar_color: '#84cc16',
  },
];

// Demo initial locations across Mumbai
const initialLocations = [
  { driver_id: 'user-drv-001', lat: 19.0760, lng: 72.8777, speed: 42, heading: 90,  status: 'active' },
  { driver_id: 'user-drv-002', lat: 19.0830, lng: 72.8830, speed: 28, heading: 180, status: 'active' },
  { driver_id: 'user-drv-003', lat: 19.0650, lng: 72.8700, speed: 0,  heading: 0,   status: 'idle'   },
  { driver_id: 'user-drv-004', lat: 19.0900, lng: 72.8900, speed: 55, heading: 270, status: 'active' },
  { driver_id: 'user-drv-005', lat: 19.0700, lng: 72.8850, speed: 0,  heading: 45,  status: 'issue'  },
];

async function seed() {
  console.log('🌱 Seeding database...\n');

  for (const u of users) {
    const existing = dbGet('SELECT id FROM users WHERE id = ?', [u.id]);
    if (existing) {
      console.log(`  ⚠️  User ${u.email} already exists — skipping`);
      continue;
    }
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    dbRun(
      `INSERT INTO users (id, name, email, password_hash, role, phone, avatar_color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, hash, u.role, u.phone, u.avatar_color]
    );
    console.log(`  ✅  Created ${u.role.padEnd(8)} → ${u.email} (password: ${u.password})`);
  }

  console.log('\n📍 Seeding driver locations...');
  for (const loc of initialLocations) {
    dbRun(
      `INSERT INTO driver_locations (driver_id, lat, lng, speed, heading, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(driver_id) DO UPDATE SET
         lat=excluded.lat, lng=excluded.lng,
         speed=excluded.speed, heading=excluded.heading,
         status=excluded.status, updated_at=datetime('now')`,
      [loc.driver_id, loc.lat, loc.lng, loc.speed, loc.heading, loc.status]
    );
    console.log(`  ✅  Location seeded for driver ${loc.driver_id}`);
  }

  console.log('\n✨ Seed complete!');
  console.log('\nDemo Credentials:');
  console.log('  Admin:   admin@delivery.com     / admin123');
  console.log('  Manager: manager@delivery.com   / manager123');
  console.log('  Driver:  driver1@delivery.com   / driver123');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
