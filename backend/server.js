const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createTables } = require('./db/schema');
const authRoutes = require('./routes/auth');
const diversityMetricsRoutes = require('./routes/diversityMetrics');
const payEquityRoutes = require('./routes/payEquity');
const hiringBiasRoutes = require('./routes/hiringBias');
const promotionBiasRoutes = require('./routes/promotionBias');
const complianceReportsRoutes = require('./routes/complianceReports');
const benchmarkingRoutes = require('./routes/benchmarking');
const employeeSurveysRoutes = require('./routes/employeeSurveys');
const trainingProgramsRoutes = require('./routes/trainingPrograms');
const retentionAnalysisRoutes = require('./routes/retentionAnalysis');
const leadershipPipelineRoutes = require('./routes/leadershipPipeline');
const supplierDiversityRoutes = require('./routes/supplierDiversity');
const ergManagementRoutes = require('./routes/ergManagement');
const incidentReportsRoutes = require('./routes/incidentReports');
const accessibilityRoutes = require('./routes/accessibility');
const workforceDemoRoutes = require('./routes/workforceDemographics');
const aiRoutes = require('./routes/ai');
const exportRoutes = require('./routes/export');
const searchRoutes = require('./routes/search');
const auditLogRoutes = require('./routes/auditLog');
const userManagementRoutes = require('./routes/userManagement');
const alertsRoutes = require('./routes/alerts');
const reportsRoutes = require('./routes/reports');
const importDataRoutes = require('./routes/importData');
const aiAnalysesRoutes = require('./routes/aiAnalyses');
const aiNewRoutes = require('./routes/aiNew');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));

// CORS from env (comma-separated origins) - falls back to localhost dev
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:5173')
  .split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS: ' + origin));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/diversity-metrics', diversityMetricsRoutes);
app.use('/api/pay-equity', payEquityRoutes);
app.use('/api/hiring-bias', hiringBiasRoutes);
app.use('/api/promotion-bias', promotionBiasRoutes);
app.use('/api/compliance-reports', complianceReportsRoutes);
app.use('/api/benchmarking', benchmarkingRoutes);
app.use('/api/employee-surveys', employeeSurveysRoutes);
app.use('/api/training-programs', trainingProgramsRoutes);
app.use('/api/retention-analysis', retentionAnalysisRoutes);
app.use('/api/leadership-pipeline', leadershipPipelineRoutes);
app.use('/api/supplier-diversity', supplierDiversityRoutes);
app.use('/api/erg-management', ergManagementRoutes);
app.use('/api/incident-reports', incidentReportsRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/workforce-demographics', workforceDemoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/import', importDataRoutes);
app.use('/api/ai-analyses', aiAnalysesRoutes);
app.use('/api/ai', aiNewRoutes);






app.use('/api/ai', require('./routes/peerBenchmark'));
app.use('/api/ai', require('./routes/pipelineSimulate'));
app.use('/api/ai', require('./routes/intersectionality'));
app.use('/api/ai', require('./routes/biasPlaybook'));
app.use('/api/ai', require('./routes/equityForecast'));
// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  try {
    await createTables();
    console.log('Database tables ready');
// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-none-significant-excellent-ai-to-route-alignment-16-ai-endpo', require('./routes/gap_none_significant_excellent_ai_to_route_alignment_16_ai_endpo'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-alerts-lacks-ai-prioritization-endpoint', require('./routes/gap_alerts_lacks_ai_prioritization_endpoint'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-usermanagement-lacks-ai-access-pattern-anomaly-detection', require('./routes/gap_usermanagement_lacks_ai_access_pattern_anomaly_detection'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-hris-integration-no-workday-successfactors-bamboohr', require('./routes/gap_limited_hris_integration_no_workday_successfactors_bamboohr'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-real-time-alerting-beyond-alerts-js-storage', require('./routes/gap_limited_real_time_alerting_beyond_alerts_js_storage'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-action-plan-automation-or-tracking-workflow', require('./routes/gap_no_action_plan_automation_or_tracking_workflow'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-webhooks', require('./routes/gap_no_webhooks'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-payment-billing-module', require('./routes/gap_no_payment_billing_module'));

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
