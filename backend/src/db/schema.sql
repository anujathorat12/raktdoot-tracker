-- =========================================================
-- Delivery Tracking System — SQLite Schema
-- =========================================================

-- ─── USERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role        TEXT NOT NULL CHECK(role IN ('driver', 'manager', 'admin')),
  phone       TEXT,
  avatar_color TEXT DEFAULT '#6366f1',
  is_active   INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── DRIVER LOCATIONS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS driver_locations (
  driver_id   TEXT PRIMARY KEY,
  lat         REAL NOT NULL DEFAULT 0,
  lng         REAL NOT NULL DEFAULT 0,
  speed       REAL NOT NULL DEFAULT 0,
  heading     REAL NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'offline' CHECK(status IN ('active', 'idle', 'issue', 'offline')),
  address     TEXT,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── DELIVERY HISTORY ────────────────────────────────────
CREATE TABLE IF NOT EXISTS location_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  driver_id   TEXT NOT NULL,
  lat         REAL NOT NULL,
  lng         REAL NOT NULL,
  speed       REAL NOT NULL DEFAULT 0,
  heading     REAL NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── ISSUES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
  id          TEXT PRIMARY KEY,
  driver_id   TEXT NOT NULL,
  description TEXT NOT NULL,
  image_path  TEXT,
  lat         REAL,
  lng         REAL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
  resolved_by TEXT,
  resolved_at TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ─── INDEXES ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_driver_locations_status ON driver_locations(status);
CREATE INDEX IF NOT EXISTS idx_issues_driver ON issues(driver_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_location_history_driver ON location_history(driver_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
