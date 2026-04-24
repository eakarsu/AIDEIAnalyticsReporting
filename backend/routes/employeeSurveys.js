const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employee_surveys ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employee_surveys WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { survey_name, department, demographic_group, category, score, response_rate, total_respondents, sentiment, key_themes, period, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO employee_surveys (survey_name, department, demographic_group, category, score, response_rate, total_respondents, sentiment, key_themes, period, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [survey_name, department, demographic_group, category, score, response_rate, total_respondents, sentiment, key_themes, period, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { survey_name, department, demographic_group, category, score, response_rate, total_respondents, sentiment, key_themes, period, notes } = req.body;
    const result = await pool.query(
      'UPDATE employee_surveys SET survey_name=$1, department=$2, demographic_group=$3, category=$4, score=$5, response_rate=$6, total_respondents=$7, sentiment=$8, key_themes=$9, period=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [survey_name, department, demographic_group, category, score, response_rate, total_respondents, sentiment, key_themes, period, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM employee_surveys WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
