const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplier_diversity ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get one
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM supplier_diversity WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { supplier_name, certification_type, category, annual_spend, contract_value, tier, status, region, performance_rating, contract_start, contract_end, notes } = req.body;
    const result = await pool.query(
      'INSERT INTO supplier_diversity (supplier_name, certification_type, category, annual_spend, contract_value, tier, status, region, performance_rating, contract_start, contract_end, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [supplier_name, certification_type, category, annual_spend, contract_value, tier, status, region, performance_rating, contract_start, contract_end, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { supplier_name, certification_type, category, annual_spend, contract_value, tier, status, region, performance_rating, contract_start, contract_end, notes } = req.body;
    const result = await pool.query(
      'UPDATE supplier_diversity SET supplier_name=$1, certification_type=$2, category=$3, annual_spend=$4, contract_value=$5, tier=$6, status=$7, region=$8, performance_rating=$9, contract_start=$10, contract_end=$11, notes=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [supplier_name, certification_type, category, annual_spend, contract_value, tier, status, region, performance_rating, contract_start, contract_end, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM supplier_diversity WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
