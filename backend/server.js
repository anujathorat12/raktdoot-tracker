'use strict';
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./src/sockets/socket.handler');
const { initDB } = require('./src/db/database');

const PORT = process.env.PORT || 5000;

// Initialize database first
initDB();

const httpServer = http.createServer(app);

// Initialize Socket.io on the same HTTP server
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log('╔════════════════════════════════════════╗');
  console.log(`║  🚚  Delivery Tracking API              ║`);
  console.log(`║  🌐  http://localhost:${PORT}            ║`);
  console.log(`║  📡  Socket.io ready                    ║`);
  console.log('╚════════════════════════════════════════╝');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('SIGINT received — shutting down gracefully...');
  httpServer.close(() => process.exit(0));
});
