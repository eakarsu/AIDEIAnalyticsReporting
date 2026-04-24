import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const INCIDENT_TYPES = [
  'Microaggression', 'Harassment', 'Discrimination', 'Retaliation',
  'Bias in Hiring', 'Hostile Environment', 'Accessibility Barrier',
  'Religious Accommodation', 'Disability Discrimination', 'Bias in Performance Review'
];
const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['Open', 'Investigating', 'Resolved', 'Closed'];
const OUTCOMES = ['Pending', 'Substantiated', 'Unsubstantiated', 'Inconclusive'];

const emptyForm = {
  incident_type: 'Microaggression',
  department: '',
  severity: 'Low',
  status: 'Open',
  reported_date: '',
  resolved_date: '',
  category: '',
  description: '',
  action_taken: '',
  reporter_demographic: '',
  investigation_outcome: 'Pending',
  days_to_resolve: '',
  notes: ''
};

function IncidentReports({ token }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [recordAiAnalysis, setRecordAiAnalysis] = useState(null);
  const [recordAiLoading, setRecordAiLoading] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/incident-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch incident reports:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalIncidents = data.length;
  const openInvestigatingCount = data.filter(d => d.status === 'Open' || d.status === 'Investigating').length;
  const resolvedItems = data.filter(d => parseFloat(d.days_to_resolve) > 0);
  const avgDaysToResolve = resolvedItems.length > 0
    ? (resolvedItems.reduce((sum, d) => sum + (parseFloat(d.days_to_resolve) || 0), 0) / resolvedItems.length).toFixed(1)
    : '0.0';
  const criticalCount = data.filter(d => d.severity === 'Critical').length;

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/incident-reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowCreateModal(false);
        setFormData({ ...emptyForm });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to create incident report:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/incident-reports/${selectedRecord.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowEditModal(false);
        setShowDetailModal(false);
        setSelectedRecord(null);
        setFormData({ ...emptyForm });
        fetchData();
      }
    } catch (err) {
      console.error('Failed to update incident report:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`${API}/incident-reports/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete incident report:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-incidents`, {
        method: 'POST',
        headers
      });
      const json = await res.json();
      setAiAnalysis(json.analysis || json.message || JSON.stringify(json));
    } catch (err) {
      setAiAnalysis('Failed to get AI analysis.');
    }
    setAiLoading(false);
  };

  // AI Analysis (single record)
  const handleRecordAiAnalysis = async (e, record) => {
    e.stopPropagation();
    setRecordAiLoading(true);
    setRecordAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-record`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ record, type: 'incident_reports' })
      });
      const json = await res.json();
      setRecordAiAnalysis(json.analysis || json.message || JSON.stringify(json));
    } catch (err) {
      setRecordAiAnalysis('Failed to get AI analysis for this record.');
    }
    setRecordAiLoading(false);
  };

  // Row click -> detail
  const openDetail = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  // Open edit from detail
  const openEdit = () => {
    setFormData({
      incident_type: selectedRecord.incident_type || 'Microaggression',
      department: selectedRecord.department || '',
      severity: selectedRecord.severity || 'Low',
      status: selectedRecord.status || 'Open',
      reported_date: selectedRecord.reported_date || '',
      resolved_date: selectedRecord.resolved_date || '',
      category: selectedRecord.category || '',
      description: selectedRecord.description || '',
      action_taken: selectedRecord.action_taken || '',
      reporter_demographic: selectedRecord.reporter_demographic || '',
      investigation_outcome: selectedRecord.investigation_outcome || 'Pending',
      days_to_resolve: selectedRecord.days_to_resolve || '',
      notes: selectedRecord.notes || ''
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Low': return <span className="badge-success">{severity}</span>;
      case 'Medium': return <span className="badge-warning">{severity}</span>;
      case 'High': return <span className="badge-danger">{severity}</span>;
      case 'Critical': return <span className="badge-danger" style={{ fontWeight: 'bold' }}>{severity}</span>;
      default: return <span>{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Open': return <span className="badge-warning">{status}</span>;
      case 'Investigating': return <span className="badge-info">{status}</span>;
      case 'Resolved': return <span className="badge-success">{status}</span>;
      case 'Closed': return <span className="badge-neutral">{status}</span>;
      default: return <span>{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    return new Date(dateStr).toLocaleDateString();
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Incident' : 'New Incident'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Incident Type</label>
                <select name="incident_type" value={formData.incident_type} onChange={handleFormChange} required>
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="form-group">
                <label>Severity</label>
                <select name="severity" value={formData.severity} onChange={handleFormChange} required>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} required>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Reported Date</label>
                <input
                  type="date"
                  name="reported_date"
                  value={formData.reported_date}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Resolved Date</label>
                <input
                  type="date"
                  name="resolved_date"
                  value={formData.resolved_date}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  placeholder="e.g. Verbal, Written"
                />
              </div>
              <div className="form-group">
                <label>Reporter Demographic</label>
                <input
                  type="text"
                  name="reporter_demographic"
                  value={formData.reporter_demographic}
                  onChange={handleFormChange}
                  placeholder="e.g. Female, Hispanic"
                />
              </div>
              <div className="form-group">
                <label>Investigation Outcome</label>
                <select name="investigation_outcome" value={formData.investigation_outcome} onChange={handleFormChange}>
                  {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Days to Resolve</label>
                <input
                  type="number"
                  name="days_to_resolve"
                  value={formData.days_to_resolve}
                  onChange={handleFormChange}
                  placeholder="e.g. 14"
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Describe the incident..."
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Action Taken</label>
                <textarea
                  name="action_taken"
                  value={formData.action_taken}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Actions taken in response..."
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="2"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {isEdit ? 'Update Incident' : 'Create Incident'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Incident Reports</h2>
          <p>Track and manage workplace incidents related to DEI</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Incident
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{totalIncidents}</div>
          <div className="stat-text">Total Incidents</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{openInvestigatingCount}</div>
          <div className="stat-text">Open / Investigating</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgDaysToResolve}</div>
          <div className="stat-text">Avg Days to Resolve</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{criticalCount}</div>
          <div className="stat-text">Critical</div>
        </div>
      </div>

      {/* AI Analysis Panel (full dataset) */}
      <AIAnalysisPanel
        analysis={aiAnalysis}
        loading={aiLoading}
        onClose={() => setAiAnalysis(null)}
      />

      {/* Record-level AI Analysis Panel */}
      <AIAnalysisPanel
        analysis={recordAiAnalysis}
        loading={recordAiLoading}
        onClose={() => setRecordAiAnalysis(null)}
      />

      {/* Data Table */}
      <div className="data-table-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading incident reports...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No incident reports found. Click "New Incident" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Department</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported</th>
                <th>Resolved</th>
                <th>Outcome</th>
                <th>Days</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.incident_type}</td>
                  <td>{row.department}</td>
                  <td>{getSeverityBadge(row.severity)}</td>
                  <td>{getStatusBadge(row.status)}</td>
                  <td>{formatDate(row.reported_date)}</td>
                  <td>{formatDate(row.resolved_date)}</td>
                  <td>{row.investigation_outcome || '--'}</td>
                  <td>{row.days_to_resolve || '--'}</td>
                  <td>
                    <button
                      className="btn-ai"
                      style={{ padding: '4px 10px', fontSize: '12px' }}
                      onClick={(e) => handleRecordAiAnalysis(e, row)}
                    >
                      AI Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && renderFormModal(false)}

      {/* Edit Modal */}
      {showEditModal && renderFormModal(true)}

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Incident Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Incident Type</div>
                  <div className="detail-value">{selectedRecord.incident_type}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Department</div>
                  <div className="detail-value">{selectedRecord.department}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Severity</div>
                  <div className="detail-value">{getSeverityBadge(selectedRecord.severity)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">{getStatusBadge(selectedRecord.status)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Reported Date</div>
                  <div className="detail-value">{formatDate(selectedRecord.reported_date)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Resolved Date</div>
                  <div className="detail-value">{formatDate(selectedRecord.resolved_date)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Category</div>
                  <div className="detail-value">{selectedRecord.category || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Reporter Demographic</div>
                  <div className="detail-value">{selectedRecord.reporter_demographic || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Investigation Outcome</div>
                  <div className="detail-value">{selectedRecord.investigation_outcome || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Days to Resolve</div>
                  <div className="detail-value">{selectedRecord.days_to_resolve || '--'}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Description</div>
                  <div className="detail-value">{selectedRecord.description || 'No description'}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Action Taken</div>
                  <div className="detail-value">{selectedRecord.action_taken || 'No action taken recorded'}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label">Notes</div>
                  <div className="detail-value">{selectedRecord.notes || 'No notes'}</div>
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '1.5rem' }}>
                <button className="btn-danger" onClick={handleDelete}>Delete</button>
                <button className="btn-primary" onClick={openEdit}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IncidentReports;
