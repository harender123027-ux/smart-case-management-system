/**
 * Smart Case Management System — Database Migration Script
 * Run: node src/migrations/migrate.js
 * 
 * Make sure to update .env with your actual PostgreSQL credentials first!
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  console.log('\n🚔 Smart Case Management — Database Setup\n');
  
  // First, connect to default 'postgres' database to create smart_case_db
  const adminPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Create database if not exists
    console.log('📦 Creating database smart_case_db...');
    await adminPool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='smart_case_db'");
    await adminPool.query('CREATE DATABASE smart_case_db').catch(e => {
      if (e.code === '42P04') console.log('   Database already exists ✓');
      else throw e;
    });
    console.log('   ✅ Database ready\n');
    await adminPool.end();

    // Now connect to smart_case_db and run schema
    const pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('📋 Running schema migration...');
    await pool.query(schema);
    console.log('   ✅ Tables created: users, complaints, cases, evidence\n');

    // Verify tables
    const tablesResult = await pool.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    );
    console.log('📊 Tables in database:');
    tablesResult.rows.forEach(r => console.log(`   • ${r.tablename}`));

    // Check seed user
    const users = await pool.query('SELECT username, role FROM users');
    console.log('\n👮 Default users:');
    users.rows.forEach(u => console.log(`   • ${u.username} (${u.role}) — password: password`));

    await pool.end();
    console.log('\n✅ Migration complete! You can now start the backend:\n   npm run dev\n');
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\n💡 Fix: Update .env with your correct PostgreSQL credentials');
    console.error('   DB_USER=postgres');
    console.error('   DB_PASSWORD=your_actual_password\n');
    process.exit(1);
  }
}

migrate();
