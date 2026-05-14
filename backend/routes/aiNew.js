const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { persistAnalysis } = require('./aiAnalyses');

const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

class NoApiKeyError extends Error {
  constructor() { super('OPENROUTER_API_KEY not configured'); this.code = 'NO_API_KEY'; }
}

const callOpenRouter = async (prompt, context) => {
  if (!process.env.OPENROUTER_API_KEY) throw new NoApiKeyError();
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'DEI Analytics Platform'
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert DEI (Diversity, Equity, and Inclusion) analyst. Provide professional, data-driven insights and recommendations. Format your responses with clear sections using markdown headers (##), bullet points, and bold text for emphasis. Be specific, actionable, and evidence-based.'
        },
        {
          role: 'user',
          content: `${prompt}\n\nContext data:\n${JSON.stringify(context, null, 2)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter API error');
  return data.choices[0].message.content;
};

const aiErrorHandler = (err, res) => {
  if (err && err.code === 'NO_API_KEY') {
    return res.status(503).json({ error: 'AI service unavailable: OPENROUTER_API_KEY not configured' });
  }
  return res.status(500).json({ error: err.message });
};

// POST /api/ai/threshold-check
// Checks if a metric breaches threshold, creates alert record if yes, returns alert status
router.post('/threshold-check', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { metric_type, current_value, threshold } = req.body;
    if (!metric_type || current_value === undefined || threshold === undefined) {
      return res.status(400).json({ error: 'metric_type, current_value, and threshold are required' });
    }
    const numericValue = parseFloat(current_value);
    const numericThreshold = parseFloat(threshold);
    if (isNaN(numericValue) || isNaN(numericThreshold)) {
      return res.status(400).json({ error: 'current_value and threshold must be numeric' });
    }

    const breached = numericValue > numericThreshold;
    let alertRecord = null;

    if (breached) {
      const severity = numericValue >= numericThreshold * 1.5 ? 'critical' : numericValue >= numericThreshold * 1.2 ? 'high' : 'medium';
      const title = `Threshold breach: ${metric_type}`;
      const description = `${metric_type} value of ${numericValue} exceeds threshold of ${numericThreshold} (${((numericValue / numericThreshold - 1) * 100).toFixed(1)}% above threshold)`;

      const alertResult = await pool.query(
        `INSERT INTO alerts (title, description, module, metric_field, condition, threshold, severity, status, created_by)
         VALUES ($1, $2, $3, $4, 'above', $5, $6, 'active', $7) RETURNING *`,
        [title, description, 'threshold-check', metric_type, numericThreshold, severity, req.user.id]
      );
      alertRecord = alertResult.rows[0];

      // Log to alert_history
      await pool.query(
        'INSERT INTO alert_history (alert_id, triggered_value, message) VALUES ($1, $2, $3)',
        [alertRecord.id, numericValue, description]
      );
    }

    const analysis = await callOpenRouter(
      `A DEI metric "${metric_type}" currently has a value of ${numericValue}. The threshold is ${numericThreshold}. ${breached ? 'The threshold has been BREACHED.' : 'The threshold has NOT been breached.'}
      Provide a brief analysis of the severity and recommended immediate actions if breached, or monitoring advice if not. Keep it concise (2-3 paragraphs).`,
      { metric_type, current_value: numericValue, threshold: numericThreshold, breached }
    );

    res.json({
      metric_type,
      current_value: numericValue,
      threshold: numericThreshold,
      breached,
      alert_created: !!alertRecord,
      alert: alertRecord,
      analysis
    });

    if (breached) {
      persistAnalysis('alerts', alertRecord?.id, 'threshold-check', analysis,
        { metric_type, current_value: numericValue, threshold: numericThreshold, breached }, req.user?.id).catch(console.error);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/executive-report
// Fetches latest data from all requested DEI modules, generates executive summary
router.post('/executive-report', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { date_range, modules } = req.body;
    if (!modules || !Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'modules array is required (e.g. ["diversity", "pay_equity", "hiring"])' });
    }

    const moduleQueryMap = {
      diversity: 'SELECT department, metric_type, value, target_value, period FROM diversity_metrics ORDER BY department LIMIT 30',
      pay_equity: 'SELECT department, role_title, demographic_group, pay_gap_percentage, analysis_period FROM pay_equity ORDER BY ABS(pay_gap_percentage) DESC LIMIT 30',
      hiring: 'SELECT department, job_title, demographic_group, pass_through_rate, bias_score FROM hiring_bias ORDER BY bias_score DESC LIMIT 30',
      promotion: 'SELECT department, demographic_group, promotion_rate, avg_time_to_promotion, bias_indicator FROM promotion_bias ORDER BY department LIMIT 30',
      retention: 'SELECT department, demographic_group, turnover_rate, avg_tenure, risk_level FROM retention_analysis ORDER BY turnover_rate DESC LIMIT 20',
      leadership: 'SELECT level, department, demographic_group, representation_pct, succession_coverage FROM leadership_pipeline ORDER BY level, department LIMIT 30',
      compliance: 'SELECT report_name, regulation, status, compliance_score, due_date FROM compliance_reports ORDER BY due_date LIMIT 20',
      benchmarking: 'SELECT category, metric_name, our_value, industry_avg, top_performer_value FROM benchmarking ORDER BY category LIMIT 30',
      surveys: 'SELECT department, category, demographic_group, score FROM employee_surveys ORDER BY score ASC LIMIT 20',
      incidents: 'SELECT incident_type, department, severity, status, days_to_resolve FROM incident_reports ORDER BY severity DESC, reported_date DESC LIMIT 20',
    };

    const moduleData = {};
    for (const mod of modules) {
      const query = moduleQueryMap[mod];
      if (query) {
        try {
          const result = await pool.query(query);
          moduleData[mod] = result.rows;
        } catch (_) {
          moduleData[mod] = [];
        }
      }
    }

    const dateRangeStr = date_range ? `Date range: ${JSON.stringify(date_range)}` : 'Most recent data';

    const executiveSummary = await callOpenRouter(
      `Generate a comprehensive DEI Executive Report for the following modules: ${modules.join(', ')}.
${dateRangeStr}

Structure your report with:
## Executive Summary (3-4 sentences on overall DEI health)
## Key Metrics by Module (one section per module with top 3 findings)
## Critical Issues Requiring Immediate Action
## Progress Highlights
## Strategic Recommendations (top 5 prioritized)
## 90-Day Action Plan

Be specific, data-driven, and focus on business impact.`,
      moduleData
    );

    const report = {
      report_type: 'executive_summary',
      generated_at: new Date().toISOString(),
      modules_included: modules,
      date_range: date_range || 'latest',
      narrative: executiveSummary,
      module_data_points: Object.fromEntries(
        Object.entries(moduleData).map(([k, v]) => [k, v.length])
      ),
    };

    res.json(report);
    persistAnalysis('executive_report', null, 'executive-report', executiveSummary,
      { modules, date_range }, req.user?.id).catch(console.error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/attrition-predictor
// Fetches retention + survey + promotion data for department, returns attrition risk score and recommendations
router.post('/attrition-predictor', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { department, time_horizon_months } = req.body;
    if (!department) return res.status(400).json({ error: 'department is required' });
    const horizon = parseInt(time_horizon_months) || 12;
    if (horizon < 1 || horizon > 60) return res.status(400).json({ error: 'time_horizon_months must be between 1 and 60' });

    const [retentionResult, surveyResult, promotionResult] = await Promise.all([
      pool.query('SELECT * FROM retention_analysis WHERE department ILIKE $1 ORDER BY period DESC LIMIT 20', [`%${department}%`]),
      pool.query('SELECT * FROM employee_surveys WHERE department ILIKE $1 ORDER BY id DESC LIMIT 20', [`%${department}%`]),
      pool.query('SELECT * FROM promotion_bias WHERE department ILIKE $1 ORDER BY period DESC LIMIT 20', [`%${department}%`]),
    ]);

    const retentionData = retentionResult.rows;
    const surveyData = surveyResult.rows;
    const promotionData = promotionResult.rows;

    if (retentionData.length === 0 && surveyData.length === 0 && promotionData.length === 0) {
      return res.status(404).json({ error: `No data found for department: ${department}` });
    }

    const analysis = await callOpenRouter(
      `Analyze attrition risk for the "${department}" department over the next ${horizon} months.

Based on the retention, survey sentiment, and promotion bias data provided, generate a structured attrition risk report with:
## Attrition Risk Score (0-100, where 100 = highest risk)
## At-Risk Segments (list specific demographic groups or roles most at risk)
## Key Risk Drivers (top 3-5 factors contributing to attrition risk)
## Early Warning Indicators (specific signals to monitor)
## Retention Recommendations (5 specific, actionable recommendations)
## Timeline (when risk is likely to materialize if unaddressed)

Be specific about which demographic groups are most at risk and why.`,
      {
        department,
        time_horizon_months: horizon,
        retention: retentionData,
        survey_sentiment: surveyData,
        promotion_bias: promotionData
      }
    );

    res.json({
      department,
      time_horizon_months: horizon,
      data_sources: {
        retention_records: retentionData.length,
        survey_records: surveyData.length,
        promotion_records: promotionData.length
      },
      analysis,
      generated_at: new Date().toISOString()
    });

    persistAnalysis('attrition_predictor', null, 'attrition-predictor', analysis,
      { department, time_horizon_months: horizon }, req.user?.id).catch(console.error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/compliance-calendar
// Returns upcoming DEI compliance deadlines with current readiness assessment
router.post('/compliance-calendar', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { jurisdiction } = req.body;
    if (!jurisdiction) return res.status(400).json({ error: 'jurisdiction is required (e.g. "US", "UK", "EU", "California")' });

    const [complianceResult, diversityResult, payEquityResult] = await Promise.all([
      pool.query('SELECT * FROM compliance_reports ORDER BY due_date ASC LIMIT 30'),
      pool.query('SELECT department, metric_type, value, target_value FROM diversity_metrics ORDER BY department LIMIT 20'),
      pool.query('SELECT department, demographic_group, pay_gap_percentage FROM pay_equity ORDER BY ABS(pay_gap_percentage) DESC LIMIT 20'),
    ]);

    const analysis = await callOpenRouter(
      `You are a DEI compliance expert for jurisdiction: "${jurisdiction}".

Generate a DEI Compliance Calendar that includes:

## Upcoming Compliance Deadlines
List the key DEI compliance requirements and reporting deadlines for ${jurisdiction} jurisdiction, including:
- EEO-1 (if US)
- UK Gender Pay Gap Reporting (if UK/EU)
- Pay Transparency Laws
- Accessibility Reports (ADA/WCAG if US, etc.)
- Any other jurisdiction-specific DEI mandates
Include specific dates where known, or typical annual windows.

## Current Readiness Assessment
Based on the stored compliance data, assess readiness for each requirement.

## Gap Analysis
Identify specific areas where current data suggests compliance risk.

## Action Items by Quarter
List specific actions needed in Q1, Q2, Q3, Q4 to maintain compliance.

## Risk Rating
Rate overall compliance risk as LOW/MEDIUM/HIGH/CRITICAL with justification.`,
      {
        jurisdiction,
        existing_compliance_reports: complianceResult.rows,
        diversity_snapshot: diversityResult.rows,
        pay_equity_snapshot: payEquityResult.rows,
        current_date: new Date().toISOString().split('T')[0]
      }
    );

    res.json({
      jurisdiction,
      compliance_calendar: analysis,
      data_sources: {
        compliance_reports: complianceResult.rows.length,
        diversity_metrics: diversityResult.rows.length,
        pay_equity_records: payEquityResult.rows.length
      },
      generated_at: new Date().toISOString()
    });

    persistAnalysis('compliance_calendar', null, 'compliance-calendar', analysis,
      { jurisdiction }, req.user?.id).catch(console.error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/intersectionality-analysis
// Combine 2+ demographic dimensions and analyze inequities across the cells.
router.post('/intersectionality-analysis', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { dimensions, focus_metric } = req.body;
    if (!Array.isArray(dimensions) || dimensions.length < 2) {
      return res.status(400).json({ error: 'dimensions must be an array of at least 2 demographic categories (e.g. ["gender","race"])' });
    }
    const metric = focus_metric || 'pay_gap_percentage';

    const [diversityResult, payEquityResult, hiringResult, retentionResult] = await Promise.all([
      pool.query('SELECT department, metric_type, value, target_value FROM diversity_metrics ORDER BY department LIMIT 60'),
      pool.query('SELECT department, role_title, demographic_group, pay_gap_percentage FROM pay_equity ORDER BY ABS(pay_gap_percentage) DESC LIMIT 60'),
      pool.query('SELECT department, job_title, demographic_group, pass_through_rate, bias_score FROM hiring_bias ORDER BY bias_score DESC LIMIT 40'),
      pool.query('SELECT department, demographic_group, turnover_rate, risk_level FROM retention_analysis ORDER BY turnover_rate DESC LIMIT 40'),
    ]).catch(() => [{ rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }]);

    const analysis = await callOpenRouter(
      `Perform an intersectionality analysis combining the following demographic dimensions: ${dimensions.join(' x ')}.
Focus metric: ${metric}.

Produce a structured report:
## Intersectional Cells Identified (list combinations e.g. Black women, Latino LGBTQ+, etc.)
## Inequity Scores per Cell (relative ranking)
## Most Disadvantaged Subgroups (top 3, with quantitative gaps where evidenced)
## Compounding Effects (how each dimension layers risk)
## Recommended Targeted Interventions (5 specific actions)
## Data Gaps (what additional disaggregated data is needed)`,
      {
        dimensions,
        focus_metric: metric,
        diversity: diversityResult.rows,
        pay_equity: payEquityResult.rows,
        hiring: hiringResult.rows,
        retention: retentionResult.rows
      }
    );

    res.json({
      dimensions,
      focus_metric: metric,
      analysis,
      generated_at: new Date().toISOString()
    });

    persistAnalysis('intersectionality', null, 'intersectionality-analysis', analysis,
      { dimensions, focus_metric: metric }, req.user?.id).catch(console.error);
  } catch (err) {
    return aiErrorHandler(err, res);
  }
});

