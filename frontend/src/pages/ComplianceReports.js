import React, { useState, useEffect, useCallback } from 'react';
import AIAnalysisPanel from '../components/AIAnalysisPanel';

const API = 'http://localhost:3001/api';

const emptyForm = {
  report_name: '',
  regulation: '',
  status: 'Pending',
  compliance_score: '',
  due_date: '',
  submitted_date: '',
  findings: '',
  recommendations: '',
  assigned_to: '',
  priority: 'medium',
  notes: ''
};

function formatDate(value) {
  if (!value) return '--';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Completed': return 'badge-success';
    case 'In Progress': return 'badge-warning';
    case 'Pending': return 'badge-danger';
    default: return 'badge-neutral';
  }
}

function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'critical': return 'badge-danger';
    case 'high': return 'badge-warning';
    case 'medium': return 'badge-info';
    case 'low': return 'badge-neutral';
    default: return 'badge-neutral';
  }
}

function ComplianceReports({ token }) {
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
      const res = await fetch(`${API}/compliance-reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error('Failed to fetch compliance reports:', err);
      setData([]);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stats
  const totalReports = data.length;
  const completedCount = data.filter(d => d.status === 'Completed').length;
  const avgScore = totalReports > 0
    ? (data.reduce((sum, d) => sum + (parseFloat(d.compliance_score) || 0), 0) / totalReports).toFixed(1)
    : '0.0';
  const criticalHighCount = data.filter(d => d.priority === 'critical' || d.priority === 'high').length;

  // Create
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/compliance-reports`, {
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
      console.error('Failed to create compliance report:', err);
    }
  };

  // Edit
  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/compliance-reports/${selectedRecord.id}`, {
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
      console.error('Failed to update compliance report:', err);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      const res = await fetch(`${API}/compliance-reports/${selectedRecord.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setShowDetailModal(false);
        setSelectedRecord(null);
        fetchData();
      }
    } catch (err) {
      console.error('Failed to delete compliance report:', err);
    }
  };

  // AI Analysis (full dataset)
  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const res = await fetch(`${API}/ai/analyze-compliance`, {
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
        body: JSON.stringify({ record, type: 'compliance_reports' })
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
      report_name: selectedRecord.report_name || '',
      regulation: selectedRecord.regulation || '',
      status: selectedRecord.status || 'Pending',
      compliance_score: selectedRecord.compliance_score || '',
      due_date: selectedRecord.due_date ? selectedRecord.due_date.substring(0, 10) : '',
      submitted_date: selectedRecord.submitted_date ? selectedRecord.submitted_date.substring(0, 10) : '',
      findings: selectedRecord.findings || '',
      recommendations: selectedRecord.recommendations || '',
      assigned_to: selectedRecord.assigned_to || '',
      priority: selectedRecord.priority || 'medium',
      notes: selectedRecord.notes || ''
    });
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Form modal (shared between create and edit)
  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Compliance Report' : 'New Compliance Report'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Report Name</label>
                <input
                  type="text"
                  name="report_name"
                  value={formData.report_name}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. Q1 DEI Compliance Audit"
                />
              </div>
              <div className="form-group">
                <label>Regulation</label>
                <input
                  type="text"
                  name="regulation"
                  value={formData.regulation}
                  onChange={handleFormChange}
                  required
                  placeholder="e.g. EEO-1, OFCCP"
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleFormChange} required>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Compliance Score (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="compliance_score"
                  value={formData.compliance_score}
                  onChange={handleFormChange}
                  placeholder="e.g. 85.5"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Submitted Date</label>
                <input
                  type="date"
                  name="submitted_date"
                  value={formData.submitted_date}
                  onChange={handleFormChange}
                />
              </div>
              <div className="form-group">
                <label>Assigned To</label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleFormChange}
                  placeholder="e.g. Jane Smith"
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={formData.priority} onChange={handleFormChange} required>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Findings</label>
                <textarea
                  name="findings"
                  value={formData.findings}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Describe audit findings..."
                />
              </div>
              <div className="form-group full-width">
                <label>Recommendations</label>
                <textarea
                  name="recommendations"
                  value={formData.recommendations}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Describe recommendations..."
                />
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {isEdit ? 'Update Report' : 'Create Report'}
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
          <h2>Compliance Reports</h2>
          <p>Track and manage regulatory compliance reports and audits</p>
        </div>
        <div className="header-actions">
          <button className="btn-ai" onClick={handleAiAnalysis}>
            AI Analysis
          </button>
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setShowCreateModal(true); }}>
            + New Report
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{totalReports}</div>
          <div className="stat-text">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{completedCount}</div>
          <div className="stat-text">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{avgScore}%</div>
          <div className="stat-text">Avg Compliance Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{criticalHighCount}</div>
          <div className="stat-text">Critical/High Priority</div>
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
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading compliance reports...</p>
        ) : data.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>No compliance reports found. Click "+ New Report" to add one.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Regulation</th>
                <th>Status</th>
                <th>Score%</th>
                <th>Due Date</th>
                <th>Submitted</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                  <td>{row.report_name}</td>
                  <td>{row.regulation}</td>
                  <td>
                    <span className={getStatusBadgeClass(row.status)}>
                      {row.status}
                    </span>
                  </td>
                  <td>{row.compliance_score != null ? `${parseFloat(row.compliance_score).toFixed(1)}%` : '--'}</td>
                  <td>{formatDate(row.due_date)}</td>
                  <td>{formatDate(row.submitted_date)}</td>
                  <td>{row.assigned_to || '--'}</td>
                  <td>
                    <span className={getPriorityBadgeClass(row.priority)}>
                      {row.priority || '--'}
                    </span>
                  </td>
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
              <h3>Compliance Report Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Report Name</div>
                  <div className="detail-value">{selectedRecord.report_name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Regulation</div>
                  <div className="detail-value">{selectedRecord.regulation}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Status</div>
                  <div className="detail-value">
                    <span className={getStatusBadgeClass(selectedRecord.status)}>
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Compliance Score</div>
                  <div className="detail-value">
                    {selectedRecord.compliance_score != null ? `${parseFloat(selectedRecord.compliance_score).toFixed(1)}%` : '--'}
                  </div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Due Date</div>
                  <div className="detail-value">{formatDate(selectedRecord.due_date)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Submitted Date</div>
                  <div className="detail-value">{formatDate(selectedRecord.submitted_date)}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Assigned To</div>
                  <div className="detail-value">{selectedRecord.assigned_to || '--'}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Priority</div>
                  <div className="detail-value">
                    <span className={getPriorityBadgeClass(selectedRecord.priority)}>
                      {selectedRecord.priority || '--'}
                    </span>
                  </div>
                </div>
                <div className="detail-item full-width">
                  <div className="detail-label">Findings</div>
                  <div className="detail-value">{selectedRecord.findings || 'No findings recorded'}</div>
                </div>
                <div className="detail-item full-width">
                  <div className="detail-label">Recommendations</div>
                  <div className="detail-value">{selectedRecord.recommendations || 'No recommendations recorded'}</div>
                </div>
                <div className="detail-item full-width">
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

export default ComplianceReports;
