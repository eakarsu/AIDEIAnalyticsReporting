import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api';

const moduleOptions = [
  { key: 'diversity-metrics', label: 'Diversity Metrics' },
  { key: 'pay-equity', label: 'Pay Equity' },
  { key: 'hiring-bias', label: 'Hiring Bias' },
  { key: 'promotion-bias', label: 'Promotion Bias' },
  { key: 'compliance-reports', label: 'Compliance Reports' },
  { key: 'benchmarking', label: 'Benchmarking' },
  { key: 'employee-surveys', label: 'Employee Surveys' },
  { key: 'training-programs', label: 'Training Programs' },
  { key: 'retention-analysis', label: 'Retention Analysis' },
  { key: 'leadership-pipeline', label: 'Leadership Pipeline' },
  { key: 'supplier-diversity', label: 'Supplier Diversity' },
  { key: 'erg-management', label: 'ERG Management' },
  { key: 'incident-reports', label: 'Incident Reports' },
  { key: 'accessibility', label: 'Accessibility' },
  { key: 'workforce-demographics', label: 'Workforce Demographics' }
];

function Reports({ token }) {
  const [savedReports, setSavedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [title, setTitle] = useState('DEI Quarterly Report');
  const [description, setDescription] = useState('');
  const [selectedModules, setSelectedModules] = useState(['diversity-metrics', 'pay-equity', 'hiring-bias']);
  const [includeSummary, setIncludeSummary] = useState(true);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reports`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setSavedReports(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const toggleModule = (key) => {
    setSelectedModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    if (selectedModules.length === 0) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/reports/generate`, {
        method: 'POST', headers,
        body: JSON.stringify({ title, modules: selectedModules, include_summary: includeSummary })
      });
      const data = await res.json();
      setGeneratedReport(data);
      setShowCreateModal(false);
    } catch (err) { console.error(err); }
    setGenerating(false);
  };

  const handleSaveReport = async () => {
    if (!generatedReport) return;
    try {
      const res = await fetch(`${API}/reports`, {
        method: 'POST', headers,
        body: JSON.stringify({
          title: generatedReport.title,
          description,
          modules: generatedReport.modules,
          report_data: generatedReport
        })
      });
      if (res.ok) {
        fetchSaved();
        setGeneratedReport(null);
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this saved report?')) return;
    try {
      await fetch(`${API}/reports/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchSaved();
    } catch (err) { console.error(err); }
  };

  const handleViewReport = async (report) => {
    setViewReport(report);
    setShowViewModal(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('report-print-area');
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${generatedReport?.title || viewReport?.title || 'Report'}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
      h1{color:#1e293b;border-bottom:2px solid #6366f1;padding-bottom:8px}
      h2{color:#475569;margin-top:24px}h3{color:#6366f1;margin-top:16px}
      table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}
      th{background:#f1f5f9;padding:10px;text-align:left;border:1px solid #e2e8f0}
      td{padding:8px 10px;border:1px solid #e2e8f0}
      .summary-card{display:inline-block;background:#f8fafc;border:1px solid #e2e8f0;padding:16px 24px;margin:8px;border-radius:8px}
      .summary-number{font-size:24px;font-weight:700;color:#6366f1}
      .summary-label{font-size:12px;color:#64748b}
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const renderReportContent = (report) => {
    let data, modules, summary;
    if (report.report_data) {
      const parsed = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : report.report_data;
      data = parsed.data;
      modules = parsed.modules || [];
      summary = parsed.summary;
    } else {
      data = report.data;
      modules = report.modules || [];
      summary = report.summary;
    }

    return (
      <div id="report-print-area">
        <h1 style={{ fontSize: '24px', color: '#f1f5f9', marginBottom: '8px' }}>{report.title}</h1>
        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
          Generated: {new Date(report.generatedAt || report.created_at).toLocaleString()}
          {report.generatedBy && ` | By: ${report.generatedBy}`}
          {report.created_by_name && ` | By: ${report.created_by_name}`}
        </p>

        {summary && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', color: '#a5b4fc', marginBottom: '16px' }}>Executive Summary</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {Object.entries(summary).map(([mod, stats]) => (
                <div key={mod} style={{
                  background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(99,102,241,0.1)',
                  borderRadius: '12px', padding: '16px 24px', minWidth: '200px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {mod.replace(/-/g, ' ')}
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#a5b4fc' }}>{stats.totalRecords}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>records</div>
                  {stats.avgPayGap && <div style={{ fontSize: '13px', color: '#f87171', marginTop: '4px' }}>Avg Gap: {stats.avgPayGap}%</div>}
                  {stats.avgTurnover && <div style={{ fontSize: '13px', color: '#fbbf24', marginTop: '4px' }}>Avg Turnover: {stats.avgTurnover}%</div>}
                  {stats.openIncidents !== undefined && <div style={{ fontSize: '13px', color: '#f87171', marginTop: '4px' }}>Open: {stats.openIncidents}</div>}
                  {stats.avgCompletionRate && <div style={{ fontSize: '13px', color: '#34d399', marginTop: '4px' }}>Avg Completion: {stats.avgCompletionRate}%</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {data && Object.entries(data).map(([mod, rows]) => (
          <div key={mod} style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '16px', color: '#f1f5f9', borderBottom: '1px solid rgba(99,102,241,0.1)', paddingBottom: '8px', marginBottom: '16px' }}>
              {mod.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} ({Array.isArray(rows) ? rows.length : 0} records)
            </h2>
            {Array.isArray(rows) && rows.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {Object.keys(rows[0]).filter(k => !['created_at', 'updated_at'].includes(k)).slice(0, 8).map(k => (
                        <th key={k}>{k.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} style={{ cursor: 'default' }}>
                        {Object.entries(row).filter(([k]) => !['created_at', 'updated_at'].includes(k)).slice(0, 8).map(([k, v], j) => (
                          <td key={j}>{v !== null && v !== undefined ? String(v).substring(0, 50) : '--'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 20 && <p style={{ color: '#64748b', fontSize: '12px', marginTop: '8px' }}>Showing 20 of {rows.length} records</p>}
              </div>
            ) : (
              <p style={{ color: '#64748b' }}>No data available</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Report Builder</h2>
          <p>Generate, save, and print comprehensive DEI reports</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
            + Generate Report
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{savedReports.length}</div>
          <div className="stat-text">Saved Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">15</div>
          <div className="stat-text">Available Modules</div>
        </div>
      </div>

      {/* Generated Report Preview */}
      {generatedReport && (
        <div style={{
          background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '16px', padding: '28px', marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#f1f5f9' }}>Generated Report Preview</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" onClick={handleSaveReport}>Save Report</button>
              <button className="btn-secondary" onClick={handlePrint}>Print / PDF</button>
              <button className="btn-danger" onClick={() => setGeneratedReport(null)}>Close</button>
            </div>
          </div>
          {renderReportContent(generatedReport)}
        </div>
      )}

      {/* Saved Reports */}
      <div className="data-table-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading saved reports...</p>
        ) : savedReports.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No saved reports. Generate your first report to get started.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>Created By</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedReports.map(report => (
                <tr key={report.id} style={{ cursor: 'default' }}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{report.title}</td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {report.description || '--'}
                  </td>
                  <td>{report.created_by_name || '--'}</td>
                  <td style={{ fontSize: '13px', color: '#94a3b8' }}>{new Date(report.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-edit" onClick={() => handleViewReport(report)} style={{ padding: '4px 12px', fontSize: '12px' }}>View</button>
                      <button className="btn-danger" onClick={() => handleDeleteReport(report.id)} style={{ padding: '4px 12px', fontSize: '12px' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Generate New Report</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Report Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '14px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Description (optional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows="2"
                  style={{ width: '100%', padding: '10px 14px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', color: '#e2e8f0', fontSize: '14px', fontFamily: 'inherit' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Select Modules to Include</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {moduleOptions.map(mod => (
                    <button key={mod.key} onClick={() => toggleModule(mod.key)}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                        background: selectedModules.includes(mod.key) ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)',
                        color: selectedModules.includes(mod.key) ? '#a5b4fc' : '#94a3b8',
                        transition: 'all 0.2s'
                      }}
                    >
                      {selectedModules.includes(mod.key) ? '✓ ' : ''}{mod.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input type="checkbox" id="includeSummary" checked={includeSummary} onChange={(e) => setIncludeSummary(e.target.checked)} />
                <label htmlFor="includeSummary" style={{ fontSize: '14px', color: '#e2e8f0', cursor: 'pointer' }}>Include Executive Summary</label>
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleGenerate} disabled={generating || selectedModules.length === 0}>
                  {generating ? 'Generating...' : `Generate Report (${selectedModules.length} modules)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Saved Report Modal */}
      {showViewModal && viewReport && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <h3>{viewReport.title}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => { setGeneratedReport(typeof viewReport.report_data === 'string' ? JSON.parse(viewReport.report_data) : viewReport.report_data); setShowViewModal(false); }}>
                  Print
                </button>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>&times;</button>
              </div>
            </div>
            <div className="modal-body">
              {renderReportContent(viewReport)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
