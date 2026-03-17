-- Create database: smart_case_db
-- Run this in psql: CREATE DATABASE smart_case_db;

-- Users (Police Officers & Admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  badge_number VARCHAR(50) UNIQUE,
  role VARCHAR(20) DEFAULT 'officer' CHECK (role IN ('officer', 'admin', 'inspector')),
  station VARCHAR(200),
  phone VARCHAR(20),
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Complaints (Filed by public or officers)
CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  complaint_number VARCHAR(50) UNIQUE NOT NULL,
  complainant_name VARCHAR(200) NOT NULL,
  complainant_phone VARCHAR(20),
  complainant_address TEXT,
  complaint_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_officer_id INTEGER REFERENCES users(id),
  registered_by INTEGER REFERENCES users(id),
  language VARCHAR(10) DEFAULT 'en',
  offline_id VARCHAR(100),
  file_path VARCHAR(500),
  file_name VARCHAR(200),
  synced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cases (Formal police cases linked to complaints)
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  case_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  case_type VARCHAR(100),
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'closed', 'archived')),
  priority VARCHAR(20) DEFAULT 'medium',
  complaint_id INTEGER REFERENCES complaints(id),
  assigned_officer_id INTEGER REFERENCES users(id),
  location TEXT,
  date_of_incident TIMESTAMP,
  offline_id VARCHAR(100),
  synced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Evidence (Linked to cases)
CREATE TABLE IF NOT EXISTS evidence (
  id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES cases(id),
  evidence_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  evidence_type VARCHAR(50) CHECK (evidence_type IN ('document', 'photo', 'video', 'audio', 'physical', 'other')),
  file_path VARCHAR(500),
  file_name VARCHAR(200),
  collected_by INTEGER REFERENCES users(id),
  collection_date TIMESTAMP DEFAULT NOW(),
  offline_id VARCHAR(100),
  synced BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed: Default admin user (password: admin123)
INSERT INTO users (username, password_hash, full_name, badge_number, role, station)
VALUES (
  'admin',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin Officer',
  'ADMIN001',
  'admin',
  'Central Police Station'
) ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, password_hash, full_name, badge_number, role, station)
VALUES (
  'officer1',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Sub Inspector Sharma',
  'SI001',
  'officer',
  'Zone A Station'
) ON CONFLICT (username) DO NOTHING;
