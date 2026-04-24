const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Global search across all modules
router.get('/', authenticateToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }

  const searchTerm = `%${q.trim().toLowerCase()}%`;

  try {
    const queries = [
      {
        module: 'Diversity Metrics',
        path: '/diversity-metrics',
        sql: `SELECT id, department, metric_type AS title, category AS subtitle, CONCAT(value, '% - ', period, ' ', year) AS detail FROM diversity_metrics WHERE LOWER(department) LIKE $1 OR LOWER(metric_type) LIKE $1 OR LOWER(category) LIKE $1 OR LOWER(COALESCE(notes,'')) LIKE $1 LIMIT 10`
      },
      {
        module: 'Pay Equity',
        path: '/pay-equity',
        sql: `SELECT id, department, role_title AS title, demographic_group AS subtitle, CONCAT('Gap: ', pay_gap_percentage, '%') AS detail FROM pay_equity WHERE LOWER(department) LIKE $1 OR LOWER(role_title) LIKE $1 OR LOWER(demographic_group) LIKE $1 OR LOWER(COALESCE(notes,'')) LIKE $1 LIMIT 10`
      },
      {
        module: 'Hiring Bias',
        path: '/hiring-bias',
        sql: `SELECT id, department, job_title AS title, demographic_group AS subtitle, CONCAT('Bias: ', bias_score) AS detail FROM hiring_bias WHERE LOWER(department) LIKE $1 OR LOWER(job_title) LIKE $1 OR LOWER(demographic_group) LIKE $1 OR LOWER(COALESCE(notes,'')) LIKE $1 LIMIT 10`
      },
      {
        module: 'Promotion Bias',
        path: '/promotion-bias',
        sql: `SELECT id, department, CONCAT(level_from, ' → ', level_to) AS title, demographic_group AS subtitle, CONCAT('Rate: ', promotion_rate, '%') AS detail FROM promotion_bias WHERE LOWER(department) LIKE $1 OR LOWER(demographic_group) LIKE $1 OR LOWER(level_from) LIKE $1 OR LOWER(level_to) LIKE $1 LIMIT 10`
      },
      {
        module: 'Compliance Reports',
        path: '/compliance-reports',
        sql: `SELECT id, regulation AS department, report_name AS title, status AS subtitle, CONCAT('Score: ', compliance_score) AS detail FROM compliance_reports WHERE LOWER(report_name) LIKE $1 OR LOWER(regulation) LIKE $1 OR LOWER(status) LIKE $1 OR LOWER(COALESCE(notes,'')) LIKE $1 LIMIT 10`
      },
      {
        module: 'Employee Surveys',
        path: '/employee-surveys',
        sql: `SELECT id, department, survey_name AS title, demographic_group AS subtitle, CONCAT('Score: ', score) AS detail FROM employee_surveys WHERE LOWER(department) LIKE $1 OR LOWER(survey_name) LIKE $1 OR LOWER(demographic_group) LIKE $1 LIMIT 10`
      },
      {
        module: 'Training Programs',
        path: '/training-programs',
        sql: `SELECT id, department, program_name AS title, training_type AS subtitle, CONCAT('Rate: ', completion_rate, '%') AS detail FROM training_programs WHERE LOWER(department) LIKE $1 OR LOWER(program_name) LIKE $1 OR LOWER(training_type) LIKE $1 LIMIT 10`
      },
      {
        module: 'Retention Analysis',
        path: '/retention-analysis',
        sql: `SELECT id, department, demographic_group AS title, risk_level AS subtitle, CONCAT('Turnover: ', turnover_rate, '%') AS detail FROM retention_analysis WHERE LOWER(department) LIKE $1 OR LOWER(demographic_group) LIKE $1 OR LOWER(COALESCE(risk_level,'')) LIKE $1 LIMIT 10`
      },
      {
        module: 'Incident Reports',
        path: '/incident-reports',
        sql: `SELECT id, department, incident_type AS title, severity AS subtitle, status AS detail FROM incident_reports WHERE LOWER(department) LIKE $1 OR LOWER(incident_type) LIKE $1 OR LOWER(severity) LIKE $1 OR LOWER(COALESCE(description,'')) LIKE $1 LIMIT 10`
      },
      {
        module: 'ERG Management',
        path: '/erg-management',
        sql: `SELECT id, focus_area AS department, erg_name AS title, status AS subtitle, CONCAT('Members: ', membership_count) AS detail FROM erg_management WHERE LOWER(erg_name) LIKE $1 OR LOWER(focus_area) LIKE $1 OR LOWER(COALESCE(executive_sponsor,'')) LIKE $1 LIMIT 10`
      }
    ];

    const results = [];
    for (const q of queries) {
      try {
        const result = await pool.query(q.sql, [searchTerm]);
        for (const row of result.rows) {
          results.push({
            module: q.module,
            path: q.path,
            id: row.id,
            department: row.department,
            title: row.title,
            subtitle: row.subtitle,
            detail: row.detail
          });
        }
      } catch (e) {
        // Skip modules with query errors
      }
    }

    res.json({ query: req.query.q, total: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
