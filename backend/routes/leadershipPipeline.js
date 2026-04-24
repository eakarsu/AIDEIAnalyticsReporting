const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leadership_pipeline ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM leadership_pipeline WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { level, department, demographic_group, total_positions, filled_positions, representation_pct, ready_now, ready_1_2_years, ready_3_5_years, succession_coverage, period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO leadership_pipeline (level, department, demographic_group, total_positions, filled_positions, representation_pct, ready_now, ready_1_2_years, ready_3_5_years, succession_coverage, period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [level, department, demographic_group, total_positions, filled_positions, representation_pct, ready_now, ready_1_2_years, ready_3_5_years, succession_coverage, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { level, department, demographic_group, total_positions, filled_positions, representation_pct, ready_now, ready_1_2_years, ready_3_5_years, succession_coverage, period, notes } = req.body;
    const result = await pool.query(
      'UPDATE leadership_pipeline SET level=$1, department=$2, demographic_group=$3, total_positions=$4, filled_positions=$5, representation_pct=$6, ready_now=$7, ready_1_2_years=$8, ready_3_5_years=$9, succession_coverage=$10, period=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [level, department, demographic_group, total_positions, filled_positions, representation_pct, ready_now, ready_1_2_years, ready_3_5_years, succession_coverage, period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM leadership_pipeline WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
