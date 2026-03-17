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
    cb(null, `evidence_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit

const generateEvidenceNo = () => `EVD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// GET /api/evidence
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { case_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';

    if (case_id) { params.push(case_id); where += ` AND e.case_id = $${params.length}`; }

    params.push(limit, offset);
    const result = await pool.query(
      `SELECT e.*, u.full_name as collected_by_name, c.case_number
       FROM evidence e
       LEFT JOIN users u ON e.collected_by = u.id
       LEFT JOIN cases c ON e.case_id = c.id
       ${where} ORDER BY e.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ evidence: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/evidence (with file upload)
router.post('/', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { case_id, title, description, evidence_type, collection_date, offline_id } = req.body;
    const evidence_number = generateEvidenceNo();
    const file_path = req.file ? `/uploads/${req.file.filename}` : null;
    const file_name = req.file ? req.file.originalname : null;

    const result = await pool.query(
      `INSERT INTO evidence (case_id, evidence_number, title, description, evidence_type,
        file_path, file_name, collected_by, collection_date, offline_id, synced)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true) RETURNING *`,
      [case_id, evidence_number, title, description, evidence_type,
       file_path, file_name, req.user.id, collection_date || new Date(), offline_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/evidence/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const evidence = await pool.query('SELECT * FROM evidence WHERE id = $1', [req.params.id]);
    if (evidence.rows[0]?.file_path) {
      const filePath = path.join(__dirname, '../../', evidence.rows[0].file_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM evidence WHERE id = $1', [req.params.id]);
    res.json({ message: 'Evidence deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
