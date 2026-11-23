const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'paisapilot.db');

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      type TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      balance REAL NOT NULL DEFAULT 0.0,
      is_primary INTEGER NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      merchant TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'DEBIT' or 'CREDIT'
      category TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      date TEXT NOT NULL, -- 'YYYY-MM-DD'
      notes TEXT,
      is_recurring INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      month TEXT NOT NULL, -- 'YYYY-MM'
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      merchant TEXT NOT NULL,
      amount REAL NOT NULL,
      billing_cycle TEXT NOT NULL, -- 'monthly' or 'yearly'
      category TEXT NOT NULL,
      renewal_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      payment_method TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS split_groups (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      total_amount REAL NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'Aarav Sharma',
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active' or 'settled'
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS split_items (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      friend_name TEXT NOT NULL,
      friend_upi TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' or 'PAID'
      upi_link TEXT,
      settled_at TEXT,
      FOREIGN KEY (group_id) REFERENCES split_groups(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' or 'PAID'
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT,
      action_type TEXT NOT NULL,
      server_name TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      input_arguments TEXT,
      output_result TEXT,
      requires_approval INTEGER NOT NULL DEFAULT 0,
      approval_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
      approval_details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

module.exports = {
  db,
  initSchema,
  DB_PATH
};
