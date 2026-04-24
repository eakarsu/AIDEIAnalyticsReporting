const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM retention_analysis ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM retention_analysis WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { department, demographic_group, total_employees, departures, turnover_rate, voluntary_departures, involuntary_departures, avg_tenure, exit_reason, risk_level, period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO retention_analysis (department, demographic_group, total_employees, departures, turnover_rate, voluntary_departures, involuntary_departures, avg_tenure, exit_reason, risk_level, period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [department, demographic_group, total_employees, departures, turnover_rate, voluntary_departures, involuntary_departures, avg_tenure, exit_reason, risk_level, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { department, demographic_group, total_employees, departures, turnover_rate, voluntary_departures, involuntary_departures, avg_tenure, exit_reason, risk_level, period, notes } = req.body;
    const result = await pool.query(
      'UPDATE retention_analysis SET department=$1, demographic_group=$2, total_employees=$3, departures=$4, turnover_rate=$5, voluntary_departures=$6, involuntary_departures=$7, avg_tenure=$8, exit_reason=$9, risk_level=$10, period=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [department, demographic_group, total_employees, departures, turnover_rate, voluntary_departures, involuntary_departures, avg_tenure, exit_reason, risk_level, period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM retention_analysis WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
