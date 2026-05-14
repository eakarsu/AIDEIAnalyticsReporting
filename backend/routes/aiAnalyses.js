const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Ensure ai_analyses table exists
const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_analyses (
      id SERIAL PRIMARY KEY,
      entity_type VARCHAR(100) NOT NULL,
      entity_id INTEGER,
      analysis_type VARCHAR(100) NOT NULL,
      findings_text TEXT,
      key_metrics JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      created_by INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_ai_analyses_entity ON ai_analyses(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);
  `);
};
ensureTable().catch(console.error);

// Persist an AI analysis (called internally from ai.js)
const persistAnalysis = async (entityType, entityId, analysisType, findingsText, keyMetrics, createdBy) => {
  try {
    await pool.query(
      `INSERT INTO ai_analyses (entity_type, entity_id, analysis_type, findings_text, key_metrics, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [entityType, entityId || null, analysisType, findingsText, keyMetrics ? JSON.stringify(keyMetrics) : null, createdBy || null]
    );
  } catch (err) {
    console.error('persistAnalysis error:', err.message);
  }
};

// GET /api/ai-analyses - list stored analyses with pagination, filter by entity_type
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { entity_type, analysis_type } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    let sql = 'SELECT * FROM ai_analyses WHERE 1=1';
    const params = [];
    let idx = 1;

    if (entity_type) { sql += ` AND entity_type = $${idx++}`; params.push(entity_type); }
    if (analysis_type) { sql += ` AND analysis_type = $${idx++}`; params.push(analysis_type); }

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
    sql += ` ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
    params.push(limit, offset);

    const countParams = params.slice(0, params.length - 2);
    const [dataResult, countResult] = await Promise.all([
      pool.query(sql, params),
      pool.query(countSql, countParams)
    ]);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-analyses/:entity_type/:entity_id - get history for a specific entity
router.get('/:entity_type/:entity_id', authenticateToken, async (req, res) => {
  try {
    const { entity_type, entity_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM ai_analyses WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC',
      [entity_type, parseInt(entity_id)]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
module.exports.persistAnalysis = persistAnalysis;
