const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incident_reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incident_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { incident_type, department, severity, status, reported_date, resolved_date, category, description, action_taken, reporter_demographic, investigation_outcome, days_to_resolve, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO incident_reports (incident_type, department, severity, status, reported_date, resolved_date, category, description, action_taken, reporter_demographic, investigation_outcome, days_to_resolve, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [incident_type, department, severity, status, reported_date, resolved_date, category, description, action_taken, reporter_demographic, investigation_outcome, days_to_resolve, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { incident_type, department, severity, status, reported_date, resolved_date, category, description, action_taken, reporter_demographic, investigation_outcome, days_to_resolve, notes } = req.body;
    const result = await pool.query(
      'UPDATE incident_reports SET incident_type=$1, department=$2, severity=$3, status=$4, reported_date=$5, resolved_date=$6, category=$7, description=$8, action_taken=$9, reporter_demographic=$10, investigation_outcome=$11, days_to_resolve=$12, notes=$13, updated_at=NOW() WHERE id=$14 RETURNING *',
      [incident_type, department, severity, status, reported_date, resolved_date, category, description, action_taken, reporter_demographic, investigation_outcome, days_to_resolve, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM incident_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
