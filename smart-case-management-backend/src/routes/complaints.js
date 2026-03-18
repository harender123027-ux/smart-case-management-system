const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File upload configuration
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `complaint_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

// Generate complaint number
const generateComplaintNo = () => `COMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// GET /api/complaints
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT c.*, u.full_name as officer_name, u.badge_number 
                 FROM complaints c 
                 LEFT JOIN users u ON c.assigned_officer_id = u.id`;
    const params = [];

    if (status) { query += ` WHERE c.status = $${params.length + 1}`; params.push(status); }
    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) FROM complaints');
    
    res.json({
      complaints: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/complaints/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.full_name as officer_name FROM complaints c 
       LEFT JOIN users u ON c.assigned_officer_id = u.id WHERE c.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Complaint not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/complaints (Handle both JSON and Multipart)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('📬 POST /api/complaints hit', req.body);
  try {
    const {
      complainant_name, complainant_phone, complainant_address,
      complaint_type, description, location, priority, assigned_officer_id, language, offline_id
    } = req.body;

    const complaint_number = generateComplaintNo();
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;

    try {
      const result = await pool.query(
        `INSERT INTO complaints 
         (complaint_number, complainant_name, complainant_phone, complainant_address,
          complaint_type, description, location, priority, assigned_officer_id,
          registered_by, language, offline_id, file_path, file_name, synced)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
         RETURNING *`,
        [complaint_number, complainant_name, complainant_phone, complainant_address,
         complaint_type, description, location, priority || 'medium', assigned_officer_id,
         req.user.id, language || 'en', offline_id, file_path, file_name]
      );
      console.log('✅ Complaint created:', result.rows[0].complaint_number);
      res.status(201).json(result.rows[0]);
    } catch (dbErr) {
      console.error('❌ Database insertion error:', dbErr.message);
      console.error('Data tried:', { complaint_number, complainant_name, description });
      res.status(500).json({ error: `Database error: ${dbErr.message}` });
    }
  } catch (err) {
    console.error('🚨 General Complaint error:', err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

// PUT /api/complaints/:id
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, priority, assigned_officer_id, description } = req.body;
    const result = await pool.query(
      `UPDATE complaints SET status=$1, priority=$2, assigned_officer_id=$3, description=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [status, priority, assigned_officer_id, description, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Complaint not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/complaints/sync (batch sync from offline device)
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { complaints } = req.body;
    const results = [];

    for (const c of complaints) {
      const complaint_number = generateComplaintNo();
      const result = await pool.query(
        `INSERT INTO complaints 
         (complaint_number, complainant_name, complainant_phone, complaint_type,
          description, location, priority, registered_by, language, offline_id, synced)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
         ON CONFLICT (complaint_number) DO NOTHING RETURNING *`,
        [complaint_number, c.complainant_name, c.complainant_phone, c.complaint_type,
         c.description, c.location, c.priority, req.user.id, c.language, c.offline_id]
      );
      if (result.rows[0]) results.push({ offline_id: c.offline_id, server_id: result.rows[0].id });
    }

    res.json({ synced: results.length, results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sync failed' });
  }
});

module.exports = router;