// POST /api/ai/talent-pipeline-simulation
// Simulate impact of policy changes on representation over 1-3 years.
router.post('/talent-pipeline-simulation', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { policy_changes, time_horizon_years, target_groups } = req.body;
    if (!policy_changes || (Array.isArray(policy_changes) && policy_changes.length === 0)) {
      return res.status(400).json({ error: 'policy_changes is required (array of policy descriptions or single string)' });
    }
    const horizon = parseInt(time_horizon_years) || 3;
    if (horizon < 1 || horizon > 5) {
      return res.status(400).json({ error: 'time_horizon_years must be between 1 and 5' });
    }

    const [leadershipResult, hiringResult, promotionResult, retentionResult] = await Promise.all([
      pool.query('SELECT level, department, demographic_group, representation_pct, succession_coverage FROM leadership_pipeline ORDER BY level LIMIT 40'),
      pool.query('SELECT department, demographic_group, pass_through_rate, bias_score FROM hiring_bias ORDER BY bias_score DESC LIMIT 40'),
      pool.query('SELECT department, demographic_group, promotion_rate, avg_time_to_promotion FROM promotion_bias ORDER BY department LIMIT 40'),
      pool.query('SELECT department, demographic_group, turnover_rate FROM retention_analysis ORDER BY turnover_rate DESC LIMIT 40'),
    ]).catch(() => [{ rows: [] }, { rows: [] }, { rows: [] }, { rows: [] }]);

    const analysis = await callOpenRouter(
      `Simulate the impact of these proposed DEI policy changes on the talent pipeline over the next ${horizon} year(s):
Policies: ${Array.isArray(policy_changes) ? policy_changes.join('; ') : policy_changes}
Target groups (if specified): ${target_groups ? (Array.isArray(target_groups) ? target_groups.join(', ') : target_groups) : 'all underrepresented groups'}

Provide:
## Baseline Snapshot (current representation per level/dept)
## Year-by-Year Projection (representation %, attrition, leadership pipeline coverage at year 1, 2, ${horizon})
## Sensitivity Analysis (which policies move the needle most)
## Bottlenecks Identified
## Risks (over-reliance on one lever, attrition spikes, etc.)
## Recommended Sequencing of Policies`,
      {
        policy_changes,
        time_horizon_years: horizon,
        target_groups: target_groups || null,
        leadership_pipeline: leadershipResult.rows,
        hiring: hiringResult.rows,
        promotion: promotionResult.rows,
        retention: retentionResult.rows
      }
    );

    res.json({
      policy_changes,
      time_horizon_years: horizon,
      target_groups: target_groups || null,
      analysis,
      generated_at: new Date().toISOString()
    });

    persistAnalysis('talent_pipeline_simulation', null, 'talent-pipeline-simulation', analysis,
      { policy_changes, time_horizon_years: horizon, target_groups: target_groups || null }, req.user?.id).catch(console.error);
  } catch (err) {
    return aiErrorHandler(err, res);
  }
});

