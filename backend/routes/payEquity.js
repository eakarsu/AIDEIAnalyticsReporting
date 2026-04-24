const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pay_equity ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pay_equity WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { department, role_title, demographic_group, avg_salary, median_salary, salary_range_min, salary_range_max, pay_gap_percentage, sample_size, analysis_period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO pay_equity (department, role_title, demographic_group, avg_salary, median_salary, salary_range_min, salary_range_max, pay_gap_percentage, sample_size, analysis_period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [department, role_title, demographic_group, avg_salary, median_salary, salary_range_min, salary_range_max, pay_gap_percentage, sample_size, analysis_period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { department, role_title, demographic_group, avg_salary, median_salary, salary_range_min, salary_range_max, pay_gap_percentage, sample_size, analysis_period, notes } = req.body;
    const result = await pool.query(
      'UPDATE pay_equity SET department=$1, role_title=$2, demographic_group=$3, avg_salary=$4, median_salary=$5, salary_range_min=$6, salary_range_max=$7, pay_gap_percentage=$8, sample_size=$9, analysis_period=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [department, role_title, demographic_group, avg_salary, median_salary, salary_range_min, salary_range_max, pay_gap_percentage, sample_size, analysis_period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM pay_equity WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
