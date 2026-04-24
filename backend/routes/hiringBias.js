const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hiring_bias ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hiring_bias WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { job_title, department, total_applicants, demographic_group, applicants_in_group, interviewed, offered, hired, pass_through_rate, bias_score, period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO hiring_bias (job_title, department, total_applicants, demographic_group, applicants_in_group, interviewed, offered, hired, pass_through_rate, bias_score, period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [job_title, department, total_applicants, demographic_group, applicants_in_group, interviewed, offered, hired, pass_through_rate, bias_score, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { job_title, department, total_applicants, demographic_group, applicants_in_group, interviewed, offered, hired, pass_through_rate, bias_score, period, notes } = req.body;
    const result = await pool.query(
      'UPDATE hiring_bias SET job_title=$1, department=$2, total_applicants=$3, demographic_group=$4, applicants_in_group=$5, interviewed=$6, offered=$7, hired=$8, pass_through_rate=$9, bias_score=$10, period=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [job_title, department, total_applicants, demographic_group, applicants_in_group, interviewed, offered, hired, pass_through_rate, bias_score, period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM hiring_bias WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
