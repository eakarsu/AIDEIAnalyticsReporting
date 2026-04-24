import React, { useState, useEffect } from 'react';

const API = 'http://localhost:3001/api';

const features = [
  { key: 'diversity-metrics', title: 'Diversity Metrics', description: 'Track demographic representation across departments, roles, and levels.', color: '#6366f1', endpoint: '/diversity-metrics' },
  { key: 'pay-equity', title: 'Pay Equity Analysis', description: 'Analyze compensation gaps across demographic groups with AI recommendations.', color: '#10b981', endpoint: '/pay-equity' },
  { key: 'hiring-bias', title: 'Hiring Bias Detection', description: 'Detect and measure bias in recruitment funnels from application to hire.', color: '#f59e0b', endpoint: '/hiring-bias' },
  { key: 'promotion-bias', title: 'Promotion Bias Detection', description: 'Identify barriers in advancement pipelines and glass ceiling effects.', color: '#ef4444', endpoint: '/promotion-bias' },
  { key: 'compliance-reports', title: 'Compliance Reporting', description: 'Manage regulatory compliance with EEO, OFCCP, and state-level requirements.', color: '#8b5cf6', endpoint: '/compliance-reports' },
  { key: 'benchmarking', title: 'Industry Benchmarking', description: 'Compare DEI performance against industry averages and top performers.', color: '#06b6d4', endpoint: '/benchmarking' },
  { key: 'employee-surveys', title: 'Employee Surveys', description: 'DEI sentiment surveys tracking belonging, inclusion, and engagement.', color: '#ec4899', endpoint: '/employee-surveys' },
  { key: 'training-programs', title: 'Training Programs', description: 'Track DEI training completion rates, effectiveness, and engagement.', color: '#14b8a6', endpoint: '/training-programs' },
  { key: 'retention-analysis', title: 'Retention Analysis', description: 'Analyze turnover patterns by demographic groups and identify flight risks.', color: '#f97316', endpoint: '/retention-analysis' },
  { key: 'leadership-pipeline', title: 'Leadership Pipeline', description: 'Monitor diversity in succession planning and leadership development.', color: '#a855f7', endpoint: '/leadership-pipeline' },
  { key: 'supplier-diversity', title: 'Supplier Diversity', description: 'Track diverse supplier spend, certifications, and contract performance.', color: '#22c55e', endpoint: '/supplier-diversity' },
  { key: 'erg-management', title: 'ERG Management', description: 'Manage Employee Resource Groups, membership, budgets, and impact.', color: '#3b82f6', endpoint: '/erg-management' },
  { key: 'incident-reports', title: 'Incident Reports', description: 'Track discrimination, harassment, and bias incidents with resolutions.', color: '#dc2626', endpoint: '/incident-reports' },
  { key: 'accessibility', title: 'Accessibility Compliance', description: 'Monitor digital, physical, and process accessibility standards.', color: '#0891b2', endpoint: '/accessibility' },
  { key: 'workforce-demographics', title: 'Workforce Demographics', description: 'Overall workforce composition by department, level, and demographics.', color: '#7c3aed', endpoint: '/workforce-demographics' }
];

const icons = {
  'diversity-metrics': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  'pay-equity': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  'hiring-bias': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  'promotion-bias': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  'compliance-reports': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  'benchmarking': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  'employee-surveys': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  'training-programs': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>,
  'retention-analysis': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  'leadership-pipeline': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
  'supplier-diversity': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2" ry="2"/><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><line x1="6" y1="13" x2="6" y2="13"/></svg>,
  'erg-management': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  'incident-reports': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  'accessibility': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="8" r="1"/><path d="M12 12v4M9 18l3-2 3 2"/></svg>,
  'workforce-demographics': <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path d="M12 3v9l4 2"/></svg>
};

function Dashboard({ token, user }) {
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all(
      features.map(f =>
        fetch(`${API}${f.endpoint}`, { headers })
          .then(r => r.json())
          .then(data => ({ key: f.key, count: Array.isArray(data) ? data.length : 0 }))
          .catch(() => ({ key: f.key, count: 0 }))
      )
    ).then(results => {
      const c = {};
      results.forEach(r => c[r.key] = r.count);
      setCounts(c);
    });
  }, [token]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.name}</h2>
          <p>AI-powered Diversity, Equity & Inclusion Analytics Dashboard</p>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{Object.values(counts).reduce((a, b) => a + b, 0)}</div>
          <div className="stat-text">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">15</div>
          <div className="stat-text">Analytics Modules</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">AI</div>
          <div className="stat-text">Powered Insights</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">Live</div>
          <div className="stat-text">Monitoring</div>
        </div>
      </div>

      <div className="dashboard-cards">
        {features.map(f => (
          <div
            key={f.key}
            className="dashboard-card"
            style={{ '--card-color': f.color }}
            onClick={() => window.location.href = f.endpoint}
          >
            <div className="card-icon" style={{ background: `${f.color}20`, color: f.color }}>
              {icons[f.key]}
            </div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <div className="card-stats">
              <div className="card-stat">
                <div className="stat-value">{counts[f.key] || 0}</div>
                <div className="stat-label">Records</div>
              </div>
              <div className="card-stat">
                <div className="stat-value" style={{ color: f.color }}>Active</div>
                <div className="stat-label">Status</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
