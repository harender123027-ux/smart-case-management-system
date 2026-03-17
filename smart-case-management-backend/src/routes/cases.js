const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

const generateCaseNo = () => `CASE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// GET /api/cases
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (status) { params.push(status); where += ` AND c.status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); where += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length} OR c.case_number ILIKE $${params.length})`; }

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT c.*, u.full_name as officer_name, u.badge_number,
              cp.complainant_name, cp.complaint_number
       FROM cases c
       LEFT JOIN users u ON c.assigned_officer_id = u.id
       LEFT JOIN complaints cp ON c.complaint_id = cp.id
       ${where} ORDER BY c.created_at DESC 
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM cases');
    res.json({
      cases: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/cases/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name as officer_name, u.badge_number 
       FROM cases c LEFT JOIN users u ON c.assigned_officer_id = u.id 
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Case not found' });

    const evidence = await pool.query('SELECT * FROM evidence WHERE case_id = $1', [req.params.id]);
    res.json({ ...result.rows[0], evidence: evidence.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/cases
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, case_type, priority, complaint_id,
            assigned_officer_id, location, date_of_incident, offline_id } = req.body;

    const case_number = generateCaseNo();
    const result = await pool.query(
      `INSERT INTO cases (case_number, title, description, case_type, priority, complaint_id,
        assigned_officer_id, location, date_of_incident, offline_id, synced)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING *`,
      [case_number, title, description, case_type, priority || 'medium', complaint_id,
       assigned_officer_id || req.user.id, location, date_of_incident, offline_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/cases/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, title, description, assigned_officer_id } = req.body;
    const result = await pool.query(
      `UPDATE cases SET status=$1, priority=$2, title=$3, description=$4,
        assigned_officer_id=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
      [status, priority, title, description, assigned_officer_id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Case not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/cases/sync
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { cases } = req.body;
    const results = [];
    for (const c of cases) {
      const case_number = generateCaseNo();
      const result = await pool.query(
        `INSERT INTO cases (case_number, title, description, case_type, priority,
          assigned_officer_id, location, offline_id, synced)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true) ON CONFLICT DO NOTHING RETURNING *`,
        [case_number, c.title, c.description, c.case_type, c.priority,
         req.user.id, c.location, c.offline_id]
      );
      if (result.rows[0]) results.push({ offline_id: c.offline_id, server_id: result.rows[0].id });
    }
    res.json({ synced: results.length, results });
  } catch (err) {
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/cases/stats/summary
router.get('/stats/summary', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_cases,
        COUNT(*) FILTER (WHERE status = 'open') as open_cases,
        COUNT(*) FILTER (WHERE status = 'investigating') as investigating,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_cases,
        COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_cases
      FROM cases
    `);
    const complaints = await pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(*) FILTER (WHERE status = 'pending') as pending
      FROM complaints
    `);
    res.json({ ...result.rows[0], ...complaints.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
