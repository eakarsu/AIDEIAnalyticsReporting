const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accessibility ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM accessibility WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { area, compliance_type, standard, score, status, accommodations_requested, accommodations_granted, avg_response_days, department, audit_date, next_review, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO accessibility (area, compliance_type, standard, score, status, accommodations_requested, accommodations_granted, avg_response_days, department, audit_date, next_review, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [area, compliance_type, standard, score, status, accommodations_requested, accommodations_granted, avg_response_days, department, audit_date, next_review, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { area, compliance_type, standard, score, status, accommodations_requested, accommodations_granted, avg_response_days, department, audit_date, next_review, notes } = req.body;
    const result = await pool.query(
      'UPDATE accessibility SET area=$1, compliance_type=$2, standard=$3, score=$4, status=$5, accommodations_requested=$6, accommodations_granted=$7, avg_response_days=$8, department=$9, audit_date=$10, next_review=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [area, compliance_type, standard, score, status, accommodations_requested, accommodations_granted, avg_response_days, department, audit_date, next_review, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM accessibility WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
