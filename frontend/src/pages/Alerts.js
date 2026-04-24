import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api';

const emptyForm = {
  title: '', description: '', module: 'diversity-metrics',
  metric_field: 'value', condition: 'greater_than', threshold: '',
  severity: 'medium', notify_email: ''
};

const moduleOptions = [
  { key: 'diversity-metrics', label: 'Diversity Metrics', fields: ['value', 'target_value'] },
  { key: 'pay-equity', label: 'Pay Equity', fields: ['pay_gap_percentage', 'avg_salary', 'median_salary'] },
  { key: 'hiring-bias', label: 'Hiring Bias', fields: ['bias_score', 'pass_through_rate', 'hired'] },
  { key: 'retention-analysis', label: 'Retention Analysis', fields: ['turnover_rate', 'avg_tenure', 'departures'] },
  { key: 'incident-reports', label: 'Incident Reports', fields: ['days_to_resolve'] }
];

const conditionLabels = {
  'greater_than': 'Greater Than',
  'less_than': 'Less Than',
  'equals': 'Equals',
  'not_equals': 'Not Equals'
};

function Alerts({ token }) {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [checkResult, setCheckResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const [tab, setTab] = useState('rules');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsRes, statsRes, historyRes] = await Promise.all([
        fetch(`${API}/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/alerts/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/alerts/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setAlerts(Array.isArray(await alertsRes.clone().json()) ? await alertsRes.json() : []);
      setStats(await statsRes.json());
      const histData = await historyRes.json();
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/alerts`, { method: 'POST', headers, body: JSON.stringify(formData) });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ ...emptyForm });
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this alert?')) return;
    try {
      await fetch(`${API}/alerts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (alert) => {
    const newStatus = alert.status === 'active' ? 'paused' : 'active';
    try {
      await fetch(`${API}/alerts/${alert.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ ...alert, status: newStatus })
      });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCheckAlerts = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`${API}/alerts/check`, { method: 'POST', headers });
      const data = await res.json();
      setCheckResult(data);
      fetchData();
    } catch (err) { console.error(err); }
    setChecking(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectedModule = moduleOptions.find(m => m.key === formData.module);

  const getSeverityBadge = (severity) => {
    const cls = { critical: 'badge-danger', high: 'badge-warning', medium: 'badge-info', low: 'badge-neutral' };
    return <span className={cls[severity] || 'badge-neutral'}>{severity}</span>;
  };

  const getStatusBadge = (status) => {
    const cls = { active: 'badge-success', paused: 'badge-neutral', triggered: 'badge-danger' };
    return <span className={cls[status] || 'badge-neutral'}>{status}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Alerts & Notifications</h2>
          <p>Set up threshold-based alerts for DEI metrics</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={handleCheckAlerts} disabled={checking}>
            {checking ? 'Checking...' : 'Check All Alerts'}
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Alert
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{stats?.total || 0}</div>
          <div className="stat-text">Total Alerts</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.active || 0}</div>
          <div className="stat-text">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ef4444' }}>{stats?.critical || 0}</div>
          <div className="stat-text">Critical</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{history.length}</div>
          <div className="stat-text">Triggered</div>
        </div>
      </div>

      {/* Check Result */}
      {checkResult && (
        <div style={{
          padding: '20px', borderRadius: '12px', marginBottom: '24px',
          background: checkResult.triggered.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${checkResult.triggered.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: checkResult.triggered.length > 0 ? '12px' : '0' }}>
            <strong style={{ color: checkResult.triggered.length > 0 ? '#f87171' : '#34d399' }}>
              {checkResult.triggered.length > 0 ? `${checkResult.triggered.length} alert(s) triggered!` : 'All clear - no alerts triggered'}
            </strong>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Checked {checkResult.checked} alerts</span>
          </div>
          {checkResult.triggered.map((t, i) => (
            <div key={i} style={{ padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(239,68,68,0.1)' : 'none', color: '#e2e8f0', fontSize: '14px' }}>
              {getSeverityBadge(t.severity)} <strong>{t.title}</strong> - Current: {t.current_value?.toFixed(2)}, Threshold: {t.threshold}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
        {['rules', 'history'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '10px 24px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(99,102,241,0.2)' : 'rgba(30,41,59,0.6)',
              color: tab === t ? '#a5b4fc' : '#94a3b8', fontWeight: 600, fontSize: '14px',
              transition: 'all 0.2s'
            }}
          >
            {t === 'rules' ? 'Alert Rules' : 'Trigger History'}
          </button>
        ))}
      </div>

      {tab === 'rules' && (
        <div className="data-table-container">
          {loading ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading alerts...</p>
          ) : alerts.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No alert rules yet. Create one to monitor your DEI metrics.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Module</th>
                  <th>Condition</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(alert => (
                  <tr key={alert.id} style={{ cursor: 'default' }}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{alert.title}</td>
                    <td>{alert.module}</td>
                    <td style={{ fontSize: '13px' }}>
                      {alert.metric_field} {conditionLabels[alert.condition]?.toLowerCase()} {alert.threshold}
                    </td>
                    <td>{getSeverityBadge(alert.severity)}</td>
                    <td>{getStatusBadge(alert.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-edit" onClick={() => handleToggleStatus(alert)} style={{ padding: '4px 12px', fontSize: '12px' }}>
                          {alert.status === 'active' ? 'Pause' : 'Activate'}
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(alert.id)} style={{ padding: '4px 12px', fontSize: '12px' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="data-table-container">
          {history.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No alerts have been triggered yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Triggered At</th>
                  <th>Alert</th>
                  <th>Module</th>
                  <th>Severity</th>
                  <th>Value</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} style={{ cursor: 'default' }}>
                    <td style={{ fontSize: '13px', color: '#94a3b8' }}>{new Date(h.triggered_at).toLocaleString()}</td>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{h.alert_title}</td>
                    <td>{h.module}</td>
                    <td>{getSeverityBadge(h.severity)}</td>
                    <td>{h.triggered_value}</td>
                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Alert Rule</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate}>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Alert Title</label>
                    <input type="text" name="title" value={formData.title} onChange={handleFormChange} required placeholder="e.g. High Pay Gap Alert" />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Description</label>
                    <textarea name="description" value={formData.description} onChange={handleFormChange} rows="2" placeholder="What does this alert monitor?" />
                  </div>
                  <div className="form-group">
                    <label>Module</label>
                    <select name="module" value={formData.module} onChange={handleFormChange}>
                      {moduleOptions.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Metric Field</label>
                    <select name="metric_field" value={formData.metric_field} onChange={handleFormChange}>
                      {selectedModule?.fields.map(f => <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Condition</label>
                    <select name="condition" value={formData.condition} onChange={handleFormChange}>
                      {Object.entries(conditionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Threshold Value</label>
                    <input type="number" step="0.01" name="threshold" value={formData.threshold} onChange={handleFormChange} required placeholder="e.g. 15" />
                  </div>
                  <div className="form-group">
                    <label>Severity</label>
                    <select name="severity" value={formData.severity} onChange={handleFormChange}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Notify Email (optional)</label>
                    <input type="email" name="notify_email" value={formData.notify_email} onChange={handleFormChange} placeholder="alerts@company.com" />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Create Alert</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Alerts;
