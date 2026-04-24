const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const start = async () => {
  try {
    await createTables();
    console.log('Database tables ready');
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
