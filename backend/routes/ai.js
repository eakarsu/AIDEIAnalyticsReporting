const express = require('express');
const { pool } = require('../db/schema');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { persistAnalysis } = require('./aiAnalyses');
const router = express.Router();

const callOpenRouter = async (prompt, context) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'DEI Analytics Platform'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
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

// Diversity Metrics AI Analysis
router.post('/analyze-diversity', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const metrics = await pool.query('SELECT * FROM diversity_metrics ORDER BY department, metric_type');
    const analysis = await callOpenRouter(
      'Analyze these diversity metrics across the organization. Identify key gaps, trends, departments performing well vs. needing improvement, and provide specific actionable recommendations to improve diversity representation. Include risk areas and quick wins.',
      metrics.rows
    );
    res.json({ analysis, data_points: metrics.rows.length });
    persistAnalysis('diversity_metrics', null, 'analyze-diversity', analysis, { data_points: metrics.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Pay Equity AI Analysis
router.post('/analyze-pay-equity', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM pay_equity ORDER BY department, role_title');
    const analysis = await callOpenRouter(
      'Analyze this pay equity data across the organization. Identify significant pay gaps by demographic group and department, assess legal risk, prioritize which gaps to address first, calculate the estimated cost of equity adjustments, and provide a phased remediation plan.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('pay_equity', null, 'analyze-pay-equity', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Hiring Bias AI Analysis
router.post('/analyze-hiring-bias', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM hiring_bias ORDER BY department, job_title');
    const analysis = await callOpenRouter(
      'Analyze this hiring data for potential bias patterns. Examine pass-through rates at each stage (application, interview, offer, hire) by demographic group. Identify where in the funnel bias appears strongest, which roles and departments are most affected, and recommend specific interventions for each stage of the hiring process.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('hiring_bias', null, 'analyze-hiring-bias', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Promotion Bias AI Analysis
router.post('/analyze-promotion-bias', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM promotion_bias ORDER BY department, level_from');
    const analysis = await callOpenRouter(
      'Analyze this promotion data for bias patterns. Compare promotion rates and time-to-promotion across demographic groups and departments. Identify glass ceiling effects, broken rungs, and specific levels where certain groups face barriers. Provide recommendations for mentorship programs, sponsorship initiatives, and process changes.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('promotion_bias', null, 'analyze-promotion-bias', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Compliance AI Analysis
router.post('/analyze-compliance', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM compliance_reports ORDER BY priority DESC, due_date');
    const analysis = await callOpenRouter(
      'Analyze the compliance reporting status across the organization. Identify overdue or at-risk reports, assess overall compliance posture, highlight areas of legal exposure, and recommend prioritization of compliance activities. Include a risk matrix and timeline for addressing gaps.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('compliance_reports', null, 'analyze-compliance', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Benchmarking AI Analysis
router.post('/analyze-benchmarking', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM benchmarking ORDER BY category, metric_name');
    const analysis = await callOpenRouter(
      'Analyze our DEI benchmarking data against industry standards. Identify where we lead vs. lag behind industry averages and top performers. Highlight metrics with declining trends, suggest which areas to prioritize for improvement, and recommend strategies to move toward top-performer status. Include competitive positioning insights.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('benchmarking', null, 'analyze-benchmarking', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Employee Surveys AI Analysis
router.post('/analyze-surveys', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM employee_surveys ORDER BY department, category');
    const analysis = await callOpenRouter(
      'Analyze these employee DEI survey results. Identify departments and demographic groups with lowest engagement/belonging scores. Look for patterns in sentiment and key themes. Recommend targeted interventions to improve inclusion and belonging for underrepresented groups.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('employee_surveys', null, 'analyze-surveys', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Training Programs AI Analysis
router.post('/analyze-training', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM training_programs ORDER BY department, program_name');
    const analysis = await callOpenRouter(
      'Analyze DEI training program effectiveness. Identify programs with low completion rates, departments lagging behind, and demographic-specific training gaps. Recommend strategies to improve completion rates and measure behavioral change outcomes. Assess which training types show highest impact.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('training_programs', null, 'analyze-training', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Retention Analysis AI
router.post('/analyze-retention', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM retention_analysis ORDER BY department, demographic_group');
    const analysis = await callOpenRouter(
      'Analyze retention data by demographic group and department. Identify groups with disproportionately high turnover, examine exit reasons for patterns of systemic issues, assess flight risk across the organization, and recommend targeted retention strategies. Calculate estimated cost of diverse talent attrition.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('retention_analysis', null, 'analyze-retention', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Leadership Pipeline AI Analysis
router.post('/analyze-leadership', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM leadership_pipeline ORDER BY level, department');
    const analysis = await callOpenRouter(
      'Analyze the leadership pipeline for diversity representation. Identify "broken rungs" and "glass ceilings" where diverse talent drops off. Assess succession coverage gaps, recommend development programs, and provide a roadmap to achieve diverse leadership representation at every level.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('leadership_pipeline', null, 'analyze-leadership', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Supplier Diversity AI Analysis
router.post('/analyze-suppliers', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM supplier_diversity ORDER BY certification_type, annual_spend DESC');
    const analysis = await callOpenRouter(
      'Analyze supplier diversity data. Assess total diverse spend percentage, identify gaps in certification categories, evaluate supplier performance ratings, and recommend strategies to increase diverse supplier participation. Identify at-risk contracts and opportunities to expand the diverse supplier base.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('supplier_diversity', null, 'analyze-suppliers', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ERG Management AI Analysis
router.post('/analyze-ergs', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM erg_management ORDER BY engagement_score DESC');
    const analysis = await callOpenRouter(
      'Analyze Employee Resource Group data. Assess engagement levels, membership growth, budget allocation fairness, and impact effectiveness. Identify ERGs that need more support, recommend cross-ERG collaboration opportunities, and suggest metrics for measuring ERG impact on business outcomes.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('erg_management', null, 'analyze-ergs', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Incident Reports AI Analysis
router.post('/analyze-incidents', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM incident_reports ORDER BY severity DESC, reported_date DESC');
    const analysis = await callOpenRouter(
      'Analyze DEI incident reports. Identify patterns by type, department, and severity. Assess resolution timelines, effectiveness of interventions, and systemic issues. Recommend preventive measures, policy changes, and training needs. Flag any departments with recurring issues that need immediate attention.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('incident_reports', null, 'analyze-incidents', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Accessibility AI Analysis
router.post('/analyze-accessibility', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM accessibility ORDER BY score ASC');
    const analysis = await callOpenRouter(
      'Analyze accessibility compliance data across digital, physical, and process areas. Identify non-compliant areas needing urgent attention, assess accommodation request fulfillment rates, and recommend prioritized remediation plans. Include estimated costs and timelines for achieving full compliance.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('accessibility', null, 'analyze-accessibility', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Workforce Demographics AI Analysis
router.post('/analyze-workforce', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const data = await pool.query('SELECT * FROM workforce_demographics ORDER BY department, job_level');
    const analysis = await callOpenRouter(
      'Analyze overall workforce demographics. Identify representation gaps by department and job level, compare against population and labor market benchmarks, assess intersectional patterns, and recommend a comprehensive workforce diversity strategy with short-term and long-term goals.',
      data.rows
    );
    res.json({ analysis, data_points: data.rows.length });
    persistAnalysis('workforce_demographics', null, 'analyze-workforce', analysis, { data_points: data.rows.length }, req.user?.id).catch(console.error);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Single record AI analysis
router.post('/analyze-record', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { record, type } = req.body;
    const prompts = {
      diversity_metrics: 'Analyze this specific diversity metric. Provide context on whether this value is concerning or positive, compare to typical industry benchmarks, and suggest 3 specific actions to improve this metric.',
      pay_equity: 'Analyze this pay equity record. Assess the severity of any pay gap, estimate legal/retention risk, and recommend specific remediation steps with estimated costs.',
      hiring_bias: 'Analyze this hiring record for bias. Evaluate the pass-through rates, identify which stage shows the most significant disparity, and recommend process changes to reduce bias.',
      promotion_bias: 'Analyze this promotion record for bias indicators. Assess the promotion rate and time-to-promotion, compare to what would be expected with no bias, and recommend interventions.',
      compliance_reports: 'Analyze this compliance report. Assess the risk level, recommend next steps, and identify any dependencies or blockers for completion.',
      benchmarking: 'Analyze this benchmarking metric. Explain the gap between our performance and industry averages/top performers, and recommend a specific improvement plan.',
      employee_surveys: 'Analyze this survey result. Assess the score relative to benchmarks, interpret the sentiment and key themes, and recommend specific actions to improve this metric for this demographic group.',
      training_programs: 'Analyze this training program record. Assess completion rate effectiveness, identify barriers to participation, and recommend improvements to increase engagement and impact.',
      retention_analysis: 'Analyze this retention record. Assess the turnover rate severity, evaluate root causes from exit reasons, and recommend specific retention strategies for this demographic group.',
      leadership_pipeline: 'Analyze this leadership pipeline data. Assess representation gaps, succession planning adequacy, and recommend development programs to build a diverse leadership pipeline.',
      supplier_diversity: 'Analyze this supplier diversity record. Assess the supplier relationship health, evaluate spend levels, and recommend strategies to strengthen or expand this diverse supplier partnership.',
      erg_management: 'Analyze this ERG data. Assess engagement levels, membership health, and impact effectiveness. Recommend strategies to strengthen this ERG and increase its organizational impact.',
      incident_reports: 'Analyze this incident report. Assess severity, evaluate the response adequacy, identify systemic factors, and recommend preventive measures to avoid recurrence.',
      accessibility: 'Analyze this accessibility record. Assess compliance status, evaluate accommodation fulfillment, and recommend specific remediation steps with prioritization.',
      workforce_demographics: 'Analyze this workforce demographics record. Assess representation adequacy, compare to labor market availability, and recommend targeted strategies to improve demographic balance.'
    };
    const analysis = await callOpenRouter(prompts[type] || 'Analyze this record and provide insights.', record);
    res.json({ analysis });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
