const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotion_bias ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM promotion_bias WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { department, level_from, level_to, demographic_group, eligible_employees, nominated, promoted, avg_time_to_promotion, promotion_rate, bias_indicator, period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO promotion_bias (department, level_from, level_to, demographic_group, eligible_employees, nominated, promoted, avg_time_to_promotion, promotion_rate, bias_indicator, period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [department, level_from, level_to, demographic_group, eligible_employees, nominated, promoted, avg_time_to_promotion, promotion_rate, bias_indicator, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { department, level_from, level_to, demographic_group, eligible_employees, nominated, promoted, avg_time_to_promotion, promotion_rate, bias_indicator, period, notes } = req.body;
    const result = await pool.query(
      'UPDATE promotion_bias SET department=$1, level_from=$2, level_to=$3, demographic_group=$4, eligible_employees=$5, nominated=$6, promoted=$7, avg_time_to_promotion=$8, promotion_rate=$9, bias_indicator=$10, period=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [department, level_from, level_to, demographic_group, eligible_employees, nominated, promoted, avg_time_to_promotion, promotion_rate, bias_indicator, period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM promotion_bias WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
