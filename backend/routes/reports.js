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

// Get saved reports
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saved_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate a report (without saving)
router.post('/generate', authenticateToken, async (req, res) => {
  try {
    const { title, modules, include_summary } = req.body;
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'At least one module is required' });
    }

    const reportData = {};
    const summary = {};

    for (const mod of modules) {
      const table = MODULE_TABLES[mod];
      if (!table) continue;

      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
      reportData[mod] = result.rows;

      if (include_summary) {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        summary[mod] = {
          totalRecords: parseInt(countResult.rows[0].count),
          lastUpdated: result.rows.length > 0 ? result.rows[0].updated_at || result.rows[0].created_at : null
        };

        // Module-specific stats
        if (mod === 'pay-equity' && result.rows.length > 0) {
          const gaps = result.rows.map(r => parseFloat(r.pay_gap_percentage) || 0);
          summary[mod].avgPayGap = (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2);
          summary[mod].maxPayGap = Math.max(...gaps).toFixed(2);
        } else if (mod === 'retention-analysis' && result.rows.length > 0) {
          const rates = result.rows.map(r => parseFloat(r.turnover_rate) || 0);
          summary[mod].avgTurnover = (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2);
        } else if (mod === 'incident-reports' && result.rows.length > 0) {
          const open = result.rows.filter(r => r.status !== 'resolved' && r.status !== 'closed').length;
          summary[mod].openIncidents = open;
        } else if (mod === 'training-programs' && result.rows.length > 0) {
          const rates = result.rows.map(r => parseFloat(r.completion_rate) || 0);
          summary[mod].avgCompletionRate = (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(2);
        }
      }
    }

    res.json({
      title: title || 'DEI Report',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name || req.user.email,
      modules: modules,
      summary: include_summary ? summary : undefined,
      data: reportData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save a report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, modules, report_data } = req.body;
    const result = await pool.query(
      `INSERT INTO saved_reports (title, description, modules, report_data, created_by, created_by_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, JSON.stringify(modules), JSON.stringify(report_data), req.user.id, req.user.name || req.user.email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single report
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM saved_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete report
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM saved_reports WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    res.json({ message: 'Report deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard summary stats across all modules
router.get('/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const stats = {};

    for (const [mod, table] of Object.entries(MODULE_TABLES)) {
      try {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        stats[mod] = { count: parseInt(countResult.rows[0].count) };
      } catch (e) {
        stats[mod] = { count: 0 };
      }
    }

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
