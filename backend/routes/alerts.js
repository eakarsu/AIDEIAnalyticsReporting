const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all alerts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, severity } = req.query;
    let sql = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    let idx = 1;

    if (status) { sql += ` AND status = $${idx++}`; params.push(status); }
    if (severity) { sql += ` AND severity = $${idx++}`; params.push(severity); }

    sql += ' ORDER BY created_at DESC';
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alert stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM alerts');
    const active = await pool.query("SELECT COUNT(*) FROM alerts WHERE status = 'active'");
    const critical = await pool.query("SELECT COUNT(*) FROM alerts WHERE severity = 'critical' AND status = 'active'");
    const bySeverity = await pool.query('SELECT severity, COUNT(*) as count FROM alerts GROUP BY severity ORDER BY count DESC');

    res.json({
      total: parseInt(total.rows[0].count),
      active: parseInt(active.rows[0].count),
      critical: parseInt(critical.rows[0].count),
      bySeverity: bySeverity.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create alert rule
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, module, metric_field, condition, threshold, severity, notify_email } = req.body;
    const result = await pool.query(
      `INSERT INTO alerts (title, description, module, metric_field, condition, threshold, severity, notify_email, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9) RETURNING *`,
      [title, description, module, metric_field, condition, threshold, severity || 'medium', notify_email, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update alert
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, module, metric_field, condition, threshold, severity, notify_email, status } = req.body;
    const result = await pool.query(
      `UPDATE alerts SET title=$1, description=$2, module=$3, metric_field=$4, condition=$5, threshold=$6,
       severity=$7, notify_email=$8, status=$9, updated_at=NOW() WHERE id=$10 RETURNING *`,
      [title, description, module, metric_field, condition, threshold, severity, notify_email, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete alert
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM alerts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Alert deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check alerts (evaluate all active alerts against current data)
router.post('/check', authenticateToken, async (req, res) => {
  try {
    const activeAlerts = await pool.query("SELECT * FROM alerts WHERE status = 'active'");
    const triggered = [];

    for (const alert of activeAlerts.rows) {
      try {
        const tableMap = {
          'diversity-metrics': 'diversity_metrics',
          'pay-equity': 'pay_equity',
          'hiring-bias': 'hiring_bias',
          'retention-analysis': 'retention_analysis',
          'incident-reports': 'incident_reports'
        };
        const table = tableMap[alert.module];
        if (!table || !alert.metric_field) continue;

        const dataResult = await pool.query(`SELECT AVG(${alert.metric_field}::numeric) as avg_val FROM ${table}`);
        const avgVal = parseFloat(dataResult.rows[0].avg_val) || 0;
        const threshold = parseFloat(alert.threshold) || 0;

        let isTriggered = false;
        switch (alert.condition) {
          case 'greater_than': isTriggered = avgVal > threshold; break;
          case 'less_than': isTriggered = avgVal < threshold; break;
          case 'equals': isTriggered = Math.abs(avgVal - threshold) < 0.01; break;
          case 'not_equals': isTriggered = Math.abs(avgVal - threshold) >= 0.01; break;
        }

        if (isTriggered) {
          triggered.push({
            alert_id: alert.id,
            title: alert.title,
            severity: alert.severity,
            current_value: avgVal,
            threshold: threshold,
            condition: alert.condition
          });

          await pool.query(
            `INSERT INTO alert_history (alert_id, triggered_value, message)
             VALUES ($1, $2, $3)`,
            [alert.id, avgVal, `Alert triggered: ${alert.title} - Current: ${avgVal}, Threshold: ${threshold}`]
          );
        }
      } catch (e) {
        // Skip individual alert errors
      }
    }

    res.json({ checked: activeAlerts.rows.length, triggered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get alert history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ah.*, a.title as alert_title, a.severity, a.module
       FROM alert_history ah
       JOIN alerts a ON ah.alert_id = a.id
       ORDER BY ah.triggered_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
