const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

const EXPORTABLE_TABLES = {
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

// Export data as CSV
router.get('/:module', authenticateToken, async (req, res) => {
  const tableName = EXPORTABLE_TABLES[req.params.module];
  if (!tableName) return res.status(400).json({ error: 'Invalid module name' });

  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    const headers = Object.keys(rows[0]);
    const csvRows = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvRows.push(values.join(','));
    }

    const csv = csvRows.join('\n');
    const filename = `${req.params.module}_export_${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export as JSON
router.get('/:module/json', authenticateToken, async (req, res) => {
  const tableName = EXPORTABLE_TABLES[req.params.module];
  if (!tableName) return res.status(400).json({ error: 'Invalid module name' });

  try {
    const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY id DESC`);
    const filename = `${req.params.module}_export_${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
