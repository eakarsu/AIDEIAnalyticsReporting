const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM training_programs ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM training_programs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { program_name, training_type, department, total_enrolled, completed, completion_rate, avg_score, demographic_group, delivery_method, duration_hours, period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO training_programs (program_name, training_type, department, total_enrolled, completed, completion_rate, avg_score, demographic_group, delivery_method, duration_hours, period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [program_name, training_type, department, total_enrolled, completed, completion_rate, avg_score, demographic_group, delivery_method, duration_hours, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { program_name, training_type, department, total_enrolled, completed, completion_rate, avg_score, demographic_group, delivery_method, duration_hours, period, notes } = req.body;
    const result = await pool.query(
      'UPDATE training_programs SET program_name=$1, training_type=$2, department=$3, total_enrolled=$4, completed=$5, completion_rate=$6, avg_score=$7, demographic_group=$8, delivery_method=$9, duration_hours=$10, period=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [program_name, training_type, department, total_enrolled, completed, completion_rate, avg_score, demographic_group, delivery_method, duration_hours, period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM training_programs WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
