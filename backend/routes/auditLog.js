const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all audit logs with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { action, module, user_id, from_date, to_date, limit = 100 } = req.query;
    let sql = 'SELECT * FROM audit_log WHERE 1=1';
    const params = [];
    let idx = 1;

    if (action) { sql += ` AND action = $${idx++}`; params.push(action); }
    if (module) { sql += ` AND module = $${idx++}`; params.push(module); }
    if (user_id) { sql += ` AND user_id = $${idx++}`; params.push(parseInt(user_id)); }
    if (from_date) { sql += ` AND created_at >= $${idx++}`; params.push(from_date); }
    if (to_date) { sql += ` AND created_at <= $${idx++}`; params.push(to_date); }

    sql += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(parseInt(limit));

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get audit log stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const total = await pool.query('SELECT COUNT(*) FROM audit_log');
    const today = await pool.query("SELECT COUNT(*) FROM audit_log WHERE created_at >= CURRENT_DATE");
    const byAction = await pool.query('SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC');
    const byModule = await pool.query('SELECT module, COUNT(*) as count FROM audit_log GROUP BY module ORDER BY count DESC LIMIT 10');
    const byUser = await pool.query(`
      SELECT al.user_name, COUNT(*) as count
      FROM audit_log al
      GROUP BY al.user_name
      ORDER BY count DESC LIMIT 10
    `);

    res.json({
      total: parseInt(total.rows[0].count),
      today: parseInt(today.rows[0].count),
      byAction: byAction.rows,
      byModule: byModule.rows,
      byUser: byUser.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// Helper to log actions (used by other routes)
module.exports.logAction = async (userId, userName, action, module, recordId, details) => {
  try {
    await pool.query(
      'INSERT INTO audit_log (user_id, user_name, action, module, record_id, details) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, userName, action, module, recordId, details]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};
