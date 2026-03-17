const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/stats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const totalCases = await pool.query('SELECT COUNT(*) FROM cases');
    const openCases = await pool.query("SELECT COUNT(*) FROM cases WHERE status = 'open'");
    const urgentCases = await pool.query("SELECT COUNT(*) FROM cases WHERE priority = 'urgent'");
    const pendingComplaints = await pool.query("SELECT COUNT(*) FROM complaints WHERE status = 'pending'");

    res.json({
      total: parseInt(totalCases.rows[0].count),
      open: parseInt(openCases.rows[0].count),
      urgent: parseInt(urgentCases.rows[0].count),
      pending: parseInt(pendingComplaints.rows[0].count)
    });
  } catch (err) {
    console.error('Stats fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
