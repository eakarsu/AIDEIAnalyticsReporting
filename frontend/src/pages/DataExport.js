import React, { useState } from 'react';

const API = 'http://localhost:3001/api';

const modules = [
  { key: 'diversity-metrics', title: 'Diversity Metrics', color: '#6366f1' },
  { key: 'pay-equity', title: 'Pay Equity', color: '#10b981' },
  { key: 'hiring-bias', title: 'Hiring Bias', color: '#f59e0b' },
  { key: 'promotion-bias', title: 'Promotion Bias', color: '#ef4444' },
  { key: 'compliance-reports', title: 'Compliance Reports', color: '#8b5cf6' },
  { key: 'benchmarking', title: 'Benchmarking', color: '#06b6d4' },
  { key: 'employee-surveys', title: 'Employee Surveys', color: '#ec4899' },
  { key: 'training-programs', title: 'Training Programs', color: '#14b8a6' },
  { key: 'retention-analysis', title: 'Retention Analysis', color: '#f97316' },
  { key: 'leadership-pipeline', title: 'Leadership Pipeline', color: '#a855f7' },
  { key: 'supplier-diversity', title: 'Supplier Diversity', color: '#22c55e' },
  { key: 'erg-management', title: 'ERG Management', color: '#3b82f6' },
  { key: 'incident-reports', title: 'Incident Reports', color: '#dc2626' },
  { key: 'accessibility', title: 'Accessibility', color: '#0891b2' },
  { key: 'workforce-demographics', title: 'Workforce Demographics', color: '#7c3aed' }
];

function DataExport({ token }) {
  const [exporting, setExporting] = useState(null);
  const [message, setMessage] = useState(null);

  const handleExport = async (moduleKey, format = 'csv') => {
    setExporting(moduleKey);
    setMessage(null);
    try {
      const url = format === 'json'
        ? `${API}/export/${moduleKey}/json`
        : `${API}/export/${moduleKey}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Export failed' });
        setExporting(null);
        return;
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${moduleKey}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMessage({ type: 'success', text: `${moduleKey} exported as ${format.toUpperCase()} successfully!` });
    } catch (err) {
      setMessage({ type: 'error', text: 'Export failed: ' + err.message });
    }
    setExporting(null);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Data Export</h2>
          <p>Export your DEI data in CSV or JSON format</p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '12px',
          marginBottom: '24px',
          background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '14px'
        }}>
          {message.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '16px'
      }}>
        {modules.map(mod => (
          <div key={mod.key} style={{
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(99, 102, 241, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
              background: `linear-gradient(90deg, ${mod.color}, transparent)`
            }}></div>

            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px' }}>
              {mod.title}
            </h3>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={() => handleExport(mod.key, 'csv')}
                disabled={exporting === mod.key}
                style={{ flex: 1, fontSize: '13px', padding: '10px 16px' }}
              >
                {exporting === mod.key ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => handleExport(mod.key, 'json')}
                disabled={exporting === mod.key}
                style={{ flex: 1, fontSize: '13px', padding: '10px 16px' }}
              >
                Export JSON
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataExport;
