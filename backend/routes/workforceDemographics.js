const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workforce_demographics ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workforce_demographics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { department, job_level, demographic_type, demographic_value, headcount, percentage, avg_tenure, avg_age, avg_salary, period, year, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO workforce_demographics (department, job_level, demographic_type, demographic_value, headcount, percentage, avg_tenure, avg_age, avg_salary, period, year, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [department, job_level, demographic_type, demographic_value, headcount, percentage, avg_tenure, avg_age, avg_salary, period, year, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { department, job_level, demographic_type, demographic_value, headcount, percentage, avg_tenure, avg_age, avg_salary, period, year, notes } = req.body;
    const result = await pool.query(
      'UPDATE workforce_demographics SET department=$1, job_level=$2, demographic_type=$3, demographic_value=$4, headcount=$5, percentage=$6, avg_tenure=$7, avg_age=$8, avg_salary=$9, period=$10, year=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [department, job_level, demographic_type, demographic_value, headcount, percentage, avg_tenure, avg_age, avg_salary, period, year, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM workforce_demographics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
