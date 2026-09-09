'use strict';
const { Database } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(process.env.DB_PATH || './delivery.db');

/** @type {import('node-sqlite3-wasm').Database} */
let db;

function initDB() {
  db = new Database(DB_PATH);

  // Performance pragmas
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');
  db.run('PRAGMA synchronous=NORMAL');
  db.run('PRAGMA cache_size=-32000');

  // Create schema — split by semicolon and run each statement
  const schemaSQL = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
  const statements = schemaSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  for (const stmt of statements) {
    db.run(stmt);
  }

  // Safe schema migrations for issues table
  try { db.run('ALTER TABLE issues ADD COLUMN type TEXT DEFAULT "vehicle_breakdown"'); } catch (_) {}
  try { db.run('ALTER TABLE issues ADD COLUMN severity TEXT DEFAULT "medium"'); } catch (_) {}
  try { db.run('ALTER TABLE issues ADD COLUMN address TEXT'); } catch (_) {}

  console.log(`[DB] SQLite (WASM) initialized at: ${DB_PATH}`);
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not initialized. Call initDB() first.');
  return db;
}

/**
 * Returns multiple rows as array of objects.
 * @param {string} sql
 * @param {any[]} params
 */
function dbAll(sql, params = []) {
  const stmt = getDB().prepare(sql);
  const rows = stmt.all(params);
  stmt.finalize();
  return rows;
}

/**
 * Returns single row or undefined.
 * @param {string} sql
 * @param {any[]} params
 */
function dbGet(sql, params = []) {
  const stmt = getDB().prepare(sql);
  const row = stmt.get(params);
  stmt.finalize();
  return row;
}

/**
 * Executes a mutation (INSERT/UPDATE/DELETE).
 * @param {string} sql
 * @param {any[]} params
 */
function dbRun(sql, params = []) {
  const stmt = getDB().prepare(sql);
  stmt.run(params);
  stmt.finalize();
}

/**
 * Execute multiple operations in a transaction.
 * @param {() => void} fn
 */
function dbTransaction(fn) {
  getDB().run('BEGIN');
  try {
    fn();
    getDB().run('COMMIT');
  } catch (err) {
    getDB().run('ROLLBACK');
    throw err;
  }
}

module.exports = { initDB, getDB, dbAll, dbGet, dbRun, dbTransaction };
