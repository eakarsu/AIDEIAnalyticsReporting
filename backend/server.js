const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('./db/schema');
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters');
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
app.use('/api/governed-analyses', require('./routes/governedAnalyses'));
app.use('/api/ai', aiNewRoutes);






app.use('/api/ai', require('./routes/peerBenchmark'));
app.use('/api/ai', require('./routes/pipelineSimulate'));
app.use('/api/ai', require('./routes/intersectionality'));
app.use('/api/ai', require('./routes/biasPlaybook'));
app.use('/api/ai', require('./routes/equityForecast'));

// Custom Views (DEI domain) — must be mounted BEFORE any 404 / fallthrough handler
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/pay-equity-remediation-tracker', require('./routes/payEquityRemediationTracker'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Database connection verified; migrations are not run at startup');
// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

// // === Batch 02 Gaps & Frontend Mounts ===

    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
