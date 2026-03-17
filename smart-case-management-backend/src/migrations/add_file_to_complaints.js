/**
 * Migration to add file support to complaints table
 */
require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('📡 Updating complaints table schema...');
    
    // Add file_path if not exists
    await pool.query(`
      ALTER TABLE complaints 
      ADD COLUMN IF NOT EXISTS file_path VARCHAR(500),
      ADD COLUMN IF NOT EXISTS file_name VARCHAR(200);
    `);
    
    console.log('✅ Complaints table updated with file columns.');
    await pool.end();
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
