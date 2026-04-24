const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { report_name, regulation, status, compliance_score, due_date, submitted_date, findings, recommendations, assigned_to, priority, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO compliance_reports (report_name, regulation, status, compliance_score, due_date, submitted_date, findings, recommendations, assigned_to, priority, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [report_name, regulation, status, compliance_score, due_date, submitted_date, findings, recommendations, assigned_to, priority, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { report_name, regulation, status, compliance_score, due_date, submitted_date, findings, recommendations, assigned_to, priority, notes } = req.body;
    const result = await pool.query(
      'UPDATE compliance_reports SET report_name=$1, regulation=$2, status=$3, compliance_score=$4, due_date=$5, submitted_date=$6, findings=$7, recommendations=$8, assigned_to=$9, priority=$10, notes=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [report_name, regulation, status, compliance_score, due_date, submitted_date, findings, recommendations, assigned_to, priority, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
