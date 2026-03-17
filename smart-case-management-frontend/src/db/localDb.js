import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// On web, expo-sqlite sync API requires SharedArrayBuffer which is
// not available in standard Expo dev server. We disable local DB on web.
const IS_WEB = Platform.OS === 'web';

let db;

export const getDb = () => {
  if (IS_WEB) return null;
  if (!db) {
    try {
      db = SQLite.openDatabaseSync('smartcase.db');
    } catch (e) {
      console.warn('SQLite not available on this platform:', e.message);
      return null;
    }
  }
  return db;
};

export const initDatabase = async () => {
  if (IS_WEB) {
    console.log('ℹ️ SQLite disabled on web — using online-only mode');
    return;
  }
  try {
    const database = getDb();
    if (!database) return;

    database.execSync(`
      CREATE TABLE IF NOT EXISTS local_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        server_id INTEGER,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        full_name TEXT,
        badge_number TEXT,
        role TEXT DEFAULT 'officer',
        station TEXT,
        language TEXT DEFAULT 'en'
      );

      CREATE TABLE IF NOT EXISTS local_complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offline_id TEXT UNIQUE NOT NULL,
        server_id INTEGER,
        complaint_number TEXT,
        complainant_name TEXT NOT NULL,
        complainant_phone TEXT,
        complainant_address TEXT,
        complaint_type TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        language TEXT DEFAULT 'en',
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS local_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offline_id TEXT UNIQUE NOT NULL,
        server_id INTEGER,
        case_number TEXT,
        title TEXT NOT NULL,
        description TEXT,
        case_type TEXT,
        status TEXT DEFAULT 'open',
        priority TEXT DEFAULT 'medium',
        location TEXT,
        complaint_id TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS local_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        offline_id TEXT UNIQUE NOT NULL,
        server_id INTEGER,
        case_offline_id TEXT,
        evidence_number TEXT,
        title TEXT NOT NULL,
        description TEXT,
        evidence_type TEXT,
        file_path TEXT,
        file_name TEXT,
        synced INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);

    console.log('✅ Local SQLite database initialized');
  } catch (e) {
    console.warn('SQLite init failed (non-fatal on web):', e.message);
  }
};

// Generate offline unique ID
export const generateOfflineId = () => `offline_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

// ─── Complaints ───────────────────────────────────────────
export const saveComplaintLocally = (complaint) => {
  const db = getDb();
  if (!db) return null;
  const offlineId = complaint.offline_id || generateOfflineId();
  db.runSync(
    `INSERT OR REPLACE INTO local_complaints 
     (offline_id, complainant_name, complainant_phone, complainant_address, complaint_type,
      description, location, priority, language, synced)
     VALUES (?,?,?,?,?,?,?,?,?,0)`,
    [offlineId, complaint.complainant_name, complaint.complainant_phone,
     complaint.complainant_address, complaint.complaint_type, complaint.description,
     complaint.location, complaint.priority || 'medium', complaint.language || 'en']
  );
  return offlineId;
};

export const getLocalComplaints = () => {
  const db = getDb();
  if (!db) return [];
  return db.getAllSync('SELECT * FROM local_complaints ORDER BY created_at DESC');
};

export const getUnsyncedComplaints = () => {
  const db = getDb();
  if (!db) return [];
  return db.getAllSync('SELECT * FROM local_complaints WHERE synced = 0');
};

export const markComplaintSynced = (offlineId, serverId) => {
  const db = getDb();
  if (!db) return;
  db.runSync(
    'UPDATE local_complaints SET synced = 1, server_id = ? WHERE offline_id = ?',
    [serverId, offlineId]
  );
};

// ─── Cases ────────────────────────────────────────────────
export const saveCaseLocally = (caseData) => {
  const db = getDb();
  if (!db) return null;
  const offlineId = caseData.offline_id || generateOfflineId();
  db.runSync(
    `INSERT OR REPLACE INTO local_cases 
     (offline_id, title, description, case_type, priority, location, synced)
     VALUES (?,?,?,?,?,?,0)`,
    [offlineId, caseData.title, caseData.description, caseData.case_type,
     caseData.priority || 'medium', caseData.location]
  );
  return offlineId;
};

export const getLocalCases = () => {
  const db = getDb();
  if (!db) return [];
  return db.getAllSync('SELECT * FROM local_cases ORDER BY created_at DESC');
};

export const getUnsyncedCases = () => {
  const db = getDb();
  if (!db) return [];
  return db.getAllSync('SELECT * FROM local_cases WHERE synced = 0');
};

export const markCaseSynced = (offlineId, serverId) => {
  const db = getDb();
  if (!db) return;
  db.runSync(
    'UPDATE local_cases SET synced = 1, server_id = ? WHERE offline_id = ?',
    [serverId, offlineId]
  );
};

// ─── Evidence ─────────────────────────────────────────────
export const saveEvidenceLocally = (evidence) => {
  const db = getDb();
  if (!db) return null;
  const offlineId = generateOfflineId();
  db.runSync(
    `INSERT INTO local_evidence 
     (offline_id, case_offline_id, title, description, evidence_type, file_path, file_name, synced)
     VALUES (?,?,?,?,?,?,?,0)`,
    [offlineId, evidence.case_offline_id, evidence.title, evidence.description,
     evidence.evidence_type, evidence.file_path, evidence.file_name]
  );
  return offlineId;
};

export const getLocalEvidence = (caseOfflineId) => {
  const db = getDb();
  if (!db) return [];
  if (caseOfflineId) {
    return db.getAllSync('SELECT * FROM local_evidence WHERE case_offline_id = ? ORDER BY created_at DESC', [caseOfflineId]);
  }
  return db.getAllSync('SELECT * FROM local_evidence ORDER BY created_at DESC');
};

// ─── Save user for offline login ──────────────────────────
export const saveUserLocally = (user) => {
  const db = getDb();
  if (!db) return; // no-op on web
  db.runSync(
    `INSERT OR REPLACE INTO local_users (server_id, username, full_name, badge_number, role, station, language)
     VALUES (?,?,?,?,?,?,?)`,
    [user.id, user.username, user.full_name, user.badge_number, user.role, user.station, user.language || 'en']
  );
};

export const getLocalUser = (username) => {
  const db = getDb();
  if (!db) return null; // no local users on web
  return db.getFirstSync('SELECT * FROM local_users WHERE username = ?', [username]);
};