// POST /api/ai/bias-mitigation-playbook
// Given a flagged bias, produce evidence-based interventions.
router.post('/bias-mitigation-playbook', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { bias_type, context: biasContext, severity } = req.body;
    if (!bias_type) {
      return res.status(400).json({ error: 'bias_type is required (e.g. "hiring", "promotion", "pay")' });
    }

    const sev = severity || 'medium';
    const validSev = ['low', 'medium', 'high', 'critical'];
    if (!validSev.includes(sev)) {
      return res.status(400).json({ error: `severity must be one of: ${validSev.join(', ')}` });
    }

    const lookups = {
      hiring: 'SELECT department, job_title, demographic_group, pass_through_rate, bias_score FROM hiring_bias ORDER BY bias_score DESC LIMIT 30',
      promotion: 'SELECT department, demographic_group, promotion_rate, avg_time_to_promotion, bias_indicator FROM promotion_bias ORDER BY department LIMIT 30',
      pay: 'SELECT department, role_title, demographic_group, pay_gap_percentage FROM pay_equity ORDER BY ABS(pay_gap_percentage) DESC LIMIT 30',
      training: 'SELECT department, demographic_group, completion_rate, satisfaction_score FROM training_programs ORDER BY id DESC LIMIT 30',
    };

    let supportingData = [];
    const lookupKey = Object.keys(lookups).find(k => bias_type.toLowerCase().includes(k));
    if (lookupKey) {
      try {
        const r = await pool.query(lookups[lookupKey]);
        supportingData = r.rows;
      } catch (_) { /* ignore */ }
    }

    const analysis = await callOpenRouter(
      `Generate an evidence-based bias mitigation playbook for the following flagged bias:
Bias type: ${bias_type}
Severity: ${sev}
${biasContext ? `Context: ${typeof biasContext === 'string' ? biasContext : JSON.stringify(biasContext)}` : ''}

Produce:
## Diagnosis (root causes and structural drivers)
## Evidence Base (cite known DEI research / frameworks: e.g. structured interviews for hiring bias, Bohnet's "What Works")
## Tier 1 Interventions (immediate, < 30 days)
## Tier 2 Interventions (3-6 months)
## Tier 3 Interventions (6-18 months, structural)
## Measurement Plan (KPIs to track effectiveness)
## Common Pitfalls to Avoid
## Owner / Stakeholder Map`,
      { bias_type, severity: sev, context: biasContext || null, supporting_data: supportingData }
    );

    res.json({
      bias_type,
      severity: sev,
      analysis,
      data_points: supportingData.length,
      generated_at: new Date().toISOString()
    });

    persistAnalysis('bias_mitigation', null, 'bias-mitigation-playbook', analysis,
      { bias_type, severity: sev }, req.user?.id).catch(console.error);
  } catch (err) {
    return aiErrorHandler(err, res);
  }
});

module.exports = router;
