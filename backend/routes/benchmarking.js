const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM benchmarking ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM benchmarking WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { metric_name, category, our_value, industry_avg, top_performer, percentile_rank, industry, source, measurement_date, trend, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO benchmarking (metric_name, category, our_value, industry_avg, top_performer, percentile_rank, industry, source, measurement_date, trend, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [metric_name, category, our_value, industry_avg, top_performer, percentile_rank, industry, source, measurement_date, trend, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { metric_name, category, our_value, industry_avg, top_performer, percentile_rank, industry, source, measurement_date, trend, notes } = req.body;
    const result = await pool.query(
      'UPDATE benchmarking SET metric_name=$1, category=$2, our_value=$3, industry_avg=$4, top_performer=$5, percentile_rank=$6, industry=$7, source=$8, measurement_date=$9, trend=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [metric_name, category, our_value, industry_avg, top_performer, percentile_rank, industry, source, measurement_date, trend, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM benchmarking WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
