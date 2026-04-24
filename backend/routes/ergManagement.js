const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM erg_management ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM erg_management WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { erg_name, focus_area, membership_count, active_members, executive_sponsor, budget, events_held, engagement_score, year_founded, status, impact_summary, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO erg_management (erg_name, focus_area, membership_count, active_members, executive_sponsor, budget, events_held, engagement_score, year_founded, status, impact_summary, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [erg_name, focus_area, membership_count, active_members, executive_sponsor, budget, events_held, engagement_score, year_founded, status, impact_summary, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { erg_name, focus_area, membership_count, active_members, executive_sponsor, budget, events_held, engagement_score, year_founded, status, impact_summary, notes } = req.body;
    const result = await pool.query(
      'UPDATE erg_management SET erg_name=$1, focus_area=$2, membership_count=$3, active_members=$4, executive_sponsor=$5, budget=$6, events_held=$7, engagement_score=$8, year_founded=$9, status=$10, impact_summary=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [erg_name, focus_area, membership_count, active_members, executive_sponsor, budget, events_held, engagement_score, year_founded, status, impact_summary, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM erg_management WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
