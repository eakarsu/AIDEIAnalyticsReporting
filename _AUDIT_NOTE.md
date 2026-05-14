# Audit Apply Notes — AIDEIAnalyticsReporting

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_02.md` (lines 1080-1140).

This project is classified **substantive** with 16 AI endpoints (one per DEI
analysis dimension), exceeding the >15 threshold.

Per apply-pass policy, this pass is **backlog-only**.

## Original audit recommendations

### Existing AI features (16 endpoints)
analyze-diversity, analyze-pay-equity, analyze-hiring-bias,
analyze-promotion-bias, analyze-compliance, analyze-benchmarking,
analyze-surveys, analyze-training, analyze-retention, analyze-leadership,
analyze-suppliers, analyze-ergs, analyze-incidents, analyze-accessibility,
analyze-workforce, analyze-record.

### Missing AI counterparts
None significant — audit notes "excellent AI-to-route alignment."

### Missing non-AI features
- HRIS integration (Workday, SuccessFactors, BambooHR).
- Real-time alerting for compliance violations.
- Action plan automation.

### Custom feature suggestions
- Predictive equity forecasting.
- Bias mitigation playbook.
- Intersectionality analysis.
- Talent pipeline simulation.
- Peer benchmarking.

## Implemented in this pass

None. Backlog-only.

## Backlog (prioritized)

### Mechanical, low-risk
1. `/api/ai/intersectionality-analysis` — combine two or more demographic
   dimensions and analyze inequities across the cells.
2. `/api/ai/talent-pipeline-simulation` — simulate impact of policy changes
   on the next 1–3 years of representation.
3. `/api/ai/bias-mitigation-playbook` — given a flagged bias, produce
   evidence-based interventions.

### Needs product decision
- Action-plan model and ownership.
- Real-time alerting design (data freshness vs. cost).

### Needs credentials / external SDK
- Workday / SuccessFactors / BambooHR connectors.

### Too risky / large refactor
- Auto-applying interventions on HRIS data (requires policy review).

## Apply pass 3 (frontend)

LEFT-AS-IS. Frontend already comprehensively wired:
- `frontend/src/pages/AITools.js` calls `/api/ai/threshold-check`, `/api/ai/executive-summary`, `/api/ai/attrition-predictor`, `/api/ai/compliance-calendar`, `/api/ai-analyses` with JWT Bearer (token plumbed through `App.js` after login).
- `frontend/src/components/AIAnalysisPanel.js` is shared by every per-domain page (`DiversityMetrics.js`, `PayEquity.js`, `HiringBias.js`, …) which post to their corresponding backend AI endpoint.
- `App.js` mounts `<AITools>` at `/ai-tools` and the nav links to it.

No FE code changes required. CRA stack, react-markdown for output rendering, no new deps.

Log: `/Users/erolakarsu/projects/_AUDIT/apply3_logs/ab3_98.md`.

## Apply pass 4 (mechanical backlog)

LEFT-AS-IS. The three mechanical backlog items
(`/api/ai/intersectionality-analysis`, `/api/ai/talent-pipeline-simulation`,
`/api/ai/bias-mitigation-playbook`) are already implemented in
`backend/routes/aiNew.js` with 503-on-no-key via `aiErrorHandler` +
`NoApiKeyError`, mounted on `/api/ai`, and fully wired in
`frontend/src/pages/AITools.js` with form tabs, JWT bearer, and error display.
No additional work required.

Log: `/Users/erolakarsu/projects/_AUDIT/apply4_logs/ab3_98.md`.
