const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM diversity_metrics ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM diversity_metrics WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { department, metric_type, category, value, period, year, target_value, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO diversity_metrics (department, metric_type, category, value, period, year, target_value, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [department, metric_type, category, value, period, year, target_value, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { department, metric_type, category, value, period, year, target_value, notes } = req.body;
    const result = await pool.query(
      'UPDATE diversity_metrics SET department=$1, metric_type=$2, category=$3, value=$4, period=$5, year=$6, target_value=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [department, metric_type, category, value, period, year, target_value, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM diversity_metrics WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
