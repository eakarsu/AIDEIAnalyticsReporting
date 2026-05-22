const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { cohorts_reviewed: 18, remediation_plans: 6, budget_required: 184000, closure_rate: '62%' },
    plans: [
      { cohort: 'Engineering L5', gap: '4.8%', owner: 'Comp Team', action: 'salary adjustment cycle', status: 'approved' },
      { cohort: 'Sales IC3', gap: '3.1%', owner: 'HRBP', action: 'promotion calibration review', status: 'in review' },
      { cohort: 'Operations Leads', gap: '5.4%', owner: 'People Analytics', action: 'manager audit', status: 'draft' },
    ],
  });
});

router.post('/plan', (req, res) => {
  const { gapPercent = 0 } = req.body || {};
  res.json({ priority: gapPercent > 5 ? 'urgent' : 'standard', actions: ['validate cohort', 'approve budget', 'track closure date'] });
});

module.exports = router;
