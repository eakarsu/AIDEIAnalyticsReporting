const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM pay_equity ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) as total FROM pay_equity')
    ]);
    const total = parseInt(countResult.rows[0].total);
    res.json({ data: dataResult.rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
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
    if (!department || !role_title || !demographic_group) {
      return res.status(400).json({ error: 'department, role_title, and demographic_group are required' });
    }
    if (avg_salary !== undefined && avg_salary !== null && isNaN(parseFloat(avg_salary))) {
      return res.status(400).json({ error: 'avg_salary must be a number' });
    }
    if (pay_gap_percentage !== undefined && pay_gap_percentage !== null && isNaN(parseFloat(pay_gap_percentage))) {
      return res.status(400).json({ error: 'pay_gap_percentage must be a number' });
    }
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
    if (!department && !role_title && !demographic_group && avg_salary === undefined) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }
    if (avg_salary !== undefined && avg_salary !== null && isNaN(parseFloat(avg_salary))) {
      return res.status(400).json({ error: 'avg_salary must be a number' });
    }
    if (pay_gap_percentage !== undefined && pay_gap_percentage !== null && isNaN(parseFloat(pay_gap_percentage))) {
      return res.status(400).json({ error: 'pay_gap_percentage must be a number' });
    }
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
