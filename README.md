# 🚚 Real-Time Delivery Tracking System

A **zero-cost, enterprise-grade** fleet management platform with live GPS tracking, incident reporting, and role-based dashboards.

---

## 🏗️ Architecture

```
delivery_tracking_system/
├── backend/          # Node.js + Express + Socket.io + SQLite (WASM)
├── web/              # React 19 + Vite + Leaflet (OSM) + Socket.io
├── driver_app/       # React Native / Expo Driver Android App
└── driver_apk/       # Flutter Android App alternative
```

---

## 🚀 Quick Start

### 1. Backend API

```bash
cd backend
npm install
node src/db/seed.js     # Create demo accounts + seed GPS data
npm run dev             # Starts on http://localhost:5000
```

### 2. Web Portal

```bash
cd web
npm install
npm run dev             # Starts on http://localhost:5173
```

### 3. React Native Driver App (Expo)

```bash
cd driver_app
npm install
npx expo start          # Run on physical phone via Expo Go or Android Emulator
```

> **Testing on Physical Phone**: Scan the QR code displayed in the terminal with the **Expo Go** app. Select `Wi-Fi (10.60.1.53)` on the login screen.
> **Testing on Android Emulator**: Press `a` in the Expo terminal. Select `Android Emulator (10.0.2.2)` on the login screen.
> **Build Standalone APK**: Run `npx eas build -p android --profile preview` or `./gradlew assembleRelease`.

---

## 🔑 Demo Credentials

| Role    | Email                      | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@delivery.com        | admin123    |
| Manager | manager@delivery.com      | manager123  |
| Driver  | driver1@delivery.com      | driver123   |
| Driver  | driver2@delivery.com      | driver123   |
| Driver  | driver3-5@delivery.com    | driver123   |

---

## 🎮 In-Browser GPS Simulator

No physical device needed! Open the web portal as Manager/Admin and click **🎮 Simulate** in the Fleet Map topbar to stream live GPS data directly from your browser.

---

## ✨ Features

### Backend
- ✅ JWT Authentication (bcryptjs + jsonwebtoken)
- ✅ Role-based access control (driver / manager / admin)
- ✅ SQLite database (WASM, zero native deps)
- ✅ Atomic GPS UPSERT with location history
- ✅ Multer image upload for issue photos
- ✅ Socket.io real-time event bus
- ✅ Driver auto-offline on disconnect
- ✅ Admin telemetry endpoint (uptime, memory, sockets)

### Web Portal
- ✅ Dark mode premium UI (glassmorphism, Inter font)
- ✅ Interactive Leaflet map (OpenStreetMap, zero cost)
- ✅ Custom vehicle markers with heading arrows + radar rings
- ✅ Status-colored markers (active/idle/issue/offline)
- ✅ Live driver list with speed & last-seen
- ✅ Driver detail drawer with telemetry grid + issue history
- ✅ Real-time issue feed with photo thumbnails + resolve action
- ✅ Admin user management (CRUD, search, filter, pagination)
- ✅ System telemetry dashboard (memory bar, uptime, socket count)
- ✅ GPS Simulator modal (no device needed!)
- ✅ Fully responsive design

### Driver APK (Flutter)
- ✅ Mandatory GPS enforcement dialog (cannot be dismissed)
- ✅ Continuous GPS streaming via Socket.io (5s interval)
- ✅ Status toggle (Active / Idle / Issue)
- ✅ Forced live camera capture (no gallery access)
- ✅ Multipart issue photo upload with GPS coordinates
- ✅ JWT auth with SharedPreferences persistence
- ✅ Auto-detect online/offline with visual indicator

---

## 📡 API Reference

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | Public | Get JWT token |
| GET | /api/auth/me | Any | Current user |
| GET | /api/drivers | Manager, Admin | All drivers + locations |
| GET | /api/drivers/:id | Any | Single driver detail |
| POST | /api/issues | Driver | Report issue + photo |
| GET | /api/issues | Manager, Admin | All issues |
| PATCH | /api/issues/:id/status | Manager, Admin | Resolve issue |
| GET | /api/admin/users | Admin | User list |
| POST | /api/admin/users | Admin | Create user |
| PUT | /api/admin/users/:id | Admin | Update user |
| DELETE | /api/admin/users/:id | Admin | Delete user |
| GET | /api/admin/telemetry | Admin | Server health |

## 🔌 Socket.io Events

| Event (Client → Server) | Description |
|------------------------|-------------|
| `location_update` | Driver GPS position update |
| `status_change` | Driver status change |
| `issue_reported` | Issue notification |

| Event (Server → Client) | Description |
|------------------------|-------------|
| `initial_fleet_state` | All drivers + locations on connect |
| `fleet_update` | Single driver GPS update |
| `driver_status_changed` | Driver status change |
| `issue_alert` | New incident reported |
| `issue_updated` | Issue resolved/updated |
