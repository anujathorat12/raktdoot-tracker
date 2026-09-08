'use strict';
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { dbGet } = require('../db/database');
const { upsertLocation } = require('../modules/drivers/drivers.service');
const { getAllDriversWithLocations } = require('../modules/drivers/drivers.service');

/** @type {import('socket.io').Server} */
let io;

// Telemetry counters
const telemetry = {
  totalConnections: 0,
  locationUpdatesProcessed: 0,
};

/**
 * Initialize Socket.io on the HTTP server.
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim());

  io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
          return cb(null, true);
        }
        cb(null, true);
      },
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // ─── JWT AUTH MIDDLEWARE ─────────────────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Socket: No auth token provided.'));

    try {
      const jwtSecret = process.env.JWT_SECRET || 'delivery_tracking_super_secret_key_2024';
      const decoded = jwt.verify(token, jwtSecret);
      const user = dbGet(
        'SELECT id, name, email, role, avatar_color FROM users WHERE id = ? AND is_active = 1',
        [decoded.id]
      );
      if (!user) return next(new Error('Socket: User not found or inactive.'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Socket: Invalid token.'));
    }
  });

  // ─── CONNECTION HANDLER ──────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const { user } = socket;
    telemetry.totalConnections++;
    console.log(`[Socket] ✅ Connected: ${user.name} (${user.role}) — ${socket.id}`);

    // ── JOIN ROOMS BASED ON ROLE ──────────────────────────────────────────────
    // Allow all authenticated clients (manager, admin, driver) to monitor fleet updates
    socket.join('fleet-monitors');

    // Send complete fleet state to the new watcher
    const fleetState = getAllDriversWithLocations();
    socket.emit('initial_fleet_state', {
      drivers: fleetState,
      telemetry: {
        connectedClients: io.sockets.sockets.size,
        locationUpdatesProcessed: telemetry.locationUpdatesProcessed,
      },
    });

    if (user.role === 'driver') {
      socket.join(`driver:${user.id}`);
      socket.join('drivers');
    }

    // ── DRIVER → GPS LOCATION UPDATE ─────────────────────────────────────────
    socket.on('location_update', (data) => {
      if (user.role !== 'driver') return;

      const { lat, lng, speed, heading, status, address } = data;
      if (lat == null || lng == null) return;

      try {
        upsertLocation({
          driver_id: user.id,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          speed: parseFloat(speed) || 0,
          heading: parseFloat(heading) || 0,
          status: status || 'active',
          address: address || null,
        });

        telemetry.locationUpdatesProcessed++;

        // Broadcast to all fleet monitors
        io.to('fleet-monitors').emit('fleet_update', {
          driver_id: user.id,
          driver_name: user.name,
          avatar_color: user.avatar_color,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          speed: parseFloat(speed) || 0,
          heading: parseFloat(heading) || 0,
          status: status || 'active',
          address: address || null,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[Socket] ❌ Error saving location:', err.message);
      }
    });

    // ── DRIVER → STATUS CHANGE ────────────────────────────────────────────────
    socket.on('status_change', (data) => {
      if (user.role !== 'driver') return;
      const { status } = data;
      if (!status) return;

      try {
        const { dbRun } = require('../db/database');
        dbRun(
          "UPDATE driver_locations SET status = ?, updated_at = datetime('now') WHERE driver_id = ?",
          [status, user.id]
        );
        io.to('fleet-monitors').emit('driver_status_changed', {
          driver_id: user.id,
          driver_name: user.name,
          status,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('[Socket] ❌ Error updating status:', err.message);
      }
    });

    // ── DRIVER → ISSUE REPORTED (complement to REST API) ─────────────────────
    socket.on('issue_reported', (data) => {
      if (user.role !== 'driver') return;
      const issuePayload = {
        driver_id: user.id,
        driver_name: user.name,
        ...data,
        timestamp: new Date().toISOString(),
      };
      io.to('fleet-monitors').emit('issue_alert', {
        ...issuePayload,
        issue: issuePayload,
      });
    });

    // ── TELEMETRY PING ────────────────────────────────────────────────────────
    socket.on('request_telemetry', () => {
      if (user.role !== 'admin') return;
      socket.emit('telemetry_update', {
        connectedClients: io.sockets.sockets.size,
        locationUpdatesProcessed: telemetry.locationUpdatesProcessed,
        totalConnections: telemetry.totalConnections,
      });
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      console.log(`[Socket] ❌ Disconnected: ${user.name} (${user.role}) — ${reason}`);

      // Mark driver offline on disconnect
      if (user.role === 'driver') {
        try {
          const { dbRun } = require('../db/database');
          dbRun(
            "UPDATE driver_locations SET status = 'offline', updated_at = datetime('now') WHERE driver_id = ?",
            [user.id]
          );
          io.to('fleet-monitors').emit('driver_status_changed', {
            driver_id: user.id,
            driver_name: user.name,
            status: 'offline',
            timestamp: new Date().toISOString(),
          });
        } catch (_) {}
      }
    });
  });

  console.log('[Socket] Socket.io initialized.');
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
}

module.exports = { initSocket, getIO };
