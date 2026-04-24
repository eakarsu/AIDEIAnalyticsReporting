const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const MODULE_TABLES = {
  'diversity-metrics': 'diversity_metrics',
  'pay-equity': 'pay_equity',
  'hiring-bias': 'hiring_bias',
  'promotion-bias': 'promotion_bias',
  'compliance-reports': 'compliance_reports',
  'benchmarking': 'benchmarking',
  'employee-surveys': 'employee_surveys',
  'training-programs': 'training_programs',
  'retention-analysis': 'retention_analysis',
  'leadership-pipeline': 'leadership_pipeline',
  'supplier-diversity': 'supplier_diversity',
  'erg-management': 'erg_management',
  'incident-reports': 'incident_reports',
  'accessibility': 'accessibility',
  'workforce-demographics': 'workforce_demographics'
};

// Get column info for a module
router.get('/columns/:module', authenticateToken, async (req, res) => {
  const table = MODULE_TABLES[req.params.module];
  if (!table) return res.status(400).json({ error: 'Invalid module' });

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
      ORDER BY ordinal_position
    `, [table]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import CSV data
router.post('/:module', authenticateToken, async (req, res) => {
  const table = MODULE_TABLES[req.params.module];
  if (!table) return res.status(400).json({ error: 'Invalid module' });

  try {
    const { csvData } = req.body;
    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({ error: 'No data provided' });
    }

    // Get valid columns for the table
    const colResult = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name NOT IN ('id', 'created_at', 'updated_at')
    `, [table]);
    const validColumns = colResult.rows.map(r => r.column_name);

    let imported = 0;
    let errors = [];

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const columns = [];
      const values = [];
      const placeholders = [];
      let paramIdx = 1;

      for (const [key, val] of Object.entries(row)) {
        const colName = key.toLowerCase().replace(/\s+/g, '_');
        if (validColumns.includes(colName) && val !== '' && val !== null) {
          columns.push(colName);
          values.push(val);
          placeholders.push(`$${paramIdx++}`);
        }
      }

      if (columns.length === 0) {
        errors.push({ row: i + 1, error: 'No valid columns found' });
        continue;
      }

      try {
        await pool.query(
          `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders.join(',')})`,
          values
        );
        imported++;
      } catch (e) {
        errors.push({ row: i + 1, error: e.message });
      }
    }

    res.json({
      total: csvData.length,
      imported,
      failed: errors.length,
      errors: errors.slice(0, 20) // Limit error details
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
